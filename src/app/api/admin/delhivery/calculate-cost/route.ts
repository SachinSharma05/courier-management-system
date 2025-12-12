import { NextResponse } from "next/server";
import { dlvC2C } from "@/app/lib/delhivery/delhivery.c2c";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const query = {
      o_pin: body.origin_pin,
      d_pin: body.destination_pin,
      cgm: body.cgm, // chargeable weight (grams)
      md: body.mode || "E", // E = express, S = surface
      ss: body.status || "Delivered",
      pt: body.payment_type || "Pre-paid",
    };

    const result = await dlvC2C.calculateCost(query);

    return NextResponse.json({ success: true, result });
  } catch (err: any) {
    console.error("Cost calculation failed:", err);
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}