import { NextResponse } from "next/server";
import { dlvC2C } from "@/app/lib/delhivery/delhivery.c2c";

export async function POST(req: Request) {
  try {
    const payload = await req.json();

    const { awb, action, date, remarks } = payload;

    if (!awb || !action) {
      return NextResponse.json(
        { error: "AWB and action are required" },
        { status: 400 }
      );
    }

    // Convert UI values → Delhivery values
    const act =
      action === "reattempt"
        ? "RE-ATTEMPT"
        : action === "reschedule"
        ? "PICKUP-RESCHEDULE"
        : action === "rto"
        ? "RTO"
        : null;

    if (!act) {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    // Build Delhivery body structure
    const delhiveryPayload: any = {
      data: [
        {
          waybill: awb,
          act,
        },
      ],
    };

    if (remarks) delhiveryPayload.data[0].remarks = remarks;
    if (date) delhiveryPayload.data[0].date = date;

    // Call Delhivery NDR API
    const result = await dlvC2C.ndrUpdate(delhiveryPayload);

    return NextResponse.json(result);
  } catch (err: any) {
    console.error("NDR Action Error:", err);

    return NextResponse.json(
      { error: err.response ?? err.message },
      { status: err.status ?? 500 }
    );
  }
}