// /api/cron/track/dtdc/route.ts
import { NextResponse } from "next/server";
import { db } from "@/app/db/postgres";
import {
  consignments,
  trackingEvents,
  clientCredentials,
  users,
} from "@/app/db/schema";
import { sql, eq, and } from "drizzle-orm";
import { decrypt } from "@/app/lib/crypto/encryption";

export const dynamic = "force-dynamic";

const BATCH_SIZE = 30;
const PROVIDER = 1;

/* --------------------------------------------
   LOAD DTDC CREDS
-------------------------------------------- */
async function loadDtdcCredentials(clientId: number) {
  const rows = await db
    .select()
    .from(clientCredentials)
    .where(
      and(
        eq(clientCredentials.client_id, clientId),
        eq(clientCredentials.provider_id, PROVIDER)
      )
    );

  const creds: Record<string, string> = {};
  for (const r of rows) {
    creds[r.env_key] = decrypt(r.encrypted_value) || "";
  }

  return {
    apiToken: creds["api_token"],
  };
}

/* --------------------------------------------
   UTILS
-------------------------------------------- */
function chunk<T>(arr: T[], size: number) {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size)
    out.push(arr.slice(i, i + size));
  return out;
}

/* --------------------------------------------
   CRON
-------------------------------------------- */
export async function GET() {
  try {
    const clients = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.role, "client"));

    let totalUpdated = 0;

    for (const c of clients) {
      const clientId = Number(c.id);

      const creds = await loadDtdcCredentials(clientId);
      if (!creds.apiToken) continue;

      const pending = await db.execute(sql`
        SELECT id, awb, current_status
        FROM consignments
        WHERE client_id = ${clientId}
          AND provider = ${PROVIDER}
          AND LOWER(current_status) NOT LIKE '%deliver%'
          AND LOWER(current_status) NOT LIKE '%rto%'
        LIMIT 300
      `);

      if (!pending.rows.length) continue;

      const groups = chunk(pending.rows, BATCH_SIZE);

      for (const group of groups) {
        const awbs = group.map(r => r.awb);

        const res = await fetch(
          "https://blktracksvc.dtdc.com/dtdc-api/rest/JSONCnTrk/getTrackDetails",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-Access-Token": creds.apiToken,
            },
            body: JSON.stringify({ awbs }),
          }
        );

        const body = await res.json();
        if (!body?.data) continue;

        for (const item of body.data) {
          const cons = group.find(x => x.awb === item.awb);
          if (!cons) continue;

          const latest = item.events?.[0];
          if (!latest) continue;

          const newStatus = latest.status;
          const eventTime = new Date(
            `${latest.date}T${latest.time || "00:00:00"}`
          );

          // 🔹 update consignment
          await db
            .update(consignments)
            .set({
              current_status: newStatus,
              origin: latest.origin || null,
              destination: latest.destination || null,
              last_status_at: eventTime,
              updated_at: new Date(),
            })
            .where(eq(consignments.id, cons.id));

          // 🔹 dedup insert event
          await db
            .insert(trackingEvents)
            .values({
              consignment_id: cons.id,
              provider: PROVIDER,
              awb: cons.awb,
              status: newStatus,
              location: latest.origin || null,
              remarks: latest.remarks || null,
              event_time: eventTime,
              raw: latest,
            })
            .onConflictDoNothing();

          totalUpdated++;
        }
      }
    }

    return NextResponse.json({
      ok: true,
      updated: totalUpdated,
      provider: PROVIDER,
    });
  } catch (err) {
    console.error("DTDC cron error:", err);
    return NextResponse.json(
      { ok: false, error: String(err) },
      { status: 500 }
    );
  }
}