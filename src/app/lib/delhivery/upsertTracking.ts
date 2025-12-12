import { db } from "@/app/db/postgres";
import { delhiveryC2CShipments, delhiveryC2CEvents } from "@/app/db/schema";
import { eq } from "drizzle-orm";

export async function upsertDelhiveryTracking(awb: string, response: any) {
  const shipment = response?.ShipmentData?.[0]?.Shipment;
  if (!shipment) return;

  const status = shipment.Status?.Status ?? "Unknown";
  const statusDate = shipment.Status?.StatusDateTime
    ? new Date(shipment.Status.StatusDateTime)
    : null;

  const scans = shipment.Scans || [];

  // ------------------------------
  // UPSERT MAIN SHIPMENT ROW
  // ------------------------------
  await db.insert(delhiveryC2CShipments).values({
    awb,
    order_id: shipment.ReferenceNo || null, 
    customer_name: shipment.Consignee?.Name || null,
    customer_pincode: shipment.Consignee?.PinCode?.toString() || null,

    current_status: status,
    latest_status_time: statusDate,

    destination: shipment.Destination || null,
    origin: shipment.Origin || null,
    expected_delivery_date: shipment.PromisedDeliveryDate
      ? new Date(shipment.PromisedDeliveryDate)
      : null,

    invoice_amount: shipment.InvoiceAmount || null,
    tracking_response: response,

    last_synced_at: new Date(),
  })
  .onConflictDoUpdate({
    target: delhiveryC2CShipments.awb,
    set: {
      current_status: status,
      latest_status_time: statusDate,
      destination: shipment.Destination || null,
      origin: shipment.Origin || null,
      expected_delivery_date: shipment.PromisedDeliveryDate
        ? new Date(shipment.PromisedDeliveryDate)
        : null,
      invoice_amount: shipment.InvoiceAmount || null,

      tracking_response: response,
      last_synced_at: new Date(),
      updated_at: new Date(),
    }
  });

  // ------------------------------
  // INSERT EVENT HISTORY
  // ------------------------------
  for (const s of scans) {
    const d = s.ScanDetail;
    await db.insert(delhiveryC2CEvents).values({
      awb,
      scan: d.Scan,
      scan_type: d.ScanType,
      status_code: d.StatusCode,
      location: d.ScannedLocation,
      instructions: d.Instructions,
      event_time: d.ScanDateTime ? new Date(d.ScanDateTime) : null,
      raw: d,
    });
  }
}