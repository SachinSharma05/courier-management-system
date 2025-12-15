import { NextResponse } from "next/server";
import { delhiveryC2C } from "@/app/lib/delhivery/c2c";
import { upsertDelhiveryTracking } from "@/app/lib/delhivery/upsertTracking";

export async function POST(req: Request) {
  try {
    const { awbs } = await req.json();
    if (!Array.isArray(awbs) || awbs.length === 0)
      return NextResponse.json({ success: false, error: "No AWBs provided" });

    const results = [];

    for (const awb of awbs) {
      try {
        const live = await delhiveryC2C("/api/v1/packages/json/", { waybill: awb });
        await upsertDelhiveryTracking(awb, live, 1);

        results.push({ awb, success: true });
      } catch (err: any) {
        results.push({ awb, success: false, error: err.message });
      }
    }

    return NextResponse.json({ success: true, results });

  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
