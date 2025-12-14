// /api/consignments/route.ts
import { NextResponse } from "next/server";
import { db } from "@/app/db/postgres";
import { sql } from "drizzle-orm";
import { computeTAT } from "@/lib/tracking/utils";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);

    // Pagination
    const page = Number(url.searchParams.get("page") ?? "1");
    const pageSize = Number(url.searchParams.get("pageSize") ?? "50");
    const offset = (page - 1) * pageSize;

    // Filters
    const search = url.searchParams.get("search")?.trim() ?? "";
    const status = url.searchParams.get("status")?.trim().toLowerCase() ?? "";
    const from = url.searchParams.get("from") ?? "";
    const to = url.searchParams.get("to") ?? "";
    const tatFilter = (url.searchParams.get("tat") ?? "all").toLowerCase();

    const clientIdParam = url.searchParams.get("clientId");
    if (!clientIdParam) {
      return NextResponse.json(
        { error: "clientId is required" },
        { status: 400 }
      );
    }

    const clientId = Number(clientIdParam);

    // ----------------------------------------------
    // WHERE CLAUSES (LOGIC UNCHANGED)
    // ----------------------------------------------
    const whereClauses: any[] = [];
    whereClauses.push(sql`c.client_id = ${clientId}`);

    if (search) {
      whereClauses.push(sql`c.awb ILIKE ${"%" + search + "%"}`);
    }

    if (status && status !== "all") {
      switch (status) {
        case "delivered":
          whereClauses.push(sql`LOWER(c.current_status) = 'delivered'`);
          break;

        case "rto":
        case "rto in transit":
          whereClauses.push(sql`
            LOWER(c.current_status) = 'rto'
            OR LOWER(c.current_status) = 'return to origin'
            OR LOWER(c.current_status) = 'returned'
            OR LOWER(c.current_status) = 'rto in transit'
          `);
          break;

        case "in transit":
          whereClauses.push(sql`LOWER(c.current_status) = 'in transit'`);
          break;

        case "out for delivery":
          whereClauses.push(sql`LOWER(c.current_status) = 'out for delivery'`);
          break;

        case "reached at destination":
          whereClauses.push(sql`LOWER(c.current_status) = 'reached at destination'`);
          break;

        case "received at delivery centre":
          whereClauses.push(sql`LOWER(c.current_status) = 'received at delivery centre'`);
          break;

        case "weekly off":
          whereClauses.push(sql`LOWER(c.current_status) = 'weekly off'`);
          break;

        case "undelivered":
          whereClauses.push(sql`LOWER(c.current_status) = 'undelivered'`);
          break;

        case "pending":
          whereClauses.push(sql`
            (
              c.current_status IS NULL
              OR LOWER(c.current_status) NOT LIKE '%deliver%'
              AND LOWER(c.current_status) NOT LIKE '%rto%'
              AND LOWER(c.current_status) NOT LIKE '%undeliver%'
              AND LOWER(c.current_status) NOT LIKE '%return%'
              AND LOWER(c.current_status) NOT LIKE '%cancel%'
              AND LOWER(c.current_status) NOT LIKE '%lost%'
            )
          `);
          break;
      }
    }

    if (from) whereClauses.push(sql`c.booked_at >= ${from}`);
    if (to) whereClauses.push(sql`c.booked_at <= ${to}`);

    const finalWhere = whereClauses.length
      ? sql`WHERE ${sql.join(whereClauses, sql` AND `)}`
      : sql``;

    // ----------------------------------------------
    // COUNT
    // ----------------------------------------------
    const countResult = await db.execute(sql`
      SELECT COUNT(*) AS count
      FROM consignments c
      ${finalWhere}
    `);

    const totalCount = Number(countResult.rows[0]?.count ?? 0);
    const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

    // ----------------------------------------------
    // MAIN QUERY (UPDATED TIMELINE)
    // ----------------------------------------------
    const rows = await db.execute(sql`
      SELECT
        c.id,
        c.awb,
        c.origin,
        c.destination,
        c.current_status,
        c.booked_at,
        c.last_status_at,

        COALESCE((
          SELECT json_agg(t ORDER BY t.event_time DESC)
          FROM (
            SELECT
              e.status,
              e.event_time,
              e.location,
              e.remarks
            FROM tracking_events e
            WHERE e.consignment_id = c.id
          ) t
        ), '[]') AS timeline

      FROM consignments c
      ${finalWhere}
      ORDER BY c.last_status_at DESC NULLS LAST, c.awb ASC
      LIMIT ${pageSize}
      OFFSET ${offset}
    `);

    const items = rows.rows
      .map((r: any) => {
        if (tatFilter !== "all") {
          const tat = computeTAT(
            r.awb,
            r.booked_at,
            r.current_status
          ).toLowerCase();

          if (!tat.includes(tatFilter)) return null;
        }

        return {
          awb: r.awb,
          last_status: r.current_status,
          origin: r.origin,
          destination: r.destination,
          booked_on: r.booked_at,
          last_updated_on: r.last_status_at,
          timeline: r.timeline,
        };
      })
      .filter(Boolean);

    return NextResponse.json({
      items,
      totalPages,
      totalCount,
      page,
      pageSize,
    });
  } catch (err: any) {
    console.error("Consignments API error:", err);
    return NextResponse.json(
      { error: err.message },
      { status: 500 }
    );
  }
}