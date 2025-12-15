import { NextResponse } from "next/server";
import { db } from "@/app/db/postgres";
import { consignments } from "@/app/db/schema";
import { eq, or, and, inArray } from "drizzle-orm";
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
      eq(consignments.provider, "delhivery"),
      inArray(consignments.current_status, [
        "Pending",
        "In Transit",
        "Out for Delivery",
      ])
    )
  );

  const results: any[] = [];

  for (const row of rows) {
    try {
      const live = await delhiveryC2C("/api/v1/packages/json/", {
        waybill: row.awb,
      });

      await upsertDelhiveryTracking(row.awb, live, 1);

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