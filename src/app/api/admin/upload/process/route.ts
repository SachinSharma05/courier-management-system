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

const DTDC_URL =
  "https://blktracksvc.dtdc.com/dtdc-api/rest/JSONCnTrk/getTrackDetails";

/* ---------------------------------------------
   HELPERS
--------------------------------------------- */
function chunk<T>(arr: T[], size: number): T[][] {
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
  for (const r of rows) creds[r.env_key] = decrypt(r.encrypted_value);

  return {
    token: creds["api_token"],
    customerCode: creds["DTDC_CUSTOMER_CODE"],
  };
}

function parseDTDCResponse(json: any) {
  if (!json) return { error: "empty_response" };

  if (json.statusFlag === false || json.status === "FAILED") {
    const err = json.errorDetails;
    if (Array.isArray(err) && err.length) {
      const msg = err.map((e: any) => `${e.name}:${e.value}`).join("; ");
      return { error: msg, json };
    }
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
      lastUpdatedOn: parseDtdcDateTime(
        header.strStatusTransOn,
        header.strStatusTransTime
      ),
    },
    timeline,
    raw: json,
  };
}

/* ---------------------------------------------
   MAIN API
--------------------------------------------- */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const groups: { code: string; awbs: string[] }[] = body?.groups ?? [];

    if (!Array.isArray(groups) || groups.length === 0) {
      return NextResponse.json(
        { ok: false, error: "No groups provided" },
        { status: 400 }
      );
    }

    const finalResults: any[] = [];

    for (const group of groups) {
      const code = (group.code ?? "").toUpperCase().trim();
      const awbs = (group.awbs ?? [])
        .map((a) => a.toString().trim())
        .filter(Boolean);

      if (!awbs.length) {
        finalResults.push({ code, totalAwbs: 0 });
        continue;
      }

      // 🚫 IF549 skip (UNCHANGED)
      if (code === "IF549") {
        finalResults.push({
          code,
          skipped: true,
          message: "IF549 is excluded from processing",
        });
        continue;
      }

      // Resolve clientId (UNCHANGED)
      const credsRows = await db
        .select()
        .from(clientCredentials)
        .where(eq(clientCredentials.env_key, "DTDC_CUSTOMER_CODE"));

      let clientId: number | null = null;
      for (const r of credsRows) {
        if (decrypt(r.encrypted_value) === code) {
          clientId = Number(r.client_id);
          break;
        }
      }
      clientId = clientId ?? 1;

      const creds = await loadDtdcCredentials(clientId);
      if (!creds.token || !creds.customerCode) {
        finalResults.push({
          code,
          clientId,
          error: "missing_dtdc_credentials",
        });
        continue;
      }

      /* ---------------------------------------------
         PRELOAD CONSIGNMENTS (UPDATED COLUMNS)
      --------------------------------------------- */
      const existingRows = await db
        .select({
          awb: consignments.awb,
          id: consignments.id,
          current_status: consignments.current_status,
          origin: consignments.origin,
          destination: consignments.destination,
          booked_at: consignments.booked_at,
          last_status_at: consignments.last_status_at,
        })
        .from(consignments)
        .where(inArray(consignments.awb, awbs));

      const existingMap = new Map(existingRows.map((r) => [r.awb, r]));

      const bulkConsignmentRows: any[] = [];
      const bulkEventRows: any[] = [];
      const bulkHistoryRows: any[] = [];

      /* ---------------------------------------------
         BATCH PROCESS AWBs (UNCHANGED LOGIC)
      --------------------------------------------- */
      const batches = chunk(awbs, 25);

      for (const batch of batches) {
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
              const prev = existingMap.get(awb);
              bulkConsignmentRows.push({
                awb,
                client_id: clientId,
                provider: "dtdc",
                origin: prev?.origin ?? null,
                destination: prev?.destination ?? null,
                booked_at: prev?.booked_at ?? null,
                last_status_at: prev?.last_status_at ?? null,
                current_status: "NO DATA FOUND",
                updated_at: sql`NOW()`,
              });
              return;
            }

            const parsed = parseDTDCResponse(json);
            if (parsed.error) {
              const prev = existingMap.get(awb);
              bulkConsignmentRows.push({
                awb,
                client_id: clientId,
                provider: "dtdc",
                origin: prev?.origin ?? null,
                destination: prev?.destination ?? null,
                booked_at: prev?.booked_at ?? null,
                last_status_at: prev?.last_status_at ?? null,
                current_status: "NO DATA FOUND",
                updated_at: sql`NOW()`,
              });
              return;
            }

            const hdr = parsed.header!;
            const timeline = parsed.timeline;
            const prev = existingMap.get(awb);
            const prevStatus = prev?.current_status ?? null;

            bulkConsignmentRows.push({
              awb,
              client_id: clientId,
              provider: "dtdc",
              origin: hdr.origin ?? null,
              destination: hdr.destination ?? null,
              booked_at: hdr.bookedOn ? new Date(hdr.bookedOn) : null,
              last_status_at: toJsDate(hdr.lastUpdatedOn),
              current_status: hdr.currentStatus ?? null,
              updated_at: sql`NOW()`,
            });

            for (const t of timeline) {
              const eventTime = toJsDate(
                parseDtdcDateTime(t.strActionDate, t.strActionTime)
              );

              bulkEventRows.push({
                awb,
                status: t.strAction ?? "",
                location: t.strDestination ?? t.strOrigin ?? null,
                remarks: t.sTrRemarks ?? t.strRemarks ?? null,
                event_time: eventTime,
              });
            }

            const newStatus = hdr.currentStatus ?? null;
            if (prevStatus !== newStatus) {
              bulkHistoryRows.push({
                awb,
                oldStatus: prevStatus,
                newStatus,
              });
            }
          } catch {
            const prev = existingMap.get(awb);
            bulkConsignmentRows.push({
              awb,
              client_id: clientId,
              provider: "dtdc",
              origin: prev?.origin ?? null,
              destination: prev?.destination ?? null,
              booked_at: prev?.booked_at ?? null,
              last_status_at: prev?.last_status_at ?? null,
              current_status: "NO DATA FOUND",
              updated_at: sql`NOW()`,
            });
          }
        });

        await Promise.allSettled(promises);
      }

      /* ---------------------------------------------
         UPSERT CONSIGNMENTS (UPDATED)
      --------------------------------------------- */
      if (bulkConsignmentRows.length > 0) {
        await db
          .insert(consignments)
          .values(bulkConsignmentRows)
          .onConflictDoUpdate({
            target: consignments.awb,
            set: {
              current_status: sql`excluded.current_status`,
              booked_at: sql`excluded.booked_at`,
              last_status_at: sql`excluded.last_status_at`,
              origin: sql`excluded.origin`,
              destination: sql`excluded.destination`,
              provider: sql`excluded.provider`,
              client_id: sql`excluded.client_id`,
              updated_at: sql`NOW()`,
            },
          });
      }

      /* ---------------------------------------------
         FETCH ID MAP
      --------------------------------------------- */
      const allCons = await db
        .select({ awb: consignments.awb, id: consignments.id })
        .from(consignments)
        .where(inArray(consignments.awb, awbs));

      const idMap = new Map(allCons.map((r) => [r.awb, r.id]));

      /* ---------------------------------------------
         INSERT EVENTS (UPDATED SCHEMA)
      --------------------------------------------- */
      const eventInsertValues = bulkEventRows
        .map((e) => {
          const cid = idMap.get(e.awb);
          if (!cid) return null;
          return {
            consignment_id: cid,
            provider: "dtdc",
            awb: e.awb,
            status: e.status,
            location: e.location,
            remarks: e.remarks,
            event_time: e.event_time,
          };
        })
        .filter(Boolean) as any[];

      if (eventInsertValues.length > 0) {
        const batches = chunk(eventInsertValues, 200);
        for (const batch of batches) {
          await db.insert(trackingEvents).values(batch).onConflictDoNothing();
        }
      }

      /* ---------------------------------------------
         INSERT HISTORY (UNCHANGED)
      --------------------------------------------- */
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
        .filter(Boolean) as any[];

      if (historyInsertValues.length > 0) {
        const batches = chunk(historyInsertValues, 200);
        for (const batch of batches) {
          await db.insert(trackingHistory).values(batch);
        }
      }

      finalResults.push({
        code,
        clientId,
        totalAwbs: awbs.length,
        consignmentsUpserted: bulkConsignmentRows.length,
        eventsInserted: eventInsertValues.length,
        historyInserted: historyInsertValues.length,
      });
    }

    return NextResponse.json({ ok: true, groups: finalResults });
  } catch (err: any) {
    console.error("UPLOAD PROCESS ERROR:", err);
    return NextResponse.json(
      { ok: false, error: err?.message ?? String(err) },
      { status: 500 }
    );
  }
}