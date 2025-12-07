import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest, context: { params: { id: string } }) {
  const { id } = context.params;

  try {
    const body = await req.json();
    const provider = body.provider ?? "dtdc";

    // Forward to main DTDC tracking engine
    const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/dtdc/track`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        clientId: Number(id),
        provider,
        consignments: body.consignments ?? []
      }),
      cache: "no-store",
    });

    const json = await res.json();
    return NextResponse.json(json);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
