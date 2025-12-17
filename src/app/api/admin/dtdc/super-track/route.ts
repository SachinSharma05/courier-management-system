// /api/admin/dtdc/super-track/route.ts
import { NextResponse } from "next/server";
import { db } from "@/app/db/postgres";
import { consignments } from "@/app/db/schema";
import { eq, and } from "drizzle-orm";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const awb = searchParams.get("awb");

    if (!awb) {
      return NextResponse.json(
        { ok: false, error: "AWB required" },
        { status: 400 }
      );
    }

    const rows = await db
      .select({
        awb: consignments.awb,
        client_id: consignments.client_id,
        provider: consignments.provider,
        current_status: consignments.current_status,
        last_status_at: consignments.last_status_at,
      })
      .from(consignments)
      .where(
        and(
          eq(consignments.awb, awb),
          eq(consignments.provider, "dtdc")
        )
      );

    return NextResponse.json({ ok: true, rows });

  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err.message },
      { status: 500 }
    );
  }
}
