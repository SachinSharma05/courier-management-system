import { NextResponse } from "next/server";
import { db } from "@/app/db/postgres";
import { delhiveryC2CShipments, delhiveryC2CEvents } from "@/app/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const awb = url.searchParams.get("awb");

  if (!awb) return NextResponse.json({ success: false, error: "AWB required" });

  const shipment = await db
    .select()
    .from(delhiveryC2CShipments)
    .where(eq(delhiveryC2CShipments.awb, awb))
    .limit(1);

  const events = await db
    .select()
    .from(delhiveryC2CEvents)
    .where(eq(delhiveryC2CEvents.awb, awb))
    .orderBy(desc(delhiveryC2CEvents.event_time));

  return NextResponse.json({
    success: true,
    shipment: shipment[0] || null,
    timeline: events,
  });
}