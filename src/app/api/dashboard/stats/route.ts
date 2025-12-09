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
      return NextResponse.json(
        { error: "Missing provider query param" },
        { status: 400 }
      );
    }

    const p = provider.toLowerCase().trim();
    const jsonLiteral = `'${JSON.stringify([p])}'::jsonb`;

    /* ------------------------------------
       MAIN PROVIDER STATS (already working)
       ------------------------------------ */
    const total = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(consignments)
      .where(sql`providers::jsonb @> ${sql.raw(jsonLiteral)}`);

    const delivered = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(consignments)
      .where(
        sql`providers::jsonb @> ${sql.raw(jsonLiteral)}
            AND LOWER(last_status) LIKE '%deliver%'`
      );

    const rto = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(consignments)
      .where(
        sql`providers::jsonb @> ${sql.raw(jsonLiteral)}
            AND LOWER(last_status) LIKE '%rto%'`
      );

    const pending = total[0].count - delivered[0].count - rto[0].count;

    /* ------------------------------------
       CLIENT-WISE STATS (only for DTDC)
       ------------------------------------ */
    let clientStats: any[] = [];

    if (p === "dtdc") {
      const result = await db.$client.query(`
        SELECT
          c.id AS client_id,
          c.company_name,

          COUNT(*) AS total,

          COUNT(*) FILTER (WHERE LOWER(co.last_status) LIKE '%deliver%') AS delivered,
          COUNT(*) FILTER (WHERE LOWER(co.last_status) LIKE '%rto%') AS rto,
          COUNT(*) FILTER (
            WHERE LOWER(co.last_status) NOT LIKE '%deliver%'
            AND LOWER(co.last_status) NOT LIKE '%rto%'
          ) AS pending

        FROM consignments co
        JOIN users c ON c.id = co.client_id

        WHERE co.providers::jsonb @> '${JSON.stringify([p])}'::jsonb

        GROUP BY c.id, c.company_name
        ORDER BY c.company_name ASC;
      `);

      clientStats = result;
    }

  return NextResponse.json({
    provider: p,
    total: total[0].count,
    delivered: delivered[0].count,
    pending,
    rto: rto[0].count,
    clients: clientStats,
  });

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}