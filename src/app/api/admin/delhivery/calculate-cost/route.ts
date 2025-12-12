import { NextResponse } from "next/server";
import { callDelhivery } from "@/app/lib/delhivery/delhivery.c2c";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Example endpoint – adjust based on your actual Delhivery contract
    const result = await callDelhivery("/v1/rate-calculator", "POST", body);

    return NextResponse.json(result);
  } catch (err: any) {
    console.error("Cost calc failed:", err);
    return NextResponse.json(
      { error: err.response ?? err.message },
      { status: err.status ?? 500 }
    );
  }
}