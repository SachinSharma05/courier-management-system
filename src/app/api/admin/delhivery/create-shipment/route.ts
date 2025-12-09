// src/app/api/admin/delhivery/create-shipment/route.ts
import { NextResponse } from "next/server";
import { createShipment } from "@/app/lib/delhivery/delhivery";

export async function POST(req: Request) {
  try {
    const payload = await req.json();
    // TODO: validate payload shape before calling provider
    const result = await createShipment(payload);
    return NextResponse.json(result);
  } catch (err: any) {
    console.error("Create shipment failed", err);
    return NextResponse.json(
      { error: err?.response ?? err?.message ?? "unknown" },
      { status: err?.status ?? 500 }
    );
  }
}