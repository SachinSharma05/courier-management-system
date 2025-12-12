import { NextResponse } from "next/server";
import { dlvC2C } from "@/app/lib/delhivery/delhivery.c2c";

export async function GET(req: Request) {
  const url = new URL(req.url);

  const origin = url.searchParams.get("origin_pin") || "452010"; // Default to Indore
  const dest = url.searchParams.get("destination_pin");
  const mot = url.searchParams.get("mot") || "S";

  if (!origin || !dest)
    return NextResponse.json({ error: "origin_pin & destination_pin are required" }, { status: 400 });

  try {
    const tat = await dlvC2C.tat(origin, dest, mot);
    return NextResponse.json(tat);
  } catch (e: any) {
    return NextResponse.json({ error: e?.message }, { status: 500 });
  }
}