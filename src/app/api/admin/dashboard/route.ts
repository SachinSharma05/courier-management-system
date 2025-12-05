// app/api/admin/dashboard/route.ts
import { NextResponse } from "next/server";
import { db } from "@/app/db/postgres";
import { users, consignments, complaints } from "@/app/db/schema";
import { eq, sql, desc } from "drizzle-orm";

/* ================================================================
   HELPER: FETCH PROVIDER STATISTICS
   - Counts total consignments for a provider
   - Separates Delivered, Pending, RTO
================================================================ */
async function getProviderStats(provider: string) {
  const result = await db.execute(sql`
    SELECT
      COUNT(*) AS total,
      COUNT(*) FILTER (WHERE LOWER(last_status) LIKE '%deliver%') AS delivered,
      COUNT(*) FILTER (WHERE LOWER(last_status) LIKE '%rto%') AS rto,
      COUNT(*) FILTER (
        WHERE LOWER(last_status) NOT LIKE '%deliver%'
        AND LOWER(last_status) NOT LIKE '%rto%'
      ) AS pending
    FROM consignments
    WHERE providers::jsonb @> ${JSON.stringify([provider])}::jsonb
  `);

  const row = result.rows[0] || {};

  return {
    total: Number(row.total || 0),
    delivered: Number(row.delivered || 0),
    pending: Number(row.pending || 0),
    rto: Number(row.rto || 0),
  };
}

/* ================================================================
   HELPER: GET TREND PERIOD CONFIGURATION
   filter = "daily" | "weekly" | "monthly"
================================================================ */
function getTrendConfig(filter: string) {
  if (filter === "daily") {
    return {
      interval: "1 day",
      truncate: "hour",
      label: "TO_CHAR(DATE_TRUNC('hour', created_at), 'HH24:MI')"
    };
  }

  if (filter === "weekly") {
    return {
      interval: "7 days",
      truncate: "day",
      label: "TO_CHAR(DATE_TRUNC('day', created_at), 'Mon DD')"
    };
  }

  // default: monthly
  return {
    interval: "30 days",
    truncate: "day",
    label: "TO_CHAR(DATE_TRUNC('day', created_at), 'Mon DD')"
  };
}

/* ================================================================
   MAIN DASHBOARD HANDLER
   Returns:
   - provider stats
   - clients list
   - complaints list
   - pie chart summary
   - trend chart data
================================================================ */
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const filter = url.searchParams.get("filter") ?? "monthly";

    /* ------------------------------------------------------------
       1) PROVIDER STATISTICS (DTDC, Delhivery, XB, Aramex)
    ------------------------------------------------------------ */
    const dtdc = await getProviderStats("dtdc");
    const delhivery = await getProviderStats("delhivery");
    const xpressbees = await getProviderStats("xpressbees");

    // Aramex currently unused → return zero
    const aramax = { total: 0, delivered: 0, pending: 0, rto: 0 };

    const providerStats = {
      dtdc,
      delhivery,
      xpressbees,
      aramax,
    };

    /* ------------------------------------------------------------
       2) CLIENTS LIST (for sidebar)
    ------------------------------------------------------------ */
    const dbClients = await db
      .select({
        id: users.id,
        username: users.username,
        email: users.email,
        company_name: users.company_name,
        contact_person: users.contact_person,
        phone: users.phone,
        created_at: users.created_at,
      })
      .from(users)
      .where(eq(users.role, "client"))
      .orderBy(users.id);

    /* ------------------------------------------------------------
       3) COMPLAINTS LIST (scrollable section)
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
      .orderBy(complaints.updated_at);

    /* ------------------------------------------------------------
       4) PIE CHART BREAKDOWN (combined status of all providers)
       delivered = sum of all provider delivered
       pending   = sum of all provider pending
       rto       = sum of all provider rto
    ------------------------------------------------------------ */
    const pieChart = {
      delivered:
        dtdc.delivered +
        delhivery.delivered +
        xpressbees.delivered +
        aramax.delivered,

      pending:
        dtdc.pending +
        delhivery.pending +
        xpressbees.pending +
        aramax.pending,

      rto:
        dtdc.rto +
        delhivery.rto +
        xpressbees.rto +
        aramax.rto,
    };

    /* ------------------------------------------------------------
       5) TREND CHART DATA (daily/weekly/monthly)
       Returns:
       [
         { label: "01 May", value: 55 },
         { label: "02 May", value: 78 }
       ]
    ------------------------------------------------------------ */
    const cfg = getTrendConfig(filter);

    // TREND (BOOKED DATA)
    const trendRows = await db.execute(sql`
      SELECT
        TO_CHAR(DATE_TRUNC('day', booked_on), 'Mon DD') AS label,
        COUNT(*)::int AS value,
        DATE_TRUNC('day', booked_on) AS sort_order
      FROM consignments
      WHERE booked_on IS NOT NULL
      AND booked_on > NOW() - INTERVAL '30 days'
      GROUP BY label, sort_order
      ORDER BY sort_order
    `);

    const trendData = trendRows.rows ?? [];

    /* ------------------------------------------------------------
       6) RECENT CONSIGNMENTS (latest 15 shipments)
    ------------------------------------------------------------ */
    const recent = await db
      .select({
        id: consignments.id,
        awb: consignments.awb,
        providers: consignments.providers,
        last_status: consignments.lastStatus,
        lastUpdatedOn: consignments.lastUpdatedOn,
      })
      .from(consignments)
      .orderBy(desc(consignments.lastUpdatedOn))
      .limit(15);

    /* ------------------------------------------------------------
       FINAL RESPONSE OBJECT
    ------------------------------------------------------------ */
    return NextResponse.json({
      ok: true,

      // Provider boxes
      providers: providerStats,

      // Right sidebar list
      clients: dbClients,

      // Complaints scroll list
      complaints: dbComplaints,

      // Pie chart stats
      pie: pieChart,

      // Trend line chart
      trend: trendData,

      // Recent consignments
      recent
    });

  } catch (error: any) {
    console.error("DASHBOARD API ERROR:", error);
    return NextResponse.json(
      { ok: false, error: error.message },
      { status: 500 }
    );
  }
}
