import { NextResponse } from "next/server";
import { dlvC2C } from "@/app/lib/delhivery/delhivery.c2c";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const result = await dlvC2C.calculateCost({
      o_pin: body.origin_pin,
      d_pin: body.destination_pin,
      cgm: body.cgm,
      md: body.mode ?? "E",
      pt: body.payment_type ?? "Pre-paid",
      ss: "Delivered",
      cod_amount: body.cod_amount,
      client_code: body.client_code, // 🔥 REQUIRED
    });

    return NextResponse.json({ success: true, result });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}
