import { NextResponse } from "next/server";
import { db } from "@/app/db/postgres";
import { consignments } from "@/app/db/schema";
import { sql } from "drizzle-orm";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const provider = url.searchParams.get("provider");

    console.log("Provider from query =", provider);

    if (!provider) {
      return NextResponse.json(
        { error: "Missing provider param" },
        { status: 400 }
      );
    }

    const p = provider.toLowerCase().trim();

    // pagination
    const page = Number(url.searchParams.get("page") ?? 1);
    const pageSize = Number(url.searchParams.get("pageSize") ?? 50);
    const offset = (page - 1) * pageSize;

    // status filter
    const status = url.searchParams.get("status");

    const where = [sql`providers::jsonb @> ${JSON.stringify([p])}::jsonb`];

    if (status && status !== "all") {
      if (status === "delivered") {
        where.push(sql`LOWER(last_status) LIKE '%deliver%'`);
      } else if (status === "rto") {
        where.push(sql`LOWER(last_status) LIKE '%rto%'`);
      } else if (status === "pending") {
        where.push(sql`
          LOWER(last_status) NOT LIKE '%deliver%' 
          AND LOWER(last_status) NOT LIKE '%rto%'
        `);
      } else {
        where.push(sql`LOWER(last_status) LIKE ${"%" + status + "%"}`);
      }
    }

    const whereSQL =
      where.length > 0 ? sql`${sql.join(where, sql` AND `)}` : sql`TRUE`;

    // count
    const totalRows = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(consignments)
      .where(whereSQL);

    const total = totalRows[0].count;

    // data
    const rows = await db
      .select({
        id: consignments.id,
        awb: consignments.awb,
        last_status: consignments.lastStatus,
        booked_on: consignments.bookedOn,
        last_updated_on: consignments.lastUpdatedOn,
        origin: consignments.origin,
        destination: consignments.destination,
        providers: consignments.providers,
        client_id: consignments.client_id,
      })
      .from(consignments)
      .where(whereSQL)
      .orderBy(sql`COALESCE(last_updated_on, created_at) DESC`)
      .limit(pageSize)
      .offset(offset);

    return NextResponse.json({
      provider: p,
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
      items: rows,
    });
  } catch (err: any) {
    console.error("API ERROR:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
