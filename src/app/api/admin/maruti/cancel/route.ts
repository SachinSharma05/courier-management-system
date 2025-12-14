import { NextResponse } from "next/server";
import { marutiCancelOrder } from "@/app/lib/maruti/maruti.api";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { awbNumber, cAwbNumber } = body;

    if (!awbNumber && !cAwbNumber) {
      return NextResponse.json({ success: false, error: "awb or cAwb required" }, { status: 400 });
    }

    const res = await marutiCancelOrder({ awbNumber, cAwbNumber });
    const json = await res.json();

    return NextResponse.json({ success: true, data: json });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}