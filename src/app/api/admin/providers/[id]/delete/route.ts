import { NextResponse } from "next/server";
import { db } from "@/app/db/postgres";
import { providers } from "@/app/db/schema";
import { eq } from "drizzle-orm";

export async function DELETE(req: Request, context: any) {
  const { id } = await context.params;
  const providerId = Number(id);

  if (!providerId || Number.isNaN(providerId)) {
    return NextResponse.json(
      { ok: false, error: "Invalid provider id" },
      { status: 400 }
    );
  }

  await db.delete(providers).where(eq(providers.id, providerId));

  return NextResponse.json({ ok: true });
}