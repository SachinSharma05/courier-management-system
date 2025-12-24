// app/api/admin/providers/route.ts
import { NextResponse } from "next/server";
import { db } from "@/app/db/postgres";
import { providers } from "@/app/db/schema";

export async function GET() {
  try {
    const rows = await db.select().from(providers);

    return NextResponse.json({
      providers: rows.map((p) => ({
        id: p.id,
        key: p.key,      // ← IMPORTANT
        name: p.name,
        description: p.description,
        isActive: p.is_active,
      })),
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { key, name, description } = body;

    if (!key || !name) {
      return NextResponse.json({ ok: false, error: "Missing fields" }, { status: 400 });
    }

    await db.insert(providers).values({
      key,
      name,
      description: description ?? "",
      is_active: body.is_active ?? true,
    });

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
