// src/app/api/admin/delhivery/track/route.ts
import { NextResponse } from "next/server";
import { trackShipment } from "@/app/lib/delhivery/delhivery";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const awb = url.searchParams.get("awb");
  if (!awb) return NextResponse.json({ error: "awb required" }, { status: 400 });

  try {
    const res = await trackShipment(awb);
    return NextResponse.json(res);
  } catch (err: any) {
    console.error("Track failed", err);
    return NextResponse.json({ error: err?.response ?? err?.message }, { status: err?.status ?? 500 });
  }
}
