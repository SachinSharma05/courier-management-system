// /api/dtdc/track (optimized + safe batching version)
import { NextResponse } from "next/server";
import { db } from "@/app/db/postgres";
import {
  consignments,
  trackingEvents,
  trackingHistory,
  clientCredentials
} from "@/app/db/schema";
import { eq, and, sql, inArray, notInArray } from "drizzle-orm";
import { decrypt } from "@/app/lib/crypto/encryption";

// ------------------------------------------
// HELPERS
// ------------------------------------------
function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    out.push(arr.slice(i, i + size));
  }
  return out;
}

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
// MAIN API — batching added (ONLY CHANGE)
// ------------------------------------------
export async function POST(req: Request) {
  try {
    const body = await req.json();
    let { consignments: awbs, clientId, provider } = body;

    if (!clientId)
      return NextResponse.json({ error: "clientId missing" }, { status: 400 });

    if (!provider)
      return NextResponse.json({ error: "provider missing" }, { status: 400 });

    // -------------------------------------------------------------------
    // ⭐ AUTO-FETCH PENDING AWBS IF NONE SUPPLIED
    // -------------------------------------------------------------------
    if (!Array.isArray(awbs) || awbs.length === 0) {
      const pending = await db
        .select({ awb: consignments.awb })
        .from(consignments)
        .where(
          and(
            eq(consignments.client_id, clientId),
            notInArray(consignments.lastStatus, ["DELIVERED", "RTO", "RETAIL"])
          )
        );

      awbs = pending.map(p => p.awb);

      if (awbs.length === 0) {
        return NextResponse.json({ ok: true, message: "No pending consignments" });
      }
    }

    // ------------------------------------------
    // LOAD CREDS
    // ------------------------------------------
    const creds = await loadDtdcCredentials(clientId);

    if (!creds.token)
      return NextResponse.json({ error: "Missing DTDC token" }, { status: 400 });

    if (!creds.customerCode)
      return NextResponse.json({ error: "Missing DTDC customer code" }, { status: 400 });

    const TRACK_URL = "https://blktracksvc.dtdc.com/dtdc-api/rest/JSONCnTrk/getTrackDetails";

    const DTDC_TRACKING_TOKEN = creds.token;
    const DTDC_CUSTOMER_CODE = creds.customerCode;

    const results = [];

    // ------------------------------------------
    // EXISTING CONSIGNMENTS FOR PREVIOUS STATE
    // ------------------------------------------
    const existing = await db
      .select({
        awb: consignments.awb,
        lastStatus: consignments.lastStatus,
        id: consignments.id
      })
      .from(consignments)
      .where(inArray(consignments.awb, awbs));

    const existingMap = new Map(existing.map(r => [r.awb, r]));

    const bulkConsignmentRows: any[] = [];
    const bulkEventRows: any[] = [];
    const bulkHistoryRows: any[] = [];

    // ------------------------------------------
    // TRACK EACH AWB
    // ------------------------------------------
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
        const header = parsed.header;

        const prev = existingMap.get(awb);
        const prevStatus = prev?.lastStatus ?? null;

        bulkConsignmentRows.push({
          awb,
          lastStatus: header.currentStatus,
          origin: header.origin,
          destination: header.destination,
          bookedOn: header.bookedOn,
          lastUpdatedOn: toJsDate(header.lastUpdatedOn),
          providers: [provider],
          client_id: clientId,
          updatedAt: sql`NOW()`
        });

        for (const t of parsed.timeline) {
          bulkEventRows.push({
            awb,
            action: t.strAction ?? "",
            actionDate: parseDtdcDate(t.strActionDate),
            actionTime: parseDtdcTime(t.strActionTime),
            origin: t.strOrigin ?? null,
            destination: t.strDestination ?? null,
            remarks: t.sTrRemarks ?? t.strRemarks ?? null
          });
        }

        const newStatus = header.currentStatus ?? null;
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

    // ------------------------------------------
    // UPSERT CONSIGNMENTS (unchanged)
    // ------------------------------------------
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

    // ------------------------------------------
    // CONSIGNMENT IDs
    // ------------------------------------------
    const newRows = await db
      .select({ awb: consignments.awb, id: consignments.id })
      .from(consignments)
      .where(inArray(consignments.awb, awbs));

    const idMap = new Map(newRows.map(r => [r.awb, r.id]));

    // ------------------------------------------
    // ⭐ EVENT INSERT — NOW BATCHED (200 rows)
    // ------------------------------------------
    const eventInsertValues = bulkEventRows
      .map(e => {
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
      const batches = chunk(eventInsertValues, 200);
      for (const batch of batches) {
        await db.insert(trackingEvents).values(batch).onConflictDoNothing();
      }
    }

    // ------------------------------------------
    // ⭐ HISTORY INSERT — NOW BATCHED (200 rows)
    // ------------------------------------------
    const histInsert = bulkHistoryRows
      .map(h => {
        const cid = idMap.get(h.awb);
        if (!cid) return null;
        return {
          consignmentId: cid,
          oldStatus: h.oldStatus,
          newStatus: h.newStatus
        };
      })
      .filter(Boolean) as any[];

    if (histInsert.length > 0) {
      const batches = chunk(histInsert, 200);
      for (const batch of batches) {
        await db.insert(trackingHistory).values(batch);
      }
    }

    return NextResponse.json({ ok: true, results });

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
