import { NextResponse } from "next/server";
import { requestPickup } from "@/app/lib/delhivery/delhivery";

export async function POST(req: Request) {
  try {
    const payload = await req.json();
    const result = await requestPickup(payload);
    return NextResponse.json(result);
  } catch (err: any) {
    console.error("Pickup request failed:", err);
    return NextResponse.json(
      { error: err?.response ?? err?.message },
      { status: err?.status ?? 500 }
    );
  }
}
