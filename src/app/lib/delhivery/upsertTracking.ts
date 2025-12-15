import { db } from "@/app/db/postgres";
import {
  consignments,
  providerShipments,
  trackingEvents,
} from "@/app/db/schema";
import { eq, sql } from "drizzle-orm";

export async function upsertDelhiveryTracking(
  awb: string,
  response: any,
  clientId: number,
  referenceNumber?: string | null
) {
  const shipment = response?.ShipmentData?.[0]?.Shipment;
  if (!shipment) return;

  const status = shipment.Status?.Status ?? "Unknown";
  const statusTime = shipment.Status?.StatusDateTime
    ? new Date(shipment.Status.StatusDateTime)
    : new Date();

  // ----------------------------------
  // 1️⃣ UPSERT MASTER CONSIGNMENT
  // ----------------------------------
  const [row] = await db
    .insert(consignments)
    .values({
      awb,
      provider: "delhivery",
      client_id: clientId, // ✅ REQUIRED
      current_status: status,
      origin: shipment.Origin || null,
      destination: shipment.Destination || null,
      expected_delivery_date: shipment.PromisedDeliveryDate
        ? new Date(shipment.PromisedDeliveryDate)
        : null,
      invoice_amount: shipment.InvoiceAmount || null,
      reference_number: referenceNumber ?? shipment.ReferenceNo ?? null,
      last_status_at: statusTime,
      booked_at: new Date(),
      created_at: new Date(),
      updated_at: new Date(),
    })
    .onConflictDoUpdate({
      target: consignments.awb,
      set: {
        reference_number:
        referenceNumber ?? shipment.ReferenceNo ?? sql`excluded.reference_number`,
        current_status: status,
        origin: shipment.Origin || null,
        destination: shipment.Destination || null,
        expected_delivery_date: shipment.PromisedDeliveryDate
          ? new Date(shipment.PromisedDeliveryDate)
          : null,
        invoice_amount: shipment.InvoiceAmount || null,
        last_status_at: statusTime,
        updated_at: new Date(),
      },
    })
    .returning({ id: consignments.id });

  const consignmentId = row.id;

  // ----------------------------------
  // 2️⃣ UPSERT PROVIDER SHIPMENT
  // ----------------------------------
  await db
    .insert(providerShipments)
    .values({
      consignment_id: consignmentId,
      provider: "delhivery",
      provider_awb: awb,
      provider_order_id: shipment.ReferenceNo || null,
      provider_tracking_id: shipment.TrackingID || null,
      label_url: shipment.Label || null,
      pod_url: shipment.POD || null,
      raw_response: response,
      last_synced_at: new Date(),
    })
    .onConflictDoNothing();

  // ----------------------------------
  // 3️⃣ INSERT TRACKING EVENTS (NO DUPES)
  // ----------------------------------
  for (const s of shipment.Scans || []) {
    const d = s.ScanDetail;
    if (!d?.ScanDateTime) continue;

    await db.insert(trackingEvents).values({
      consignment_id: consignmentId,
      provider: "delhivery",
      awb,
      status: d.Scan,
      location: d.ScannedLocation || null,
      remarks: d.Instructions || null,
      event_time: new Date(d.ScanDateTime),
      raw: d,
    });
  }
}