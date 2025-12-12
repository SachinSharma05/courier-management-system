import { db } from "@/app/db/postgres";
import { delhiveryC2CShipments } from "@/app/db/schema";
import { NextResponse } from "next/server";

const BASE = process.env.DELHIVERY_C2C_BASE?.replace(/\/$/, "") || "https://track.delhivery.com";
const TOKEN = process.env.DELHIVERY_C2C_TOKEN!;
const CREATE_URL = `${BASE}/api/cmu/create.json`;

export async function POST(req: Request) {
  try {
    const form = await req.json();

    // -----------------------------
    // 🟢 Map UI → Delhivery Fields
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
      weight: String(Math.round(Number(form.chargeable_kg) * 1000)), // grams

      shipping_mode: form.service_type === "express" ? "Express" : "Surface",
      quantity: "1",

      // Mandatory empty return fields
      return_pin: "",
      return_city: "",
      return_phone: "",
      return_add: "",
      return_state: "",
      return_country: "",
    };

    const finalPayload = {
      shipments: [shipment],
      pickup_location: {
        name: "VARIABLEINSTINCT C2C",
      },
    };

    // --------------------------------------
    // 🟢 STRICT CMU FORMAT
    // --------------------------------------
    const body = new URLSearchParams();
    body.append("format", "json");
    body.append("data", JSON.stringify(finalPayload));

    console.log("📦 FINAL CMU PAYLOAD →", JSON.stringify(finalPayload, null, 2));

    // --------------------------------------
    // 🟢 SEND REQUEST
    // --------------------------------------
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
    console.log("📦 RAW RESPONSE →", raw);

    // --------------------------------------
    // 🟢 Extract AWB
    // --------------------------------------
    let awb = null;

    if (Array.isArray(raw?.packages) && raw.packages.length > 0) {
      awb = raw.packages[0].waybill || raw.packages[0].awb || null;
    }

    if (awb) {
      await db.insert(delhiveryC2CShipments).values({
        order_id: form.order_id,
        channel: "VARIABLEINSTINCT C2C",

        customer_name: form.customer_name,
        customer_phone: form.customer_phone,
        customer_email: form.customer_email || "",
        customer_address: form.customer_address,
        customer_pincode: form.customer_pincode,

        service_type: form.service_type,
        payment_mode: form.payment_mode,
        cod_amount: form.payment_mode === "cod" ? Number(form.cod_amount) : 0,

        length_cm: Number(form.length_cm),
        breadth_cm: Number(form.breadth_cm),
        height_cm: Number(form.height_cm),
        weight_g: Number(form.weight_kg) * 1000,
        chargeable_weight_g: Number(form.chargeable_kg) * 1000,

        awb,
        current_status: "Created",

        raw_request: form,
        raw_response: raw,

        created_at: new Date(),
        updated_at: new Date()
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