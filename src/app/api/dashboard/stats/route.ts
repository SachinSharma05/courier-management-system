// /api/dashboard/stats/route.ts
import { NextResponse } from "next/server";
import { db } from "@/app/db/postgres";
import { consignments } from "@/app/db/schema";
import { sql } from "drizzle-orm";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const provider = searchParams.get("provider");
    if (!provider) {
      return NextResponse.json({ error: "Missing provider query param" }, { status: 400 });
    }
    const p = provider.toLowerCase().trim();
    const providerJsonb = JSON.stringify([p]);

    // provider-level totals (keep using your existing proven queries)
    const totalRes = await db.select({ count: sql<number>`COUNT(*)` })
      .from(consignments)
      .where(sql`providers::jsonb @> ${sql.raw(`'${providerJsonb}'::jsonb`)}`);
    const deliveredRes = await db.select({ count: sql<number>`COUNT(*)` })
      .from(consignments)
      .where(sql`providers::jsonb @> ${sql.raw(`'${providerJsonb}'::jsonb`)} 
                  AND LOWER(last_status) LIKE '%deliver%'`);
    const rtoRes = await db.select({ count: sql<number>`COUNT(*)` })
      .from(consignments)
      .where(sql`providers::jsonb @> ${sql.raw(`'${providerJsonb}'::jsonb`)} 
                  AND (
                    LOWER(last_status) LIKE '%rto%'
                    OR LOWER(last_status) LIKE '%return%'
                    OR LOWER(last_status) LIKE '%returned%'
                    OR LOWER(last_status) LIKE '%return to origin%'
                  )`);

    const totalProviderCount = Number(totalRes[0].count ?? 0);
    const totalDelivered = Number(deliveredRes[0].count ?? 0);
    const totalRto = Number(rtoRes[0].count ?? 0);
    const totalPending = totalProviderCount - totalDelivered - totalRto;

    // client-wise aggregation — use SUM(CASE...) to mirror Track page logic exactly
    let clientStats: any[] = [];

    if (p === "dtdc") {
      const sqlQuery = `
        SELECT
          u.id AS client_id,
          COALESCE(u.company_name, u.username, '') AS company_name,

          COUNT(*)::bigint AS total,

          SUM(CASE WHEN LOWER(co.last_status) LIKE '%deliver%' THEN 1 ELSE 0 END)::bigint AS delivered,

          SUM(
            CASE
              WHEN LOWER(co.last_status) LIKE '%rto%' THEN 1
              WHEN LOWER(co.last_status) LIKE '%return%' THEN 1
              WHEN LOWER(co.last_status) LIKE '%returned%' THEN 1
              WHEN LOWER(co.last_status) LIKE '%return to origin%' THEN 1
              ELSE 0
            END
          )::bigint AS rto,

          (COUNT(*) 
            - SUM(CASE WHEN LOWER(co.last_status) LIKE '%deliver%' THEN 1 ELSE 0 END)
            - SUM(
                CASE
                  WHEN LOWER(co.last_status) LIKE '%rto%' THEN 1
                  WHEN LOWER(co.last_status) LIKE '%return%' THEN 1
                  WHEN LOWER(co.last_status) LIKE '%returned%' THEN 1
                  WHEN LOWER(co.last_status) LIKE '%return to origin%' THEN 1
                  ELSE 0
                END
              )
          )::bigint AS pending

        FROM consignments co
        JOIN users u ON u.id = co.client_id

        WHERE co.providers::jsonb @> $1::jsonb

        GROUP BY u.id, u.company_name, u.username
        ORDER BY u.company_name NULLS LAST, u.id;
      `;

      // run parameterized query — db.$client.query may return either { rows } or an array
      const rawResult: any = await db.$client.query(sqlQuery, [providerJsonb]);

      // normalize both possible shapes
      const rows = Array.isArray(rawResult) ? rawResult : (rawResult.rows ?? rawResult);
      clientStats = rows.map((r: any) => ({
        client_id: Number(r.client_id),
        company_name: r.company_name,
        total: Number(r.total),
        delivered: Number(r.delivered),
        rto: Number(r.rto),
        pending: Number(r.pending),
      }));
    }

    return NextResponse.json({
      provider: p,
      total: totalProviderCount,
      delivered: totalDelivered,
      rto: totalRto,
      pending: totalPending,
      clients: clientStats,
    });
  } catch (err: any) {
    console.error("Stats API error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}