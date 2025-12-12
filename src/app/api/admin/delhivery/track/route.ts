import { NextResponse } from "next/server";
import { dlvC2C } from "@/app/lib/delhivery/delhivery.c2c";
import { db } from "@/app/db/postgres";
import { delhiveryC2CShipments } from "@/app/db/schema";
import { eq } from "drizzle-orm";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const awb = url.searchParams.get("awb");

    if (!awb) {
      return NextResponse.json({ success: false, error: "awb required" }, { status: 400 });
    }

    // 1️⃣ Get ref_id (order_id) from DB
    const record = await db
      .select()
      .from(delhiveryC2CShipments)
      .where(eq(delhiveryC2CShipments.awb, awb))
      .limit(1);

    const refId = record?.[0]?.order_id || undefined;

    // 2️⃣ Call Delhivery with BOTH parameters
    const live = await dlvC2C.trackShipment(awb, refId);

    // 3️⃣ Normalize status
    const status =
      live?.ShipmentData?.[0]?.Shipment?.Status?.Status ||
      live?.ShipmentData?.[0]?.Shipment?.Status ||
      live?.status ||
      live?.current_status ||
      "Unknown";

    // 4️⃣ Update DB
    await db
      .update(delhiveryC2CShipments)
      .set({
        current_status: status,
        tracking_response: live,
      })
      .where(eq(delhiveryC2CShipments.awb, awb));

    return NextResponse.json({
      success: true,
      status,
      live,
    });
  } catch (err: any) {
    console.error("Track failed", err);
    return NextResponse.json(
      { success: false, error: err?.response ?? err?.message },
      { status: err?.status ?? 500 }
    );
  }
}