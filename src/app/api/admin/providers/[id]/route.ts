import { NextResponse } from "next/server";
import { db } from "@/app/db/postgres";
import { providers } from "@/app/db/schema";
import { eq } from "drizzle-orm";

/* ---------------------- GET SINGLE PROVIDER ---------------------- */
export async function GET(req: Request, context: any) {
  const { id } = await context.params;
  const providerId = Number(id);

  if (!providerId || Number.isNaN(providerId)) {
    return NextResponse.json(
      { ok: false, error: "Invalid provider id" },
      { status: 400 }
    );
  }

  const rows = await db
    .select()
    .from(providers)
    .where(eq(providers.id, providerId));

  if (!rows.length) {
    return NextResponse.json(
      { ok: false, error: "Provider not found" },
      { status: 404 }
    );
  }

  return NextResponse.json({
    ok: true,
    provider: rows[0],
  });
}

/* ---------------------- UPDATE PROVIDER ---------------------- */
export async function PUT(req: Request, context: any) {
  const { id } = await context.params;
  const providerId = Number(id);

  if (!providerId || Number.isNaN(providerId)) {
    return NextResponse.json(
      { ok: false, error: "Invalid provider id" },
      { status: 400 }
    );
  }

  const body = await req.json();
  const { name, key, description } = body;

  await db
    .update(providers)
    .set({
      name,
      key,
      description,
    })
    .where(eq(providers.id, providerId));

  return NextResponse.json({ ok: true });
}