import { NextResponse } from "next/server";
import { db } from "@/app/db/postgres";
import { consignments, providerShipments } from "@/app/db/schema";
import { marutiCreateOrder } from "@/app/lib/maruti/maruti.api";

export async function POST(req: Request) {
  try {
    const form = await req.json();

    const clientId = Number(form.client_id ?? 1);

    // 1️⃣ Call Maruti API
    const res = await marutiCreateOrder(form);
    const json = await res.json();

    if (!json?.awbNumber) {
      return NextResponse.json(
        { success: false, error: "AWB not returned", raw: json },
        { status: 400 }
      );
    }

    const awb = json.awbNumber;

    // 2️⃣ Insert master consignment
    const [c] = await db
    .insert(consignments)
    .values({
      client_id: clientId,                // ✅ integer
      provider: "maruti",
      awb,

      reference_number: form.reference_number ?? null,

      service_type: form.service_type ?? null,
      payment_mode: form.payment_mode ?? null,

      // ✅ NUMERIC → STRING
      cod_amount: String(form.cod_amount ?? "0"),

      origin: form.origin_city ?? null,
      destination: form.destination_city ?? null,
      origin_pincode: form.origin_pincode ?? null,
      destination_pincode: form.destination_pincode ?? null,

      // ✅ integers are fine
      weight_g: Number(form.weight_kg ?? 0) * 1000,
      chargeable_weight_g: Number(form.weight_kg ?? 0) * 1000,

      current_status: "Created",
      booked_at: new Date(),
    })
    .returning({ id: consignments.id });

    // 3️⃣ Provider shipment (RAW)
    await db.insert(providerShipments).values({
      consignment_id: c.id,
      provider: "maruti",

      provider_awb: awb,
      provider_order_id: json.orderId ?? null,

      raw_request: form,
      raw_response: json,

      last_synced_at: new Date(),
    });

    return NextResponse.json({
      success: true,
      awb,
      raw: json,
    });

  } catch (err: any) {
    console.error("MARUTI CREATE ERROR:", err);
    return NextResponse.json(
      { success: false, error: err.message ?? "Create failed" },
      { status: 500 }
    );
  }
}