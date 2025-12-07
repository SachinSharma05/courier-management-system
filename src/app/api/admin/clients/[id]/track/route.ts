import { NextRequest, NextResponse } from "next/server";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // params is a Promise → MUST await it
    const { id } = await context.params;

    const body = await req.json();

    const provider = body.provider ?? "dtdc";

    // Forward request to real DTDC engine
    const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/dtdc/track`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        clientId: Number(id),
        provider,
        consignments: body.consignments ?? [] // optional for auto-pending tracking
      }),
      cache: "no-store"
    });

    const json = await res.json();
    return NextResponse.json(json);

  } catch (err: any) {
    return NextResponse.json(
      { error: err.message ?? "Internal error" },
      { status: 500 }
    );
  }
}
