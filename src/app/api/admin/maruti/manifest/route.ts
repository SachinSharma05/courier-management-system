import { NextResponse } from "next/server";
import { marutiCreateManifest } from "@/app/lib/maruti/maruti.api";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { awbNumbers = [], cAwbNumbers = [] } = body;

    if (!awbNumbers.length && !cAwbNumbers.length) {
      return NextResponse.json({ success: false, error: "No AWBs provided" }, { status: 400 });
    }

    const res = await marutiCreateManifest({
      awbNumber: awbNumbers,
      cAwbNumber: cAwbNumbers,
    });

    const json = await res.json();

    return NextResponse.json({ success: true, data: json });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}