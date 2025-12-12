import { NextResponse } from "next/server";
import { db } from "@/app/db/postgres";
import { delhiveryC2CShipments } from "@/app/db/schema";
import { eq } from "drizzle-orm";

export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;

  try {
    const rows = await db
      .select()
      .from(delhiveryC2CShipments)
      .where(eq(delhiveryC2CShipments.id, id))
      .limit(1);

    if (!rows[0]) return NextResponse.json({ success: false, error: "Not found" });

    return NextResponse.json({ success: true, data: rows[0] });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}