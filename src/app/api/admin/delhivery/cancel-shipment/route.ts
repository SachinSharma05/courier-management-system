import { NextResponse } from "next/server";
import { dlvC2C } from "@/app/lib/delhivery/delhivery.c2c";
import { db } from "@/app/db/postgres";
import { delhiveryC2CShipments } from "@/app/db/schema";
import { eq } from "drizzle-orm";

export async function POST(req: Request) {
  try {
    const { awb } = await req.json();

    if (!awb) {
      return NextResponse.json({ success: false, error: "AWB required" }, { status: 400 });
    }

    // Payload expected by Delhivery
    const payload = {
      waybill: awb,
      cancellation: "true"
    };

    const result = await dlvC2C.cancelShipment(payload);

    const success =
      typeof result === "string"
        ? result.includes("<status>True</status>")
        : result?.status === "Success" || result?.success;

    // Update DB
    if (success) {
      await db
        .update(delhiveryC2CShipments)
        .set({
          current_status: "Cancelled",
          updated_at: new Date(),
          cancellation_response: result
        })
        .where(eq(delhiveryC2CShipments.awb, awb));
    }

    return NextResponse.json({
      success,
      result
    });
  } catch (err: any) {
    console.error("Cancel shipment failed:", err);
    return NextResponse.json(
      { success: false, error: err?.message ?? err },
      { status: 500 }
    );
  }
}