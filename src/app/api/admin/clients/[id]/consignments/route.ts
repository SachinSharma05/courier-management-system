import { NextResponse } from "next/server";
import { db } from "@/app/db/postgres";
import { sql } from "drizzle-orm";
import { computeTAT } from "@/lib/tracking/utils";

// ------------------------------
// GET Handler (Fully Fixed)
// ------------------------------
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
    if (!clientIdParam)
      return NextResponse.json({ error: "clientId is required" }, { status: 400 });

    const clientId = Number(clientIdParam);

    // ----------------------------------------------
    // DYNAMIC WHERE BUILDER
    // ----------------------------------------------
    const whereClauses: any[] = [];
    whereClauses.push(sql`c.client_id = ${clientId}`);

    // Search
    if (search) {
      whereClauses.push(sql`c.awb ILIKE ${'%' + search + '%'}`);
    }

    // Status Filters (STRICT MATCHING)
    if (status && status !== "all") {
      switch (status) {
        case "delivered":
          whereClauses.push(sql`LOWER(c.last_status) = 'delivered'`);
          break;

        case "rto":
          whereClauses.push(sql`LOWER(c.last_status) = 'rto'`);
          break;

        case "in transit":
          whereClauses.push(sql`LOWER(c.last_status) = 'in transit'`);
          break;

        case "out for delivery":
          whereClauses.push(sql`LOWER(c.last_status) = 'out for delivery'`);
          break;

        case "reached at destination":
          whereClauses.push(sql`LOWER(c.last_status) = 'reached at destination'`);
          break;

        case "received at delivery centre":
          whereClauses.push(sql`LOWER(c.last_status) = 'received at delivery centre'`);
          break;

        case "weekly off":
          whereClauses.push(sql`LOWER(c.last_status) = 'weekly off'`);
          break;

        case "undelivered":
          whereClauses.push(sql`LOWER(c.last_status) = 'undelivered'`);
          break;

        case "pending":
          whereClauses.push(sql`
            (
              c.last_status IS NULL
              OR LOWER(c.last_status) NOT LIKE '%deliver%'
              AND LOWER(c.last_status) NOT LIKE '%rto%'
              AND LOWER(c.last_status) NOT LIKE '%undeliver%'
              AND LOWER(c.last_status) NOT LIKE '%return%'
              AND LOWER(c.last_status) NOT LIKE '%cancel%'
              AND LOWER(c.last_status) NOT LIKE '%lost%'
            )
          `);
          break;
      }
    }

    // Date Filters
    if (from) whereClauses.push(sql`c.booked_on >= ${from}`);
    if (to) whereClauses.push(sql`c.booked_on <= ${to}`);

    // Join WHERE conditions
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

    const totalCount = Number(countResult.rows[0].count ?? 0);
    const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

    // ----------------------------------------------
    // MAIN QUERY (timeline + filters)
    // ----------------------------------------------
    const rows = await db.execute(sql`
      SELECT
        c.id,
        c.awb,
        c.origin,
        c.destination,
        c.last_status,
        c.booked_on,
        c.last_updated_on,

        COALESCE((
          SELECT json_agg(t ORDER BY t."actionDate" DESC, t."actionTime" DESC)
          FROM (
            SELECT
              e.action,
              e.action_date AS "actionDate",
              e.action_time AS "actionTime",
              e.origin,
              e.destination,
              e.remarks
            FROM tracking_events e
            WHERE e.consignment_id = c.id
          ) t
        ), '[]') AS timeline

      FROM consignments c
      ${finalWhere}
      ORDER BY c.last_updated_on DESC, c.awb ASC
      LIMIT ${pageSize}
      OFFSET ${offset}
    `);

    const q = rows.rows ?? [];

    // ----------------------------------------------
    // BUILD FINAL PAYLOAD
    // ----------------------------------------------
    const items = rows.rows
      .map((r: any) => {
        if (tatFilter !== "all") {
          // computeTAT signature kept same as your frontend utils expects:
          // computeTAT(awb, booked_on, last_status)
          const tat = computeTAT(r.awb, r.booked_on, r.last_status).toLowerCase();
          if (!tat.includes(tatFilter)) return null;
        }

        return {
          awb: r.awb,
          last_status: r.last_status,
          origin: r.origin,
          destination: r.destination,
          booked_on: r.booked_on,
          last_updated_on: r.last_updated_on,
          timeline: r.timeline
          // NOTE: intentionally not returning tat/movement — frontend computes those
        };
      })
      .filter(Boolean); 

    return NextResponse.json({
      items,
      totalPages,
      totalCount,
      page,
      pageSize
    });

  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}