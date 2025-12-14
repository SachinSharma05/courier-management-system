import { NextResponse } from "next/server";
import { db } from "@/app/db/postgres";
import {
  consignments,
  providerShipments,
  trackingEvents,
} from "@/app/db/schema";
import { and, eq } from "drizzle-orm";

const WEBHOOK_KEY = process.env.MARUTI_WEBHOOK_KEY!;

export async function POST(req: Request) {
  try {
    // ----------------------------
    // 🔐 AUTHENTICATE WEBHOOK
    // ----------------------------
    const authKey = req.headers.get("x-auth-key");
    if (!authKey || authKey !== WEBHOOK_KEY) {
      return NextResponse.json(
        { success: false, error: "Unauthorized webhook" },
        { status: 401 }
      );
    }

    const payload = await req.json();

    /**
     * Expected (example – flexible):
     * {
     *   awbNumber: "MRT123456",
     *   status: "In Transit",
     *   location: "Indore Hub",
     *   remarks: "Arrived at hub",
     *   eventTime: "2025-01-14T10:30:00Z",
     *   raw: {...}
     * }
     */

    const awb = payload?.awbNumber || payload?.awb;
    if (!awb) {
      return NextResponse.json(
        { success: false, error: "AWB missing" },
        { status: 400 }
      );
    }

    const status = payload?.status ?? "Unknown";
    const location = payload?.location ?? null;
    const remarks = payload?.remarks ?? null;
    const eventTime = payload?.eventTime
      ? new Date(payload.eventTime)
      : new Date();

    // ----------------------------
    // 1️⃣ FIND CONSIGNMENT
    // ----------------------------
    const cons = await db
      .select({ id: consignments.id })
      .from(consignments)
      .where(
        and(
          eq(consignments.awb, awb),
          eq(consignments.provider, "maruti")
        )
      )
      .limit(1);

    if (!cons.length) {
      // silently ignore unknown AWBs (important for webhooks)
      return NextResponse.json({ success: true, ignored: true });
    }

    const consignmentId = cons[0].id;

    // ----------------------------
    // 2️⃣ DEDUP EVENT
    // ----------------------------
    const exists = await db
      .select()
      .from(trackingEvents)
      .where(
        and(
          eq(trackingEvents.consignment_id, consignmentId),
          eq(trackingEvents.provider, "maruti"),
          eq(trackingEvents.status, status),
          eq(trackingEvents.event_time, eventTime)
        )
      )
      .limit(1);

    if (!exists.length) {
      // ----------------------------
      // 3️⃣ INSERT TRACKING EVENT
      // ----------------------------
      await db.insert(trackingEvents).values({
        consignment_id: consignmentId,
        provider: "maruti",
        awb,
        status,
        location,
        remarks,
        event_time: eventTime,
        raw: payload,
      });
    }

    // ----------------------------
    // 4️⃣ UPDATE MASTER CONSIGNMENT
    // ----------------------------
    await db
      .update(consignments)
      .set({
        current_status: status,
        last_status_at: eventTime,
        updated_at: new Date(),
      })
      .where(eq(consignments.id, consignmentId));

    // ----------------------------
    // 5️⃣ UPDATE PROVIDER SHIPMENT (RAW)
    // ----------------------------
    await db
      .update(providerShipments)
      .set({
        raw_response: payload,
        last_synced_at: new Date(),
      })
      .where(
        and(
          eq(providerShipments.consignment_id, consignmentId),
          eq(providerShipments.provider, "maruti")
        )
      );

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Maruti webhook error:", err);
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}