// app/api/admin/maruti/shipments/route.ts
import { NextResponse } from "next/server";
import { db } from "@/app/db/postgres";
import { consignments } from "@/app/db/schema";
import { and, desc, eq, like, gte, lte } from "drizzle-orm";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);

    // Filters
    const search = url.searchParams.get("search") || "";
    const status = url.searchParams.get("status") || "";
    const from = url.searchParams.get("from");
    const to = url.searchParams.get("to");

    // Pagination
    const page = Number(url.searchParams.get("page") || 1);
    const limit = Number(url.searchParams.get("limit") || 50);
    const offset = (page - 1) * limit;

    const conditions: any[] = [];

    // 🔑 Provider filter
    conditions.push(eq(consignments.provider, "maruti"));

    if (search) {
      conditions.push(like(consignments.awb, `%${search}%`));
    }

    if (status && status !== "all") {
      conditions.push(eq(consignments.current_status, status));
    }

    if (from) {
      conditions.push(gte(consignments.created_at, new Date(from)));
    }

    if (to) {
      conditions.push(lte(consignments.created_at, new Date(to)));
    }

    const where = conditions.length ? and(...conditions) : undefined;

    // MAIN DATA
    const data = await db
      .select()
      .from(consignments)
      .where(where)
      .orderBy(desc(consignments.created_at))
      .limit(limit)
      .offset(offset);

    // COUNT
    const countRes = await db
      .select({ count: consignments.id })
      .from(consignments)
      .where(where);

    const total = Number(countRes.length);
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
    console.error("Maruti shipments error:", err);
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}
