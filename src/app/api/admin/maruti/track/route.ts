import { NextResponse } from "next/server";
import { marutiTrackShipment } from "@/app/lib/maruti/maruti.api";
import { upsertMarutiTracking } from "@/app/lib/maruti/upsertTracking";

export async function POST(req: Request) {
  try {
    const { awbs } = await req.json();

    if (!Array.isArray(awbs) || !awbs.length) {
      return NextResponse.json(
        { success: false, error: "AWBs required" },
        { status: 400 }
      );
    }

    const results: any[] = [];

    for (const awb of awbs) {
      try {
        const live = await marutiTrackShipment(awb);
        await upsertMarutiTracking(awb, live);

        results.push({
          awb,
          success: true,
          status: live?.currentStatus || "Unknown",
        });
      } catch (err: any) {
        results.push({
          awb,
          success: false,
          error: err.message,
        });
      }
    }

    return NextResponse.json({
      success: true,
      total: awbs.length,
      results,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}
