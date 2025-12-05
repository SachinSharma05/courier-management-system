import { NextResponse } from "next/server";
import { db } from "@/app/db/postgres";
import { users } from "@/app/db/schema";
import { eq, sql } from "drizzle-orm";

export async function GET(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params;

  if (!id) {
    return NextResponse.json({ ok: false, error: "Missing client ID" }, { status: 400 });
  }

  const clientId = Number(id);
  if (isNaN(clientId)) {
    return NextResponse.json({ ok: false, error: "Invalid numeric ID" }, { status: 400 });
  }

  // ------------------------------------------
  // Fetch client
  // ------------------------------------------
  const result = await db
    .select()
    .from(users)
    .where(eq(users.id, clientId))
    .limit(1);

  if (!result.length) {
    return NextResponse.json({ ok: false, error: "Client not found" }, { status: 404 });
  }

  const client = result[0];

  // ------------------------------------------
  // Fetch PENDING consignments
  // FIX: provider → providers JSONB
  // ------------------------------------------
  const pendingSQL = await db.execute(sql`
    SELECT 
      id,
      awb,
      providers->>0 AS provider,     -- extract first provider from JSONB array
      last_status,
      created_at
    FROM consignments
    WHERE client_id = ${clientId}
      AND LOWER(last_status) NOT LIKE '%deliver%'
      AND LOWER(last_status) NOT LIKE '%rto%'
    ORDER BY created_at DESC
    LIMIT 50
  `);

  const pendingConsignments = pendingSQL.rows;

  // ------------------------------------------
  // FINAL RESPONSE
  // ------------------------------------------
  return NextResponse.json({
    ok: true,
    client,
    pendingConsignments,
  });
}
