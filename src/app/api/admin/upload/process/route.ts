// /api/admin/upload/process
import { NextResponse } from "next/server";
import { db } from "@/app/db/postgres";
import {
  consignments,
  trackingEvents,
  trackingHistory,
  clientCredentials,
} from "@/app/db/schema";
import { decrypt } from "@/app/lib/crypto/encryption";
import { eq, inArray, sql } from "drizzle-orm";

/**
 * Implementation notes:
 * - DTDC accepts one AWB per request (see DTDC doc). We process AWBs in batches of 25
 *   purely to limit concurrency. Each AWB is requested individually in parallel.
 *   Reference: DTDC REST Tracking API doc. :contentReference[oaicite:1]{index=1}
 */

// DTDC endpoint
const DTDC_URL = "https://blktracksvc.dtdc.com/dtdc-api/rest/JSONCnTrk/getTrackDetails";

// helpers
function chunk<T>(arr: T[], size = 25): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

function parseDtdcDate(raw: string | null): string | null {
  if (!raw || raw.length !== 8) return null;
  return `${raw.substring(4, 8)}-${raw.substring(2, 4)}-${raw.substring(0, 2)}`;
}

function parseDtdcTime(raw: string | null): string | null {
  if (!raw || raw.length !== 4) return null;
  return `${raw.substring(0, 2)}:${raw.substring(2, 4)}:00`;
}

function parseDtdcDateTime(d: string | null, t: string | null): string | null {
  const date = parseDtdcDate(d);
  const time = parseDtdcTime(t);
  return date && time ? `${date} ${time}` : date;
}

function toJsDate(ts: string | null): Date | null {
  if (!ts) return null;
  const d = new Date(ts.replace(" ", "T"));
  return isNaN(d.getTime()) ? null : d;
}

async function loadDtdcCredentials(clientId: number) {
  const rows = await db
    .select()
    .from(clientCredentials)
    .where(eq(clientCredentials.client_id, clientId));

  const creds: Record<string, string | undefined> = {};
  for (const r of rows) {
    creds[r.env_key] = decrypt(r.encrypted_value);
  }

  return {
    token: creds["api_token"],
    customerCode: creds["DTDC_CUSTOMER_CODE"],
  };
}

function parseDTDCResponse(json: any) {
  // Matches the single-AWB JSON structure from DTDC doc
  // Returns { header, timeline } or { error: string }
  if (!json) return { error: "empty_response" };

  // DTDC uses fields: statusFlag/status/statusCode + trackHeader + trackDetails
  if (json.statusFlag === false || json.status === "FAILED") {
    // check for errorDetails array
    const err = json.errorDetails;
    if (Array.isArray(err) && err.length) {
      const msg = err.map((e: any) => `${e.name}:${e.value}`).join("; ");
      return { error: msg, json };
    }
    // fallback to generic
    return { error: "DTDC returned failure", json };
  }

  const header = json.trackHeader ?? null;
  const timeline = Array.isArray(json.trackDetails) ? json.trackDetails : [];

  if (!header) return { error: "no_header", json };

  return {
    header: {
      shipmentNo: header.strShipmentNo,
      origin: header.strOrigin,
      destination: header.strDestination,
      bookedOn: parseDtdcDate(header.strBookedDate),
      currentStatus: header.strStatus,
      lastUpdatedOn: parseDtdcDateTime(header.strStatusTransOn, header.strStatusTransTime),
    },
    timeline,
    raw: json,
  };
}

