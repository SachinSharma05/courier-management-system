// app/api/auth/register/route.ts
import { NextResponse } from "next/server";
import { db } from "@/app/db/postgres";
import { users } from "@/app/db/schema";
import { hashPassword } from "@/app/lib/auth";
import { eq } from "drizzle-orm";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { username, email, password, company_name, contact_person, phone } = body;

    if (!username || !email || !password) {
      return NextResponse.json(
        { ok: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    // check existing username
    const existing = await db
      .select()
      .from(users)
      .where(eq(users.username, username))
      .limit(1);

    if (existing.length > 0) {
      return NextResponse.json(
        { ok: false, error: "Username taken" },
        { status: 409 }
      );
    }

    const password_hash = await hashPassword(password);

    const inserted = await db
      .insert(users)
      .values({
        username,
        email,
        password_hash,
        company_name: company_name || null,
        contact_person: contact_person || null,
        phone: phone || null,
      })
      .returning();

    return NextResponse.json({
      ok: true,
      user: {
        id: inserted[0].id,
        username: inserted[0].username,
      },
    });
  } catch (err) {
    console.error("Registration Error:", err);
    return NextResponse.json(
      { ok: false, error: "Server error" },
      { status: 500 }
    );
  }
}