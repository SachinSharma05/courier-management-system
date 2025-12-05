// /api/dtdc/track (optimized FAST version)

import { NextResponse } from "next/server";
import { db } from "@/app/db/postgres";
import {
  consignments,
  trackingEvents,
  trackingHistory,
  clientCredentials
} from "@/app/db/schema";
import { eq, and, sql, inArray } from "drizzle-orm";
import { decrypt } from "@/app/lib/crypto/encryption";

// ------------------------------------------
// LOAD CREDS
// ------------------------------------------
async function loadDtdcCredentials(clientId: number) {
  const rows = await db
    .select()
    .from(clientCredentials)
    .where(eq(clientCredentials.client_id, clientId));

  const creds: Record<string, string | undefined> = {};

  for (const r of rows) {
    const val = decrypt(r.encrypted_value);
    creds[r.env_key] = val ?? undefined;
  }

  return {
    token: creds["api_token"],
    customerCode: creds["DTDC_CUSTOMER_CODE"]
  };
}

// ------------------------------------------
// PARSERS (UNCHANGED)
// ------------------------------------------
function parseDtdcDate(raw: string | null): string | null {
  if (!raw || raw.length !== 8) return null;
  return `${raw.substring(4, 8)}-${raw.substring(2, 4)}-${raw.substring(0, 2)}`;
}

function parseDtdcTime(raw: string | null): string | null {
  if (!raw || raw.length !== 4) return null;
  return `${raw.substring(0, 2)}:${raw.substring(2, 4)}:00`;
}

function parseDtdcDateTime(dateRaw: string | null, timeRaw: string | null): string | null {
  const d = parseDtdcDate(dateRaw);
  const t = parseDtdcTime(timeRaw);
  return d && t ? `${d} ${t}` : d;
}

function toJsDate(ts: string | null): Date | null {
  if (!ts) return null;
  const d = new Date(ts.replace(" ", "T"));
  return isNaN(d.getTime()) ? null : d;
}

function parseDTDC(json: any) {
  const h = json?.trackHeader ?? {};

  return {
    header: {
      shipmentNo: h.strShipmentNo,
      origin: h.strOrigin,
      destination: h.strDestination,
      bookedOn: parseDtdcDate(h.strBookedDate),
      currentStatus: h.strStatus,
      lastUpdatedOn: parseDtdcDateTime(h.strStatusTransOn, h.strStatusTransTime)
    },
    timeline: json?.trackDetails ?? [],
    raw: json
  };
}

