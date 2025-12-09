import { NextResponse } from "next/server";
import { callDelhivery } from "@/app/lib/delhivery/delhivery";

export async function POST(req: Request) {
  try {
    const payload = await req.json();

    // Example endpoint (verify your exact Delhivery NDR API path)
    const result = await callDelhivery("/v1/ndr/action", "POST", payload);

    return NextResponse.json(result);
  } catch (err: any) {
    console.error("NDR action failed:", err);
    return NextResponse.json(
      { error: err.response ?? err.message },
      { status: err.status ?? 500 }
    );
  }
}
