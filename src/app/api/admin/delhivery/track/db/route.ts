import { NextResponse } from "next/server";
import { db } from "@/app/db/postgres";
import {
  consignments,
  providerShipments,
  trackingEvents,
} from "@/app/db/schema";
import { eq, desc, and } from "drizzle-orm";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const awb = url.searchParams.get("awb");

    if (!awb) {
      return NextResponse.json(
        { success: false, error: "AWB required" },
        { status: 400 }
      );
    }

    // ---------------------------------------
    // 1️⃣ Fetch master consignment
    // ---------------------------------------
    const consignment = await db
      .select()
      .from(consignments)
      .where(eq(consignments.awb, awb))
      .limit(1);

    if (!consignment.length) {
      return NextResponse.json({
        success: true,
        shipment: null,
        timeline: [],
      });
    }

    const c = consignment[0];

    // ---------------------------------------
    // 2️⃣ Fetch provider-specific data (Delhivery)
    // ---------------------------------------
    const provider = await db
      .select()
      .from(providerShipments)
      .where(
        and(
          eq(providerShipments.consignment_id, c.id),
          eq(providerShipments.provider, "delhivery")
        )
      )
      .limit(1);

    // ---------------------------------------
    // 3️⃣ Fetch unified tracking timeline
    // ---------------------------------------
    const events = await db
      .select()
      .from(trackingEvents)
      .where(eq(trackingEvents.consignment_id, c.id))
      .orderBy(desc(trackingEvents.event_time));

    // ---------------------------------------
    // 4️⃣ Shape response (UI-compatible)
    // ---------------------------------------
    return NextResponse.json({
      success: true,
      shipment: {
        ...c,
        provider: provider[0] || null,
      },
      timeline: events,
    });
  } catch (err: any) {
    console.error("Delhivery track view error:", err);
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}