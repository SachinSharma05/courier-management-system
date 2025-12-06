import { NextResponse } from "next/server";
import { db } from "@/app/db/postgres";
import {
  consignments,
  trackingEvents,
  trackingHistory,
  clientCredentials,
  users,
} from "@/app/db/schema";
import { sql, eq, and } from "drizzle-orm";
import { decrypt } from "@/app/lib/crypto/encryption";

export const dynamic = "force-dynamic";

const BATCH_SIZE = 30;
const PROVIDER_ID_DTDC = 1; // adjust if needed

/* --------------------------------------------
   LOAD CREDS FOR A CLIENT → SPECIFIC PROVIDER (DTDC)
-------------------------------------------- */
async function loadDtdcCredentials(clientId: number) {
  const rows = await db
    .select()
    .from(clientCredentials)
    .where(
      and(
        eq(clientCredentials.client_id, clientId),
        eq(clientCredentials.provider_id, PROVIDER_ID_DTDC)
      )
    );

  const creds: Record<string, string | undefined> = {};

  for (const r of rows) {
    creds[r.env_key] = decrypt(r.encrypted_value) || undefined;
  }

  return {
    apiToken: creds["api_token"],
    customerCode: creds["DTDC_CUSTOMER_CODE"],
  };
}

/* --------------------------------------------
   CHUNK UTILITY
-------------------------------------------- */
function chunk<T>(arr: T[], size: number) {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

/* --------------------------------------------
   MAIN CRON EXECUTION
-------------------------------------------- */
export async function GET() {
  try {
    /* Step 1: load all "client" accounts */
    const clients = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.role, "client"));

    if (!clients.length)
      return NextResponse.json({ ok: true, message: "No clients found." });

    let totalUpdated = 0;

    /* Step 2: process each client individually */
    for (const c of clients) {
      const clientId = Number(c.id);

      // Load credentials
      const creds = await loadDtdcCredentials(clientId);
      if (!creds.apiToken) {
        console.log(`Skipping client ${clientId} — No DTDC credentials.`);
        continue;
      }

      /* Step 3: fetch this client's AWBs needing update */
      const pending = await db.execute(sql`
        SELECT id, awb, last_status
        FROM consignments
        WHERE client_id = ${clientId}
        AND LOWER(last_status) NOT LIKE '%deliver%'
        AND LOWER(last_status) NOT LIKE '%rto%'
        LIMIT 300;
      `);

      if (!pending.rows.length) continue;

      const awbs = pending.rows;
      const groups = chunk(awbs, BATCH_SIZE);

      console.log(
        `Client ${clientId} → tracking ${awbs.length} pending consignments`
      );

      /* Step 4: Call DTDC batch API for each group */
      for (const group of groups) {
        const list = group.map((x) => x.awb);

        const res = await fetch(
          "https://blktracksvc.dtdc.com/dtdc-api/rest/JSONCnTrk/getTrackDetails",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-Access-Token": creds.apiToken,
            },
            body: JSON.stringify({ awbs: list }),
          }
        );

        let body;
        try {
          body = await res.json();
        } catch {
          console.log("Failed to parse DTDC response for client:", clientId);
          continue;
        }

        if (!body?.data) continue;

        /* Step 5: process each AWB update */
        for (const item of body.data) {
          const cons = awbs.find((x) => x.awb === item.awb);
          if (!cons) continue;

          const latest = item.events?.[0];
          if (!latest) continue;

          const oldStatus = cons.last_status || null;
          const newStatus = latest.status;

          /* --- Update consignment --- */
          await db
            .update(consignments)
            .set({
                lastStatus: newStatus,
                origin: latest.origin || null,
                destination: latest.destination || null,
                lastUpdatedOn: new Date(),
                updatedAt: new Date(),
            })
            .where(eq(consignments.id, cons.id));

          /* --- Insert into trackingEvents (dedupe by date/time/action) --- */
          await db
            .insert(trackingEvents)
            .values({
              consignmentId: cons.id,
              action: newStatus,
              actionDate: latest.date || null,
              actionTime: latest.time || null,
              origin: latest.origin || null,
              destination: latest.destination || null,
              remarks: latest.remarks || null,
            })
            .onConflictDoNothing();

          /* --- Insert into trackingHistory (old → new) --- */
          if (oldStatus !== newStatus) {
            await db.insert(trackingHistory).values({
              consignmentId: cons.id,
              oldStatus: oldStatus,
              newStatus: newStatus,
              changedAt: new Date(),
            });
          }

          totalUpdated++;
        }
      }
    }

    return NextResponse.json({
      ok: true,
      updated: totalUpdated,
      message: "Cron auto-tracking completed successfully",
    });
  } catch (err) {
    console.error("Cron error:", err);
    return NextResponse.json(
      { ok: false, error: String(err) },
      { status: 500 }
    );
  }
}
