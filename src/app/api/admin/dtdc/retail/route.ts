import { NextResponse } from "next/server";
import { db } from "@/app/db/postgres";
import { consignments } from "@/app/db/schema";
import { and, eq, desc } from "drizzle-orm";

export async function GET() {
  try {
    const rows = await db
      .select({
        awb: consignments.awb,
        current_status: consignments.current_status,
        origin: consignments.origin,
        destination: consignments.destination,
        last_status_at: consignments.last_status_at,
      })
      .from(consignments)
      .where(
        and(
          eq(consignments.client_id, 549),     // 🔥 RETAIL
          eq(consignments.provider, "dtdc")  // 🔥 DTDC
        )
      )
      .orderBy(desc(consignments.updated_at));

    return NextResponse.json({ ok: true, rows });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err.message },
      { status: 500 }
    );
  }
}