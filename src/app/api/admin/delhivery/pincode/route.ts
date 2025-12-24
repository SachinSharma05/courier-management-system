import { NextResponse } from "next/server";
import { dlvC2C } from "@/app/lib/delhivery/delhivery.c2c";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const pin = url.searchParams.get("pin");

    if (!pin) {
      return NextResponse.json({ error: "pin required" }, { status: 400 });
    }

    const live = await dlvC2C.pincode(pin);
    console.log("Delhivery Pincode Response:", live);

    return NextResponse.json(live); // return FULL response EXACTLY like Delhivery
  } catch (e: any) {
    return NextResponse.json({ error: e?.message }, { status: 500 });
  }
}