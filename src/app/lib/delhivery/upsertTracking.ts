import { db } from "@/app/db/postgres";
import { consignments, providerShipments, trackingEvents } from "@/app/db/schema";
import { and, eq } from "drizzle-orm";

export async function upsertDelhiveryTracking(awb: string, response: any) {
  const shipment = response?.ShipmentData?.[0]?.Shipment;
  if (!shipment) return;

  const status = shipment.Status?.Status ?? "Unknown";
  const statusTime = shipment.Status?.StatusDateTime
    ? new Date(shipment.Status.StatusDateTime)
    : new Date();

  const scans = shipment.Scans || [];

  // ----------------------------------
  // 1️⃣ FIND CONSIGNMENT
  // ----------------------------------
  const consignment = await db
    .select({ id: consignments.id })
    .from(consignments)
    .where(eq(consignments.awb, awb))
    .limit(1);

  if (!consignment.length) return;
  const consignmentId = consignment[0].id;

  // ----------------------------------
  // 2️⃣ UPDATE MASTER CONSIGNMENT
  // ----------------------------------
  await db
    .update(consignments)
    .set({
      current_status: status,
      origin: shipment.Origin || null,
      destination: shipment.Destination || null,
      expected_delivery_date: shipment.PromisedDeliveryDate
        ? new Date(shipment.PromisedDeliveryDate)
        : null,
      invoice_amount: shipment.InvoiceAmount || null,
      last_status_at: statusTime,
      updated_at: new Date(),
    })
    .where(eq(consignments.id, consignmentId));

  // ----------------------------------
  // 3️⃣ UPSERT PROVIDER SHIPMENT (RAW)
  // ----------------------------------
  await db
    .insert(providerShipments)
    .values({
      consignment_id: consignmentId,
      provider: "delhivery",

      provider_order_id: shipment.ReferenceNo || null,
      provider_tracking_id: shipment.TrackingID || null,
      provider_awb: awb,

      label_url: shipment.Label || null,
      pod_url: shipment.POD || null,

      raw_response: response,
      last_synced_at: new Date(),
    })
    .onConflictDoNothing();

  // ----------------------------------
  // 4️⃣ INSERT TRACKING EVENTS (DEDUP)
  // ----------------------------------
  for (const s of scans) {
    const d = s.ScanDetail;
    if (!d?.ScanDateTime) continue;

    const eventTime = new Date(d.ScanDateTime);

    const exists = await db
      .select()
      .from(trackingEvents)
      .where(
        and(
          eq(trackingEvents.consignment_id, consignmentId),
          eq(trackingEvents.status, d.Scan),
          eq(trackingEvents.event_time, eventTime)
        )
      )
      .limit(1);

    if (exists.length) continue;

    await db.insert(trackingEvents).values({
      consignment_id: consignmentId,
      provider: "delhivery",
      awb,

      status: d.Scan,
      location: d.ScannedLocation || null,
      remarks: d.Instructions || null,

      event_time: eventTime,
      raw: d,
    });
  }
}