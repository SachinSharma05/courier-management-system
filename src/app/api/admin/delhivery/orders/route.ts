import { NextResponse } from "next/server";
import { db } from "@/app/db/postgres";
import { delhiveryC2CShipments } from "@/app/db/schema";
import { desc, eq, like, and, gte, lte, ne } from "drizzle-orm";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);

    // Filters
    const search = url.searchParams.get("search") || "";
    const status = url.searchParams.get("status") || "";
    const from = url.searchParams.get("from") || "";
    const to = url.searchParams.get("to") || "";
    const pincode = url.searchParams.get("pincode") || "";

    // Pagination
    const page = Number(url.searchParams.get("page") || 1);
    const limit = Number(url.searchParams.get("limit") || 50);
    const offset = (page - 1) * limit;

    let conditions: any[] = [];

    if (search) {
      conditions.push(like(delhiveryC2CShipments.awb, `%${search}%`));
    }

    if (status) {
      conditions.push(eq(delhiveryC2CShipments.current_status, status));
    }

    if (pincode) {
      conditions.push(eq(delhiveryC2CShipments.customer_pincode, pincode));
    }

    if (from) {
      conditions.push(gte(delhiveryC2CShipments.created_at, new Date(from)));
    }

    if (to) {
      conditions.push(lte(delhiveryC2CShipments.created_at, new Date(to)));
    }

    // MAIN QUERY (with pagination)
    const data = await db
      .select()
      .from(delhiveryC2CShipments)
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(desc(delhiveryC2CShipments.created_at))
      .limit(limit)
      .offset(offset);

    // COUNT TOTAL ROWS FOR PAGINATION
    const totalRows = await db
      .select({ count: delhiveryC2CShipments.id })
      .from(delhiveryC2CShipments)
      .where(conditions.length ? and(...conditions) : undefined);

    const total = Number(totalRows[0]?.count || 0);
    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      success: true,
      data,
      total,
      totalPages,
      page,
      limit,
    });

  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}