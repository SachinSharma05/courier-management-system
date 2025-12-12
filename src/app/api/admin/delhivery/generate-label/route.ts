// src/app/api/admin/delhivery/generate-label/route.ts
import { NextResponse } from "next/server";
import { generateLabel } from "@/app/lib/delhivery/delhivery.c2c";

export async function POST(req: Request) {
  try {
    const payload = await req.json();
    const res = await generateLabel(payload);
    return NextResponse.json(res);
  } catch (err: any) {
    console.error("Label generation failed", err);
    return NextResponse.json({ error: err?.response ?? err?.message }, { status: err?.status ?? 500 });
  }
}
