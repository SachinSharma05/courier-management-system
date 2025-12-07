import { NextResponse } from "next/server";
import { db } from "@/app/db/postgres";
import { sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 1);

    // 1. Fetch delivered consignments older than 1 days
    const { rows } = await db.execute(sql`
      SELECT id
      FROM consignments
      WHERE LOWER(last_status) LIKE '%reta%'
      AND last_updated_on < ${cutoff}
      LIMIT 500
    `);

    if (!rows.length) {
      return NextResponse.json({
        ok: true,
        deleted: 0,
        message: "No consignments eligible for cleanup",
      });
    }

    const ids = rows.map((r: any) => r.id);

    // Convert → UUID[] array for Postgres
    const idArray = sql`ARRAY[${sql.join(ids.map(id => sql`${id}`), sql`,`)}]::uuid[]`;

    // 2. Delete from tracking_history
    await db.execute(sql`
      DELETE FROM tracking_history
      WHERE consignment_id = ANY(${idArray})
    `);

    // 3. Delete from tracking_events
    await db.execute(sql`
      DELETE FROM tracking_events
      WHERE consignment_id = ANY(${idArray})
    `);

    // 4. Delete consignments
    await db.execute(sql`
      DELETE FROM consignments
      WHERE id = ANY(${idArray})
    `);

    return NextResponse.json({
      ok: true,
      deleted: ids.length,
      message: `Deleted ${ids.length} delivered consignments older than 10 days`,
    });

  } catch (err) {
    console.error("CLEANUP ERROR:", err);
    return NextResponse.json({
      ok: false,
      error: String(err),
    }, { status: 500 });
  }
}
