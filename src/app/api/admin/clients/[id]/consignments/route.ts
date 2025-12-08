import { NextResponse } from "next/server";
import { db } from "@/app/db/postgres";
import { sql } from "drizzle-orm";

// ------------------------------
// Helpers
// ------------------------------
function computeTAT(r: any) {
  const rules: Record<string, number> = { D: 3, M: 5, N: 7, I: 10 };
  const prefix = r.awb?.charAt(0)?.toUpperCase();

  if (!r.booked_on) return "On Time";

  const allowed = rules[prefix as string] ?? 5;
  const age = Math.floor((Date.now() - new Date(r.booked_on).getTime()) / 86400000);

  if (age > allowed + 3) return "Very Critical";
  if (age > allowed) return "Critical";
  if (age >= allowed - 1) return "Warning";
  return "On Time";
}

function computeMovement(timeline: any[]) {
  if (!timeline.length) return "On Time";

  const last = timeline[0];
  const ts = new Date(`${last.actionDate}T${last.actionTime ?? "00:00:00"}`).getTime();
  const hours = Math.floor((Date.now() - ts) / (3600 * 1000));

  if (hours >= 72) return "Stuck (72+ hrs)";
  if (hours >= 48) return "Slow (48 hrs)";
  if (hours >= 24) return "Slow (24 hrs)";
  return "On Time";
}

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
    const tatFilter = url.searchParams.get("tat") ?? "all";

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
    // Delivered → must mean actual delivery
    if (status === "delivered") {
      whereClauses.push(sql`
        LOWER(c.last_status) IN ('delivered', 'delivered to consignee', 'delivered – left at doorstep')
      `);
    }

    // RTO → return-to-origin indicators
    if (status === "rto") {
      whereClauses.push(sql`
        LOWER(c.last_status) LIKE '%rto%'
        OR LOWER(c.last_status) LIKE '%return to origin%'
      `);
    }

    // Pending → anything that is NOT delivered or RTO
    if (status === "pending-group") {
      whereClauses.push(sql`
        LOWER(c.last_status) NOT IN ('delivered', 'delivered to consignee', 'delivered – left at doorstep')
        AND LOWER(c.last_status) NOT LIKE '%rto%'
        AND LOWER(c.last_status) NOT LIKE '%return to origin%'
      `);
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

    // ----------------------------------------------
    // BUILD FINAL PAYLOAD
    // ----------------------------------------------
    const items = rows.rows
      .map((r: any) => {
        const tat = computeTAT(r);
        const movement = computeMovement(r.timeline ?? []);

        // Apply TAT filter AFTER query (same as before)
        if (tatFilter !== "all" && !tat.toLowerCase().includes(tatFilter)) {
          return null;
        }

        return {
          awb: r.awb,
          last_status: r.last_status,
          origin: r.origin,
          destination: r.destination,
          booked_on: r.booked_on,
          last_updated_on: r.last_updated_on,
          timeline: r.timeline,
          tat,
          movement
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