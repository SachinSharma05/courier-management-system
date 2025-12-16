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
  // FINAL RESPONSE
  // ------------------------------------------
  return NextResponse.json({
    ok: true,
    client,
  });
}

export async function PUT(req: Request, context: any) {
  const { id } = await context.params; // ✅ FIXED

  const numId = Number(id);
  if (isNaN(numId)) {
    return Response.json(
      { ok: false, error: "Invalid ID" },
      { status: 400 }
    );
  }

  const body = await req.json();

  await db
    .update(users)
    .set({
      username: body.username,
      email: body.email,
      company_name: body.company_name,
      company_address: body.company_address,
      contact_person: body.contact_person,
      phone: body.phone,
      providers: body.providers ?? [],
    })
    .where(eq(users.id, numId));

  return Response.json({ ok: true });
}