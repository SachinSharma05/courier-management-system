// /api/dashboard/stats/route.ts
import { NextResponse } from "next/server";
import { db } from "@/app/db/postgres";
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

    // 🚨 This API is intentionally DTDC-only
    if (p !== "dtdc") {
      return NextResponse.json(
        { error: "Stats API currently supports only DTDC" },
        { status: 400 }
      );
    }

    /* ============================================================
       1️⃣ PROVIDER-LEVEL STATS (CANONICAL, SAFE)
       RULE:
         - if status contains 'rto' → RTO
         - else if status = 'delivered' → DELIVERED
         - else → PENDING
    ============================================================ */
    const providerStatsRes = await db.execute(sql`
      SELECT
        COUNT(*)::int AS total,

        COUNT(*) FILTER (
          WHERE final_status = 'DELIVERED'
        )::int AS delivered,

        COUNT(*) FILTER (
          WHERE final_status = 'RTO'
        )::int AS rto,

        COUNT(*) FILTER (
          WHERE final_status = 'PENDING'
        )::int AS pending

      FROM (
        SELECT
          CASE
            WHEN LOWER(current_status) LIKE '%rto%'
              THEN 'RTO'
            WHEN LOWER(current_status) = 'delivered'
              THEN 'DELIVERED'
            ELSE 'PENDING'
          END AS final_status
        FROM consignments
        WHERE LOWER(provider) = 'dtdc'
      ) t;
    `);

    const providerRow = providerStatsRes.rows[0] || {
      total: 0,
      delivered: 0,
      rto: 0,
      pending: 0,
    };

    /* ============================================================
       2️⃣ CLIENT-WISE STATS (USES SAME CLASSIFICATION)
    ============================================================ */
    const clientStatsRes = await db.execute(sql`
      SELECT
        u.id AS client_id,
        COALESCE(u.company_name, u.username, '') AS company_name,

        COUNT(*)::int AS total,

        COUNT(*) FILTER (
          WHERE final_status = 'DELIVERED'
        )::int AS delivered,

        COUNT(*) FILTER (
          WHERE final_status = 'RTO'
        )::int AS rto,

        COUNT(*) FILTER (
          WHERE final_status = 'PENDING'
        )::int AS pending

      FROM (
        SELECT
          co.client_id,
          CASE
            WHEN LOWER(co.current_status) LIKE '%rto%'
              THEN 'RTO'
            WHEN LOWER(co.current_status) = 'delivered'
              THEN 'DELIVERED'
            ELSE 'PENDING'
          END AS final_status
        FROM consignments co
        WHERE LOWER(co.provider) = 'dtdc'
      ) x
      JOIN users u ON u.id = x.client_id
      GROUP BY u.id, u.company_name, u.username
      ORDER BY company_name NULLS LAST, u.id;
    `);

    const clients = (clientStatsRes.rows || []).map((r: any) => ({
      client_id: Number(r.client_id),
      company_name: r.company_name,
      total: Number(r.total),
      delivered: Number(r.delivered),
      rto: Number(r.rto),
      pending: Number(r.pending),
    }));

    /* ============================================================
       FINAL RESPONSE
    ============================================================ */
    return NextResponse.json({
      provider: "dtdc",

      total: Number(providerRow.total),
      delivered: Number(providerRow.delivered),
      rto: Number(providerRow.rto),
      pending: Number(providerRow.pending),

      clients,
    });
  } catch (err: any) {
    console.error("Stats API error:", err);
    return NextResponse.json(
      { error: err.message },
      { status: 500 }
    );
  }
}