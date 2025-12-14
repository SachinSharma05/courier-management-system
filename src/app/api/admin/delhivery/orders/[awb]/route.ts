import { NextResponse } from "next/server";
import { db } from "@/app/db/postgres";
import {
  consignments,
  providerShipments,
  trackingEvents,
} from "@/app/db/schema";
import { eq, desc, and } from "drizzle-orm";

export async function GET(
  req: Request,
  ctx: { params: Promise<{ awb: string }> }
) {
    // ✅ IMPORTANT: unwrap params
    const { awb } = await ctx.params;

    try {
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
      return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
    }

    const c = cons[0];

    const provider = await db
      .select()
      .from(providerShipments)
      .where(eq(providerShipments.consignment_id, c.id))
      .limit(1);

    const timeline = await db
      .select()
      .from(trackingEvents)
      .where(eq(trackingEvents.consignment_id, c.id))
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