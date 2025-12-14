import { NextResponse } from "next/server";
import { db } from "@/app/db/postgres";
import { consignments, trackingEvents } from "@/app/db/schema";
import { desc, like, and, gte, lte, sql, eq } from "drizzle-orm";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);

    const search = url.searchParams.get("search") || "";
    const status = url.searchParams.get("status") || "";
    const from = url.searchParams.get("from") || "";
    const to = url.searchParams.get("to") || "";
    const pincode = url.searchParams.get("pincode") || "";

    const page = Number(url.searchParams.get("page") || 1);
    const limit = Number(url.searchParams.get("limit") || 50);
    const offset = (page - 1) * limit;

    const conditions: any[] = [];

    // ✅ Provider filter
    conditions.push(sql`LOWER(${consignments.provider}) = 'delhivery'`);

    if (search) conditions.push(like(consignments.awb, `%${search}%`));
    if (status) conditions.push(eq(consignments.current_status, status));
    if (pincode) conditions.push(eq(consignments.destination_pincode, pincode));
    if (from) conditions.push(gte(consignments.created_at, new Date(from)));
    if (to) conditions.push(lte(consignments.created_at, new Date(to)));

    // -------------------------
    // CONSIGNMENTS
    // -------------------------
    const data = await db
      .select()
      .from(consignments)
      .where(and(...conditions))
      .orderBy(desc(consignments.created_at))
      .limit(limit)
      .offset(offset);

    // -------------------------
    // COUNT
    // -------------------------
    const countRes = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(consignments)
      .where(and(...conditions));

    const total = Number(countRes[0]?.count ?? 0);
    const totalPages = Math.ceil(total / limit);

    // -------------------------
    // TRACKING EVENTS
    // -------------------------
    const events = await db
      .select()
      .from(trackingEvents)
      .where(eq(trackingEvents.provider, "delhivery"))
      .orderBy(desc(trackingEvents.event_time));

    const eventMap = new Map<string, any[]>();
    for (const e of events) {
      if (!eventMap.has(e.consignment_id)) {
        eventMap.set(e.consignment_id, []);
      }
      eventMap.get(e.consignment_id)!.push(e);
    }

    // -------------------------
    // MERGE
    // -------------------------
    const enriched = data.map((c: any) => ({
      ...c,
      timeline: eventMap.get(c.id) || [],
    }));

    return NextResponse.json({
      success: true,
      data: enriched,
      total,
      totalPages,
      page,
      limit,
    });
  } catch (err: any) {
    console.error("Delhivery orders error:", err);
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}