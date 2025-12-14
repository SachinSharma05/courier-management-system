// /api/admin/delhivery/dashboard/stats/route.ts
import { NextResponse } from "next/server";
import { db } from "@/app/db/postgres";
import { sql } from "drizzle-orm";

/* ------------------------------------------
   LOCAL FUNCTION → Get Delhivery Stats
------------------------------------------- */
async function getDelhiveryProviderStats() {
  // TOTAL
  const totalRes = await db.execute(sql`
    SELECT COUNT(*) AS count
    FROM consignments
    WHERE provider = 'delhivery'
  `);
  const total = Number(totalRes.rows[0]?.count || 0);

  // DELIVERED
  const deliveredRes = await db.execute(sql`
    SELECT COUNT(*) AS count
    FROM consignments
    WHERE provider = 'delhivery'
      AND LOWER(current_status) LIKE '%deliver%'
      AND LOWER(current_status) NOT LIKE '%undeliver%'
      AND LOWER(current_status) NOT LIKE '%redeliver%'
  `);
  const delivered = Number(deliveredRes.rows[0]?.count || 0);

  // RTO
  const rtoRes = await db.execute(sql`
    SELECT COUNT(*) AS count
    FROM consignments
    WHERE provider = 'delhivery'
      AND (
        LOWER(current_status) LIKE '%rto%'
        OR LOWER(current_status) LIKE '%return%'
        OR LOWER(current_status) LIKE '%returned%'
        OR LOWER(current_status) LIKE '%return to origin%'
      )
  `);
  const rto = Number(rtoRes.rows[0]?.count || 0);

  // Pending
  const pending = total - delivered - rto;

  return { total, delivered, pending, rto };
}

/* ------------------------------------------
   GET /api/admin/delhivery/dashboard/stats
------------------------------------------- */
export async function GET() {
  try {
    const stats = await getDelhiveryProviderStats();
    return NextResponse.json(stats);
  } catch (err: any) {
    console.error("Delhivery stats error:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to get stats" },
      { status: 500 }
    );
  }
}