// Main API
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const groups: { code: string; awbs: string[] }[] = body?.groups ?? [];

    if (!Array.isArray(groups) || groups.length === 0) {
      return NextResponse.json({ ok: false, error: "No groups provided" }, { status: 400 });
    }

    const finalResults: any[] = [];

    for (const group of groups) {
      const code = (group.code ?? "").toString().trim();
      const awbs = (group.awbs ?? []).map((a) => a.toString().trim()).filter(Boolean);

      if (!awbs.length) {
        finalResults.push({ code, message: "no_awbs", total: 0 });
        continue;
      }

      // Resolve clientId by searching clientCredentials where env_key = DTDC_CUSTOMER_CODE
      const credsRows = await db
        .select()
        .from(clientCredentials)
        .where(eq(clientCredentials.env_key, "DTDC_CUSTOMER_CODE"));

      let clientId: number | null = null;
      for (const r of credsRows) {
        const val = decrypt(r.encrypted_value);
        if (val === code) {
          clientId = Number(r.client_id);
          break;
        }
      }
      clientId = clientId ?? 1; // fallback to admin/retail

      // Load DTDC token + customer code for client
      const creds = await loadDtdcCredentials(clientId);
      if (!creds.token || !creds.customerCode) {
        finalResults.push({ code, clientId, error: "missing_dtdc_credentials" });
        continue;
      }

      // Prepare arrays for bulk DB operations
      const bulkConsignmentRows: any[] = [];
      const bulkEventRows: any[] = [];
      const bulkHistoryRows: any[] = [];

      // Fetch existing consignments once (for prior status)
      const existingRows = await db
        .select({
          awb: consignments.awb,
          id: consignments.id,
          lastStatus: consignments.lastStatus,
        })
        .from(consignments)
        .where(inArray(consignments.awb, awbs));

      const existingMap = new Map(existingRows.map((r: any) => [r.awb, r]));

      // Chunk into batches of 25 (controls concurrency)
      const batches = chunk(awbs, 25);

      for (const batch of batches) {
        // For a batch, we will issue parallel fetches (one per AWB)
        const promises = batch.map(async (awb) => {
          try {
            const res = await fetch(DTDC_URL, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "X-Access-Token": creds.token!,
              },
              body: JSON.stringify({
                trkType: "cnno",
                strcnno: awb,
                addtnlDtl: "Y",
                customerCode: creds.customerCode,
              }),
            });

            const text = await res.text();
            let json;
            try {
              json = JSON.parse(text);
            } catch {
              return { awb, error: "invalid_json", raw: text };
            }

            // parse using the single-awb parser
            const parsed = parseDTDCResponse(json);

            if (parsed.error) {
              // If error indicates NO DATA FOUND, we still insert a consignment row (Option 1)
              // DTDC uses errorDetails / strError for no data. We'll treat all failures as "NO DATA FOUND" for visibility.
              const prev = existingMap.get(awb);
              bulkConsignmentRows.push({
                awb,
                client_id: clientId,
                providers: ["dtdc"],
                origin: prev?.origin ?? null,
                destination: prev?.destination ?? null,
                bookedOn: prev?.bookedOn ?? null,
                lastUpdatedOn: prev?.lastUpdatedOn ?? null,
                lastStatus: "NO DATA FOUND",
                updatedAt: sql`NOW()`,
              });
              return { awb, error: parsed.error };
            }

            // Successful parse
            const hdr = parsed.header!;
            const timeline = parsed.timeline;

            const prev = existingMap.get(awb);
            const prevStatus = prev?.lastStatus ?? null;

            // push consignment upsert payload
            bulkConsignmentRows.push({
              awb,
              client_id: clientId,
              providers: ["dtdc"],
              origin: hdr.origin ?? null,
              destination: hdr.destination ?? null,
              bookedOn: hdr.bookedOn ?? null,
              lastUpdatedOn: toJsDate(hdr.lastUpdatedOn),
              lastStatus: hdr.currentStatus ?? null,
              updatedAt: sql`NOW()`,
            });

            // push events (raw timeline entries)
            for (const t of timeline) {
              bulkEventRows.push({
                awb,
                action: t.strAction ?? "",
                actionDate: parseDtdcDate(t.strActionDate),
                actionTime: parseDtdcTime(t.strActionTime),
                origin: t.strOrigin ?? null,
                destination: t.strDestination ?? null,
                remarks: t.sTrRemarks ?? t.strRemarks ?? null,
              });
            }

            // push history if status changed
            const newStatus = hdr.currentStatus ?? null;
            if (prevStatus !== newStatus) {
              bulkHistoryRows.push({
                awb,
                oldStatus: prevStatus,
                newStatus,
              });
            }

            return { awb, parsed: hdr };
          } catch (err: any) {
            // network or unexpected error -> record as NO DATA FOUND (visible)
            const prev = existingMap.get(awb);
            bulkConsignmentRows.push({
              awb,
              client_id: clientId,
              providers: ["dtdc"],
              origin: prev?.origin ?? null,
              destination: prev?.destination ?? null,
              bookedOn: prev?.bookedOn ?? null,
              lastUpdatedOn: prev?.lastUpdatedOn ?? null,
              lastStatus: "NO DATA FOUND",
              updatedAt: sql`NOW()`,
            });
            return { awb, error: err?.message ?? String(err) };
          }
        });

        // Run the batch in parallel and wait
        await Promise.allSettled(promises);
        // NOTE: results from the promises are only used for debugging; DB rows were collected in arrays.
      }

      // ---------- BULK UPSERT CONSIGNMENTS ----------
      if (bulkConsignmentRows.length > 0) {
        await db
          .insert(consignments)
          .values(bulkConsignmentRows)
          .onConflictDoUpdate({
            target: consignments.awb,
            set: {
              lastStatus: sql`excluded.last_status`,
              bookedOn: sql`excluded.booked_on`,
              lastUpdatedOn: sql`excluded.last_updated_on`,
              origin: sql`excluded.origin`,
              destination: sql`excluded.destination`,
              providers: sql`excluded.providers`,
              client_id: sql`excluded.client_id`,
              updatedAt: sql`NOW()`,
            },
          });
      }

      // Fetch inserted/updated consignment IDs
      const allCons = await db
        .select({ awb: consignments.awb, id: consignments.id })
        .from(consignments)
        .where(inArray(consignments.awb, awbs));

      const idMap = new Map(allCons.map((r: any) => [r.awb, r.id]));

      // ---------- BULK INSERT EVENTS (skip orphans & fix types) ----------
        const eventInsertValues = bulkEventRows
        .map((e) => {
            const cid = idMap.get(e.awb);
            if (!cid) return null; // orphan -> skip
            return {
            consignmentId: String(cid), // ensure a string (Drizzle typing)
            action: e.action,
            actionDate: e.actionDate,
            actionTime: e.actionTime,
            origin: e.origin,
            destination: e.destination,
            remarks: e.remarks,
            };
        })
        // type guard: tell TS these are not null
        .filter((v): v is {
            consignmentId: string;
            action: any;
            actionDate: any;
            actionTime: any;
            origin: any;
            destination: any;
            remarks: any;
        } => v !== null);

        if (eventInsertValues.length > 0) {
        await db.insert(trackingEvents).values(eventInsertValues).onConflictDoNothing();
        }

        // ---------- BULK INSERT HISTORY (skip orphans & fix types) ----------
        const historyInsertValues = bulkHistoryRows
        .map((h) => {
            const cid = idMap.get(h.awb);
            if (!cid) return null;
            return {
            consignmentId: String(cid),
            oldStatus: h.oldStatus,
            newStatus: h.newStatus,
            };
        })
        .filter((v): v is { consignmentId: string; oldStatus: any; newStatus: any } => v !== null);

        if (historyInsertValues.length > 0) {
        await db.insert(trackingHistory).values(historyInsertValues);
        }

      // push summary for this group
      finalResults.push({
        code,
        clientId,
        totalAwbs: awbs.length,
        batches: batches.length,
        consignmentsPrepared: bulkConsignmentRows.length,
        eventsPrepared: bulkEventRows.length,
        historyPrepared: bulkHistoryRows.length,
        consignmentsUpserted: bulkConsignmentRows.length > 0 ? bulkConsignmentRows.length : 0,
        eventsInserted: eventInsertValues.length,
        historyInserted: historyInsertValues.length,
      });
    }

    return NextResponse.json({ ok: true, groups: finalResults });
  } catch (err: any) {
    console.error("UPLOAD PROCESS ERROR:", err);
    return NextResponse.json({ ok: false, error: err?.message ?? String(err) }, { status: 500 });
  }
}
