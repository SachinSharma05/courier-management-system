// src/app/api/admin/delhivery/pincode/route.ts
import { NextResponse } from "next/server";
import { checkPincode } from "@/app/lib/delhivery/delhivery";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const pincode = url.searchParams.get("pincode");
  if (!pincode) return NextResponse.json({ error: "pincode required" }, { status: 400 });

  try {
    const res = await checkPincode(pincode);
    return NextResponse.json(res);
  } catch (err: any) {
    console.error("Pincode check failed", err);
    return NextResponse.json({ error: err?.response ?? err?.message }, { status: err?.status ?? 500 });
  }
}