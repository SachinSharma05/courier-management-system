import { NextResponse } from "next/server";
import { db } from "@/app/db/postgres";
import { delhiveryC2CShipments } from "@/app/db/schema";
import { desc, eq, like, and, gte, lte } from "drizzle-orm";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);

    const search = url.searchParams.get("search") || "";
    const status = url.searchParams.get("status") || "";
    const from = url.searchParams.get("from") || "";
    const to = url.searchParams.get("to") || "";

    let conditions: any[] = [];

    if (search) {
      conditions.push(
        like(delhiveryC2CShipments.awb, `%${search}%`)
      );
    }

    if (status) {
      conditions.push(eq(delhiveryC2CShipments.current_status, status));
    }

    if (from) {
      conditions.push(gte(delhiveryC2CShipments.created_at, new Date(from)));
    }

    if (to) {
      conditions.push(lte(delhiveryC2CShipments.created_at, new Date(to)));
    }

    const rows = await db
      .select()
      .from(delhiveryC2CShipments)
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(desc(delhiveryC2CShipments.created_at));

    return NextResponse.json({ success: true, data: rows });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}
