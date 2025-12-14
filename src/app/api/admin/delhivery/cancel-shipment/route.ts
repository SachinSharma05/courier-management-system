import { NextResponse } from "next/server";
import { db } from "@/app/db/postgres";
import { consignments, providerShipments } from "@/app/db/schema";
import { eq, and } from "drizzle-orm";
import { dlvC2C } from "@/app/lib/delhivery/delhivery.c2c";

export async function POST(req: Request) {
  try {
    const { awb } = await req.json();

    if (!awb) {
      return NextResponse.json(
        { success: false, error: "AWB required" },
        { status: 400 }
      );
    }

    // 1️⃣ Find consignment
    const cons = await db
      .select()
      .from(consignments)
      .where(
        and(
          eq(consignments.awb, awb),
          eq(consignments.provider, "delhivery")
        )
      )
      .limit(1);

    if (!cons.length) {
      return NextResponse.json(
        { success: false, error: "Shipment not found" },
        { status: 404 }
      );
    }

    const c = cons[0];

    // 2️⃣ Call Delhivery cancel API
    const resp = await dlvC2C.cancelShipment({
      waybill: awb,
      cancellation: true,
    });

    // 3️⃣ Update master consignment
    await db
      .update(consignments)
      .set({
        current_status: "Cancelled",
        last_status_at: new Date(),
        updated_at: new Date(),
      })
      .where(eq(consignments.id, c.id));

    // 4️⃣ Update provider shipment raw
    await db
      .update(providerShipments)
      .set({
        raw_response: resp,
        last_synced_at: new Date(),
      })
      .where(
        and(
          eq(providerShipments.consignment_id, c.id),
          eq(providerShipments.provider, "delhivery")
        )
      );

    return NextResponse.json({ success: true, raw: resp });
  } catch (err: any) {
    console.error("Delhivery cancel error:", err);
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}