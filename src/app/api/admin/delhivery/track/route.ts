import { NextResponse } from "next/server";
import { dlvC2C } from "@/app/lib/delhivery/delhivery.c2c";
import { db } from "@/app/db/postgres";
import { consignments, providerShipments } from "@/app/db/schema";
import { eq, and } from "drizzle-orm";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const awb = url.searchParams.get("awb");

    if (!awb) {
      return NextResponse.json(
        { success: false, error: "awb required" },
        { status: 400 }
      );
    }

    // 1️⃣ Get ref_id (order_id) from provider_shipments
    const providerRow = await db
      .select({
        consignmentId: providerShipments.consignment_id,
        refId: providerShipments.provider_order_id,
      })
      .from(providerShipments)
      .where(
        and(
          eq(providerShipments.provider, "delhivery"),
          eq(providerShipments.provider_awb, awb)
        )
      )
      .limit(1);

    const refId = providerRow?.[0]?.refId || undefined;
    const consignmentId = providerRow?.[0]?.consignmentId;

    // 2️⃣ Call Delhivery with BOTH parameters (UNCHANGED)
    const live = await dlvC2C.trackShipment(awb, refId);

    // 3️⃣ Normalize status (UNCHANGED)
    const status =
      live?.ShipmentData?.[0]?.Shipment?.Status?.Status ||
      live?.ShipmentData?.[0]?.Shipment?.Status ||
      live?.status ||
      live?.current_status ||
      "Unknown";

    // 4️⃣ Update master consignment ONLY
    if (consignmentId) {
      await db
        .update(consignments)
        .set({
          current_status: status,
          last_status_at: new Date(),
          updated_at: new Date(),
        })
        .where(eq(consignments.id, consignmentId));
    }

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