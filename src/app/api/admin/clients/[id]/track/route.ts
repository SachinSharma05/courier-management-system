import { NextResponse } from "next/server";

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const clientId = Number(params.id);
    if (!clientId) {
      return NextResponse.json({ error: "Invalid clientId" }, { status: 400 });
    }

    const body = await req.json();
    const provider = body?.provider || "dtdc";

    // Call your EXISTING working DTDC tracking API
    const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/admin/dtdc/track`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
      body: JSON.stringify({
        clientId,
        provider,
        // Do NOT send consignments → /api/dtdc/track will auto-fetch pending AWBs
      }),
    });

    const json = await res.json();
    return NextResponse.json(json);

  } catch (err: any) {
    console.error("TRACK WRAPPER ERROR:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
