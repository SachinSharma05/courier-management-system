// app/api/admin/dashboard/route.ts
import { NextResponse } from "next/server";
import { db } from "@/app/db/postgres";
import { complaints } from "@/app/db/schema";
import { sql } from "drizzle-orm";

export const dynamic = "force-dynamic";
export const revalidate = 120;

/* ================================================================
   HELPER: TREND CONFIG
================================================================ */
function getTrendConfig(filter: string) {
  if (filter === "daily") {
    return {
      interval: "1 day",
      truncate: "hour",
      label: "TO_CHAR(DATE_TRUNC('hour', booked_at), 'HH24:MI')",
    };
  }

  if (filter === "weekly") {
    return {
      interval: "7 days",
      truncate: "day",
      label: "TO_CHAR(DATE_TRUNC('day', booked_at), 'Mon DD')",
    };
  }

  return {
    interval: "30 days",
    truncate: "day",
    label: "TO_CHAR(DATE_TRUNC('day', booked_at), 'Mon DD')",
  };
}

/* ================================================================
   MAIN DASHBOARD API
================================================================ */
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const filter = url.searchParams.get("filter") ?? "monthly";
    const providerFilter = url.searchParams.get("provider") ?? "all";

    /* ------------------------------------------------------------
       1️⃣ PROVIDER STATS (single optimized query)
    ------------------------------------------------------------ */
    const statsRows = await db.execute(sql`
      SELECT
        provider,

        COUNT(*)::int AS total,

        COUNT(*) FILTER (
          WHERE
            LOWER(current_status) LIKE '%deliver%'
            AND LOWER(current_status) NOT LIKE '%rto%'
            AND LOWER(current_status) NOT LIKE '%undeliver%'
            AND LOWER(current_status) NOT LIKE '%redeliver%'
        )::int AS delivered,

        COUNT(*) FILTER (
          WHERE LOWER(current_status) LIKE '%rto%'
        )::int AS rto,

        COUNT(*) FILTER (
          WHERE
            LOWER(current_status) NOT LIKE '%deliver%'
            AND LOWER(current_status) NOT LIKE '%rto%'
        )::int AS pending

      FROM consignments
      GROUP BY provider
    `);

    const providers = {
      dtdc: { total: 0, delivered: 0, pending: 0, rto: 0 },
      delhivery: { total: 0, delivered: 0, pending: 0, rto: 0 },
      xpressbees: { total: 0, delivered: 0, pending: 0, rto: 0 },
      maruti: { total: 0, delivered: 0, pending: 0, rto: 0 },
    };

    for (const r of statsRows.rows as any[]) {
      const provider = String(r.provider) as keyof typeof providers;

      if (!providers[provider]) continue;

      const total = Number(r.total ?? 0);
      const delivered = Number(r.delivered ?? 0);
      const rto = Number(r.rto ?? 0);
      const pending = Number(r.pending ?? 0);

      providers[provider] = {
        total,
        delivered,
        pending,
        rto,
      };
    }

    /* ------------------------------------------------------------
       2️⃣ COMPLAINTS (latest first, capped)
    ------------------------------------------------------------ */
    const dbComplaints = await db
      .select({
        id: complaints.id,
        awb: complaints.awb,
        message: complaints.message,
        status: complaints.status,
        updated_at: complaints.updated_at,
      })
      .from(complaints)
      .orderBy(sql`${complaints.updated_at} DESC`)
      .limit(50);

    /* ------------------------------------------------------------
       3️⃣ PIE CHART (derived, unchanged logic)
    ------------------------------------------------------------ */
    const pie = {
      delivered:
        providers.dtdc.delivered +
        providers.delhivery.delivered +
        providers.xpressbees.delivered +
        providers.maruti.delivered,

      pending:
        providers.dtdc.pending +
        providers.delhivery.pending +
        providers.xpressbees.pending +
        providers.maruti.pending,

      rto:
        providers.dtdc.rto +
        providers.delhivery.rto +
        providers.xpressbees.rto +
        providers.maruti.rto,
    };

    /* ------------------------------------------------------------
       4️⃣ TREND DATA (provider + period aware)
    ------------------------------------------------------------ */
    const cfg = getTrendConfig(filter);

    const providerCondition =
      providerFilter === "all"
        ? sql`1=1`
        : sql`provider = ${providerFilter}`;

    const trendRows = await db.execute(sql`
      SELECT
        ${sql.raw(cfg.label)} AS label,
        COUNT(*)::int AS value,
        MIN(booked_at) AS sort_order
      FROM consignments
      WHERE booked_at IS NOT NULL
        AND booked_at >= NOW() - INTERVAL '${sql.raw(cfg.interval)}'
        AND ${providerCondition}
      GROUP BY label
      ORDER BY sort_order
    `);

    /* ------------------------------------------------------------
       FINAL RESPONSE
    ------------------------------------------------------------ */
    return NextResponse.json({
      ok: true,
      providers,
      complaints: dbComplaints,
      pie,
      trend: trendRows.rows ?? [],
    });
  } catch (error: any) {
    console.error("DASHBOARD API ERROR:", error);
    return NextResponse.json(
      { ok: false, error: error.message },
      { status: 500 }
    );
  }
}
