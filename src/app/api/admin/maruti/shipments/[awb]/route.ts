import { NextResponse } from "next/server";
import { db } from "@/app/db/postgres";
import {
  consignments,
  providerShipments,
  trackingEvents,
} from "@/app/db/schema";
import { eq, desc, and } from "drizzle-orm";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ awb: string }> }
) {
  const { awb } = await ctx.params;

  try {
    // 1️⃣ Master consignment
    const cons = await db
      .select()
      .from(consignments)
      .where(
        and(
          eq(consignments.awb, awb),
          eq(consignments.provider, "maruti")
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

    // 2️⃣ Provider shipment (raw)
    const provider = await db
      .select()
      .from(providerShipments)
      .where(
        and(
          eq(providerShipments.consignment_id, c.id),
          eq(providerShipments.provider, "maruti")
        )
      )
      .limit(1);

    // 3️⃣ Timeline
    const timeline = await db
      .select()
      .from(trackingEvents)
      .where(
        and(
          eq(trackingEvents.consignment_id, c.id),
          eq(trackingEvents.provider, "maruti")
        )
      )
      .orderBy(desc(trackingEvents.event_time));

    return NextResponse.json({
      success: true,
      data: {
        ...c,
        provider: provider[0] || null,
        timeline,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}