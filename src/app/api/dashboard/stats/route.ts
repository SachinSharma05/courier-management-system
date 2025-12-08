// /api/dashboard/stats/route.ts
import { NextResponse } from "next/server";
import { db } from "@/app/db/postgres";
import { consignments } from "@/app/db/schema";
import { sql } from "drizzle-orm";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const provider = searchParams.get("provider");

    console.log("Query provider =", provider);

    if (!provider) {
      return NextResponse.json(
        { error: "Missing provider query param" },
        { status: 400 }
      );
    }

    const p = provider.toLowerCase().trim();
    const jsonLiteral = `'${JSON.stringify([p])}'::jsonb`;

    // TOTAL
    const total = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(consignments)
      .where(sql`providers::jsonb @> ${sql.raw(jsonLiteral)}`);

    // DELIVERED
    const delivered = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(consignments)
      .where(
        sql`providers::jsonb @> ${sql.raw(jsonLiteral)} 
            AND LOWER(last_status) LIKE '%deliver%'`
      );

    // RTO
    const rto = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(consignments)
      .where(
        sql`providers::jsonb @> ${sql.raw(jsonLiteral)} 
            AND LOWER(last_status) LIKE '%rto%'`
      );

    const pending = total[0].count - delivered[0].count - rto[0].count;

    return NextResponse.json({
      provider: p,
      total: total[0].count,
      delivered: delivered[0].count,
      rto: rto[0].count,
      pending,
    });

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
