import { NextResponse } from "next/server";
import { marutiDownloadLabel } from "@/app/lib/maruti/maruti.api";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const awb = searchParams.get("awb");
  const cAwb = searchParams.get("cAwb");

  if (!awb || !cAwb) {
    return NextResponse.json({ success: false, error: "awb & cAwb required" }, { status: 400 });
  }

  try {
    const res = await marutiDownloadLabel(awb, cAwb);
    const buffer = await res.arrayBuffer();
    
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename=maruti_${awb}.pdf`,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}