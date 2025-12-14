import { NextResponse } from "next/server";
import { delhiveryC2C } from "@/app/lib/delhivery/c2c";
import { upsertDelhiveryTracking } from "@/app/lib/delhivery/upsertTracking";

type InputRow = {
  awb?: string | null;
  reference_number?: string | null;
};

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const clientId = Number(body?.clientId ?? 1);
    const rows: InputRow[] = Array.isArray(body?.rows) ? body.rows : [];

    if (!rows.length) {
      return NextResponse.json(
        { success: false, error: "No rows provided" },
        { status: 400 }
      );
    }

    const results: any[] = [];

    for (const row of rows) {
      const awb = row.awb?.trim() || null;
      const referenceNumber = row.reference_number?.trim() || null;

      try {
        let live;

        if (awb) {
          live = await delhiveryC2C("/api/v1/packages/json/", { waybill: awb });
        } else if (referenceNumber) {
          live = await delhiveryC2C("/api/v1/packages/json/", { ref_ids: referenceNumber });
        } else {
          throw new Error("Missing AWB and Reference No");
        }

        await upsertDelhiveryTracking(
          awb ?? `REF-${referenceNumber}`,
          live,
          clientId,
          referenceNumber
        );

        results.push({ awb, reference_number: referenceNumber, success: true });
      } catch (err: any) {
        results.push({
          awb,
          reference_number: referenceNumber,
          success: false,
          error: err.message,
        });
      }
    }

    return NextResponse.json({
      success: true,
      total: rows.length,
      results,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}