// ------------------------------------------
// MAIN API — OPTIMIZED
// ------------------------------------------
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { consignments: awbs, clientId, provider } = body;

    if (!Array.isArray(awbs) || awbs.length === 0)
      return NextResponse.json({ error: "consignments missing" }, { status: 400 });

    if (!clientId)
      return NextResponse.json({ error: "clientId missing" }, { status: 400 });

    if (!provider)
      return NextResponse.json({ error: "provider missing" }, { status: 400 });

    // LOAD CREDS
    const creds = await loadDtdcCredentials(clientId);

    if (!creds.token)
      return NextResponse.json({ error: "Missing DTDC token" }, { status: 400 });

    if (!creds.customerCode)
      return NextResponse.json({ error: "Missing DTDC customer code" }, { status: 400 });

    const TRACK_URL =
      "https://blktracksvc.dtdc.com/dtdc-api/rest/JSONCnTrk/getTrackDetails";

    const DTDC_TRACKING_TOKEN = creds.token;
    const DTDC_CUSTOMER_CODE = creds.customerCode;

    const results = [];

    // ----------------------------------------------------
    // 🔥 We will collect everything first
    // ----------------------------------------------------
    const bulkConsignmentRows: any[] = [];
    const bulkEventRows: any[] = [];
    const bulkHistoryRows: any[] = [];

    // Fetch existing consignments in one go (avoid per-AWB queries)
    const existing = await db
      .select({
        awb: consignments.awb,
        lastStatus: consignments.lastStatus,
        id: consignments.id
      })
      .from(consignments)
      .where(inArray(consignments.awb, awbs));

    const existingMap = new Map(existing.map((r) => [r.awb, r]));

    // ----------------------------------------------------
    // TRACK ALL AWBs FIRST
    // ----------------------------------------------------
    for (const awb of awbs) {
      try {
        const res = await fetch(TRACK_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Access-Token": DTDC_TRACKING_TOKEN
          },
          body: JSON.stringify({
            trkType: "cnno",
            strcnno: awb,
            addtnlDtl: "Y",
            customerCode: DTDC_CUSTOMER_CODE
          })
        });

        const rawText = await res.text();

        let json;
        try {
          json = JSON.parse(rawText);
        } catch {
          results.push({ awb, error: "Invalid JSON from DTDC" });
          continue;
        }

        if (!res.ok) {
          results.push({ awb, error: json?.message ?? "DTDC error" });
          continue;
        }

        const parsed = parseDTDC(json);

        const bookedOnISO = parsed.header.bookedOn;
        const lastUpdatedJS = toJsDate(parsed.header.lastUpdatedOn);

        const prev = existingMap.get(awb);
        const prevStatus = prev?.lastStatus ?? null;
        const existingId = prev?.id ?? null;

        // ------------------------------
        // UPSERT CONSIGNMENT (bulk later)
        // ------------------------------
        bulkConsignmentRows.push({
          awb,
          lastStatus: parsed.header.currentStatus,
          origin: parsed.header.origin,
          destination: parsed.header.destination,
          bookedOn: bookedOnISO,
          lastUpdatedOn: lastUpdatedJS,
          providers: [provider],
          client_id: clientId,
          updatedAt: sql`NOW()`
        });

        // ------------------------------
        // TIMELINE (bulk later)
        // ------------------------------
        for (const t of parsed.timeline) {
          const action = t.strAction ?? "";
          const actionDate = parseDtdcDate(t.strActionDate);
          const actionTime = parseDtdcTime(t.strActionTime);
          const origin = t.strOrigin ?? null;
          const destination = t.strDestination ?? null;
          const remarks = t.sTrRemarks ?? t.strRemarks ?? null;

          bulkEventRows.push({
            awb,
            action,
            actionDate,
            actionTime,
            origin,
            destination,
            remarks
          });
        }

        // ------------------------------
        // STATUS HISTORY (bulk later)
        // ------------------------------
        const newStatus = parsed.header.currentStatus ?? null;
        if (prevStatus !== newStatus) {
          bulkHistoryRows.push({
            awb,
            oldStatus: prevStatus,
            newStatus
          });
        }

        results.push({ awb, parsed });
      } catch (err: any) {
        results.push({ awb, error: err.message });
      }
    }

    // --------------------------------------------
    // 🔥 1. BULK UPSERT CONSIGNMENTS
    // --------------------------------------------
    await db
      .insert(consignments)
      .values(bulkConsignmentRows)
      .onConflictDoUpdate({
        target: consignments.awb,
        set: {
          lastStatus: sql`excluded.last_status`,
          origin: sql`excluded.origin`,
          destination: sql`excluded.destination`,
          bookedOn: sql`excluded.booked_on`,
          lastUpdatedOn: sql`excluded.last_updated_on`,
          providers: sql`excluded.providers`,
          client_id: sql`excluded.client_id`,
          updatedAt: sql`NOW()`
        }
      });

    // --------------------------------------------
    // Fetch consignment IDs so we can map AWB → ID
    // --------------------------------------------
    const newRows = await db
      .select({ awb: consignments.awb, id: consignments.id })
      .from(consignments)
      .where(inArray(consignments.awb, awbs));

    const idMap = new Map(newRows.map((r) => [r.awb, r.id]));

    // --------------------------------------------
    // 🔥 2. BULK INSERT EVENTS (ignore duplicates)
    // --------------------------------------------
    const eventInsertValues = bulkEventRows
    .map((e) => {
      const cid = idMap.get(e.awb);
      if (!cid) return null;
      return {
        consignmentId: cid,
        action: e.action,
        actionDate: e.actionDate,
        actionTime: e.actionTime,
        origin: e.origin,
        destination: e.destination,
        remarks: e.remarks
      };
    })
    .filter(Boolean) as any[];

    if (eventInsertValues.length > 0) {
      await db
        .insert(trackingEvents)
        .values(eventInsertValues)
        .onConflictDoNothing();
    }

    // --------------------------------------------
    // 🔥 3. BULK INSERT STATUS HISTORY
    // --------------------------------------------
    const histInsert = bulkHistoryRows.map((h) => ({
      consignmentId: idMap.get(h.awb),
      oldStatus: h.oldStatus,
      newStatus: h.newStatus
    }));

    if (histInsert.length > 0) {
      await db.insert(trackingHistory).values(histInsert);
    }

    // --------------------------------------------
    // DONE
    // --------------------------------------------
    return NextResponse.json({ results });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
