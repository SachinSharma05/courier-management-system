import { db } from "@/app/db/postgres";
import { consignments, providerShipments } from "@/app/db/schema";
import { NextResponse } from "next/server";

const BASE = process.env.DELHIVERY_C2C_BASE?.replace(/\/$/, "") || "https://track.delhivery.com";
const TOKEN = process.env.DELHIVERY_C2C_TOKEN!;
const CREATE_URL = `${BASE}/api/cmu/create.json`;

export async function POST(req: Request) {
  try {
    const form = await req.json();

    // -----------------------------
    // 🟢 Delhivery logic (UNCHANGED)
    // -----------------------------
    const shipment = {
      name: String(form.customer_name || ""),
      add: String(form.customer_address || ""),
      pin: String(form.customer_pincode || ""),
      city: String(form.customer_city || "Indore"),
      state: String(form.customer_state || "Madhya Pradesh"),
      country: "India",
      phone: String(form.customer_phone || ""),

      order: String(form.order_id),
      payment_mode: form.payment_mode === "cod" ? "COD" : "Prepaid",

      products_desc: "Product",
      hsn_code: "",
      total_amount: String(form.cod_amount || "0"),
      cod_amount: form.payment_mode === "cod" ? String(form.cod_amount) : "0",

      shipment_length: String(form.length_cm),
      shipment_width: String(form.breadth_cm),
      shipment_height: String(form.height_cm),
      weight: String(Math.round(Number(form.chargeable_kg) * 1000)),

      shipping_mode: form.service_type === "express" ? "Express" : "Surface",
      quantity: "1",

      return_pin: "",
      return_city: "",
      return_phone: "",
      return_add: "",
      return_state: "",
      return_country: "",
    };

    const finalPayload = {
      shipments: [shipment],
      pickup_location: { name: "VARIABLEINSTINCT C2C" },
    };

    const body = new URLSearchParams();
    body.append("format", "json");
    body.append("data", JSON.stringify(finalPayload));

    const res = await fetch(CREATE_URL, {
      method: "POST",
      headers: {
        Authorization: `Token ${TOKEN}`,
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/json",
      },
      body,
    });

    const raw = await res.json();

    // -----------------------------
    // 🟢 Extract AWB (UNCHANGED)
    // -----------------------------
    let awb: string | null = null;
    if (Array.isArray(raw?.packages) && raw.packages.length > 0) {
      awb = raw.packages[0].waybill || raw.packages[0].awb || null;
    }

    // -----------------------------
    // ✅ NEW DB WRITES (ONLY CHANGE)
    // -----------------------------
    if (awb) {
    // 1️⃣ Insert master consignment
    const [consignment] = await db.insert(consignments).values({
        client_id: 1, // ✅ correct
        provider: "delhivery",
        awb,

        reference_number: form.order_id ?? null,

        service_type: form.service_type ?? null,
        payment_mode: form.payment_mode ?? null,

        // 🔑 FIX HERE
        cod_amount:
          form.payment_mode === "cod"
            ? String(Number(form.cod_amount || 0))
            : "0",

        origin: "VARIABLEINSTINCT C2C",
        destination: form.customer_city ?? null,

        origin_pincode: null,
        destination_pincode: form.customer_pincode
          ? String(form.customer_pincode)
          : null,

        length_cm: Number(form.length_cm || 0),
        breadth_cm: Number(form.breadth_cm || 0),
        height_cm: Number(form.height_cm || 0),

        weight_g: Number(form.weight_kg || 0) * 1000,
        chargeable_weight_g: Number(form.chargeable_kg || 0) * 1000,

        current_status: "Created",
        booked_at: new Date(),
        created_at: new Date(),
        updated_at: new Date(),
      })
      .onConflictDoNothing()
      .returning({ id: consignments.id });

      // 2️⃣ Insert provider shipment
      await db.insert(providerShipments).values({
        consignment_id: consignment.id,
        provider: "delhivery",

        provider_order_id: form.order_id ?? null,
        provider_awb: awb,

        raw_request: form,
        raw_response: raw,

        last_synced_at: new Date(),
      });
    }

    return NextResponse.json({
      success: Boolean(awb),
      awb,
      raw,
    });
  } catch (err: any) {
    console.error("❌ CREATE SHIPMENT ERROR:", err);
    return NextResponse.json(
      { success: false, error: err?.message },
      { status: 500 }
    );
  }
}