import { NextResponse } from "next/server";
import { fetchWaybill } from "@/app/lib/delhivery/delhivery";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const awb = url.searchParams.get("awb");

  if (!awb)
    return NextResponse.json({ error: "awb required" }, { status: 400 });

  try {
    const result = await fetchWaybill(awb);
    return NextResponse.json(result);
  } catch (err: any) {
    console.error("Fetch waybill failed:", err);
    return NextResponse.json(
      { error: err?.response ?? err?.message },
      { status: err?.status ?? 500 }
    );
  }
}
