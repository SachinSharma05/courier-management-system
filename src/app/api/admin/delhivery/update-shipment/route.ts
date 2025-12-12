import { NextResponse } from "next/server";
import { dlvC2C } from "@/app/lib/delhivery/delhivery.c2c";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    if (!body.waybill) {
      return NextResponse.json(
        { success: false, error: "waybill is required" },
        { status: 400 }
      );
    }

    // Delhivery expects a flat object, NOT nested update object
    const payload = {
      waybill: body.waybill,
      ...body.update   // merge all editable fields into root
    };

    console.log("UPDATE PAYLOAD →", payload);

    const result = await dlvC2C.updateShipment(payload);

    return NextResponse.json({ success: true, result });
  } catch (err: any) {
    console.error("Update shipment failed:", err);
    return NextResponse.json(
      { success: false, error: err?.response ?? err?.message },
      { status: err?.status ?? 500 }
    );
  }
}
