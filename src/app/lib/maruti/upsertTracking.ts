// lib/tracking/upsertMarutiTracking.ts
import { db } from "@/app/db/postgres";
import { consignments, trackingEvents } from "@/app/db/schema";
import { and, eq } from "drizzle-orm";

type TrackingInput = {
  awb: string;
  status: string;
  location?: string;
  remarks?: string;
  eventTime?: Date;
  raw?: any;
};

export async function upsertMarutiTracking(input: TrackingInput) {
  // 1️⃣ Find consignment
  const consignment = await db
    .select({ id: consignments.id })
    .from(consignments)
    .where(eq(consignments.awb, input.awb))
    .limit(1);

  if (!consignment.length) return;
  const consignmentId = consignment[0].id;

  const eventTime = input.eventTime ?? new Date();

  // 2️⃣ Dedup check
  const exists = await db
    .select()
    .from(trackingEvents)
    .where(
      and(
        eq(trackingEvents.consignment_id, consignmentId),
        eq(trackingEvents.status, input.status),
        eq(trackingEvents.event_time, eventTime)
      )
    )
    .limit(1);

  if (exists.length) return;

  // 3️⃣ Insert event
  await db.insert(trackingEvents).values({
    consignment_id: consignmentId,
    provider: "maruti",
    awb: input.awb,
    status: input.status,
    location: input.location,
    remarks: input.remarks,
    event_time: eventTime,
    raw: input.raw,
  });

  // 4️⃣ Update master consignment status
  await db
    .update(consignments)
    .set({
      current_status: input.status,
      last_status_at: eventTime,
      updated_at: new Date(),
    })
    .where(eq(consignments.id, consignmentId));
}