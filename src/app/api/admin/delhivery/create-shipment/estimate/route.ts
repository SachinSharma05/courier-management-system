// app/api/admin/delhivery/create-shipment/estimate/route.ts
import { NextResponse } from "next/server";
import { z } from "zod";
import { dlvC2C } from "@/app/lib/delhivery/delhivery.c2c";

const EstimateSchema = z.object({
  customer_pincode: z.string(),
  length_cm: z.number().min(1),
  breadth_cm: z.number().min(1),
  height_cm: z.number().min(1),
  weight_kg: z.number().min(0.001),
  payment_mode: z.enum(["prepaid", "cod"]),
  service_type: z.enum(["surface", "express"]),
});

export async function POST(req: Request) {
  const body = await req.json();

  const origin_pin = process.env.DELHIVERY_ORIGIN_PIN || "452010";  // Indore default
  const dest_pin = body.customer_pincode;

  if (!dest_pin) {
    return NextResponse.json({ error: "destination pincode required" }, { status: 400 });
  }

  const result = await dlvC2C.calculateCost({
    o_pin: origin_pin,
    d_pin: dest_pin,
    cgm: Math.round(body.weight_kg * 1000),
    md: body.service_type === "express" ? "E" : "S",
    ss: "Delivered",
    pt: body.payment_mode === "prepaid" ? "Pre-paid" : "COD",
  });

  return NextResponse.json(result);
}
