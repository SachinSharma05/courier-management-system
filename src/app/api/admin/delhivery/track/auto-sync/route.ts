import { NextResponse } from "next/server";
import { db } from "@/app/db/postgres";
import { delhiveryC2CShipments } from "@/app/db/schema";
import { eq, or } from "drizzle-orm";
import { delhiveryC2C } from "@/app/lib/delhivery/c2c";
import { upsertDelhiveryTracking } from "@/app/lib/delhivery/upsertTracking";

export async function GET() {
  const pending = ["Pending", "In Transit", "Out for Delivery"];

  const rows = await db
    .select()
    .from(delhiveryC2CShipments)
    .where(or(
      eq(delhiveryC2CShipments.current_status, "Pending"),
      eq(delhiveryC2CShipments.current_status, "In Transit"),
      eq(delhiveryC2CShipments.current_status, "Out for Delivery")
    ));

  const results = [];

  for (const row of rows) {
    try {
      const live = await delhiveryC2C("/api/v1/packages/json/", { waybill: row.awb });
      await upsertDelhiveryTracking(row.awb, live);
      results.push({ awb: row.awb, success: true });
    } catch (err: any) {
      results.push({ awb: row.awb, success: false, error: err.message });
    }
  }

  return NextResponse.json({ success: true, results });
}
