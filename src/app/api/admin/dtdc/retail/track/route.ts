import { NextResponse } from "next/server";
import { db } from "@/app/db/postgres";
import { consignments, trackingEvents } from "@/app/db/schema";
import { eq, sql } from "drizzle-orm";

const TRACK_URL =
  "https://www.dtdc.com/wp-json/custom/v1/domestic/track";

const RETAIL_CLIENT_ID = 549;
const BATCH_SIZE = 15; // 🔥 safe parallelism

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    out.push(arr.slice(i, i + size));
  }
  return out;
}

function toDate(ts?: string | null) {
  if (!ts) return null;
  const d = new Date(ts.replace(" ", "T"));
  return isNaN(d.getTime()) ? null : d;
}

export async function POST(req: Request) {
  try {
    const { awbs } = await req.json();

    if (!Array.isArray(awbs) || awbs.length === 0) {
      return NextResponse.json(
        { ok: false, error: "AWBs required" },
        { status: 400 }
      );
    }

    const results: any[] = [];
    const batches = chunk(awbs, BATCH_SIZE);

    // 🔁 PROCESS IN BATCHES
    for (const batch of batches) {
      const jobs = batch.map(async (awb: string) => {
        try {
          const res = await fetch(TRACK_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              trackNumber: awb,
              trackType: "cnno",
            }),
          });

          const json = await res.json();

          if (!res.ok || json?.statusCode !== 200 || !json?.header) {
            return { awb, error: "Retail tracking failed" };
          }

          const header = json.header;
          const statuses = Array.isArray(json.statuses) ? json.statuses : [];

          // 1️⃣ UPSERT CONSIGNMENT
          await db
            .insert(consignments)
            .values({
              awb,
              client_id: RETAIL_CLIENT_ID,
              provider: "dtdc",
              origin: header.originCity ?? null,
              destination: header.destinationCity ?? null,
              current_status: header.currentStatusDescription ?? null,
              last_status_at: toDate(header.currentStatusDate),
              updated_at: sql`NOW()`,
            })
            .onConflictDoUpdate({
              target: consignments.awb,
              set: {
                current_status: sql`excluded.current_status`,
                last_status_at: sql`excluded.last_status_at`,
                origin: sql`excluded.origin`,
                destination: sql`excluded.destination`,
                provider: "dtdc",
                client_id: RETAIL_CLIENT_ID,
                updated_at: sql`NOW()`,
              },
            });

          // 2️⃣ GET CONSIGNMENT ID
          const row = await db
            .select({ id: consignments.id })
            .from(consignments)
            .where(eq(consignments.awb, awb))
            .limit(1);

          if (!row.length) {
            return { awb, error: "consignment_not_found_after_upsert" };
          }

          const consignmentId = row[0].id;

          // 3️⃣ INSERT EVENTS
          for (const s of statuses) {
            await db.insert(trackingEvents).values({
              consignment_id: consignmentId,
              awb,
              provider: "dtdc",
              status: s.statusDescription ?? "",
              location: s.actCityName ?? s.actBranchName ?? null,
              remarks: s.remarks ?? null,
              event_time: toDate(s.statusTimestamp),
            });
          }

          return {
            awb,
            status: header.currentStatusDescription,
            events: statuses.length,
          };
        } catch (err: any) {
          return { awb, error: err.message };
        }
      });

      const batchResults = await Promise.allSettled(jobs);

      for (const r of batchResults) {
        if (r.status === "fulfilled") {
          results.push(r.value);
        } else {
          results.push({ error: r.reason });
        }
      }
    }

    return NextResponse.json({
      ok: true,
      total: awbs.length,
      processed: results.length,
      results,
    });

  } catch (err: any) {
    console.error("RETAIL TRACK ERROR:", err);
    return NextResponse.json(
      { ok: false, error: err.message },
      { status: 500 }
    );
  }
}