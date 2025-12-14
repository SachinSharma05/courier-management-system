import { db } from "@/app/db/postgres";
import { consignments, trackingEvents } from "@/app/db/schema";
import { and, eq } from "drizzle-orm";

export async function upsertMarutiTracking(
  awb: string,
  live: any
) {
  const events = live?.trackingHistory || [];
  const currentStatus = live?.currentStatus || "Unknown";

  // 1️⃣ Ensure consignment exists
  const [c] = await db
    .select({ id: consignments.id })
    .from(consignments)
    .where(eq(consignments.awb, awb))
    .limit(1);

  if (!c) return;

  // 2️⃣ Insert tracking events (dedup)
  for (const e of events) {
    const eventTime = e.eventDateTime
      ? new Date(e.eventDateTime)
      : new Date();

    const exists = await db
      .select()
      .from(trackingEvents)
      .where(
        and(
          eq(trackingEvents.consignment_id, c.id),
          eq(trackingEvents.status, e.status),
          eq(trackingEvents.event_time, eventTime)
        )
      )
      .limit(1);

    if (exists.length) continue;

    await db.insert(trackingEvents).values({
      consignment_id: c.id,
      provider: "maruti",
      awb,
      status: e.status,
      location: e.location || null,
      remarks: e.remarks || null,
      event_time: eventTime,
      raw: e,
    });
  }

  // 3️⃣ Update master consignment
  await db
    .update(consignments)
    .set({
      current_status: currentStatus,
      last_status_at: new Date(),
      updated_at: new Date(),
    })
    .where(eq(consignments.id, c.id));
}