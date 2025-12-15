import { NextResponse } from "next/server";
import { db } from "@/app/db/postgres";
import { consignments } from "@/app/db/schema";
import { eq, or, and } from "drizzle-orm";
import { delhiveryC2C } from "@/app/lib/delhivery/c2c";
import { upsertDelhiveryTracking } from "@/app/lib/delhivery/upsertTracking";

export async function GET() {
  const rows = await db
  .select({
    awb: consignments.awb,
  })
  .from(consignments)
  .where(
    and(
      // provider filter
      or(
        eq(consignments.provider, "delhivery"),
        eq(consignments.provider, "DELHIVERY") // legacy safety
      ),

      // status filter
      or(
        eq(consignments.current_status, "Pending"),
        eq(consignments.current_status, "In Transit"),
        eq(consignments.current_status, "Out for Delivery")
      )
    )
  );

  const results: any[] = [];

  for (const row of rows) {
    try {
      const live = await delhiveryC2C("/api/v1/packages/json/", {
        waybill: row.awb,
      });

      await upsertDelhiveryTracking(row.awb, live);

      results.push({ awb: row.awb, success: true });
    } catch (err: any) {
      results.push({
        awb: row.awb,
        success: false,
        error: err.message,
      });
    }
  }

  return NextResponse.json({ success: true, results });
}