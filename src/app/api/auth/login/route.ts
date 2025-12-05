import { NextResponse } from "next/server";
import { db } from "@/app/db/postgres";
import { users } from "@/app/db/schema";
import { verifyPassword } from "@/app/lib/auth";
import { eq } from "drizzle-orm";
import { sessionOptions } from "@/app/lib/auth/session";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { username, password } = body;

    // 1. Fetch user
    const found = await db
      .select()
      .from(users)
      .where(eq(users.username, username))
      .limit(1);

    if (found.length === 0) {
      return NextResponse.json(
        { ok: false, error: "Invalid credentials" },
        { status: 401 }
      );
    }

    const user = found[0];

    // 2. Verify password
    const ok = await verifyPassword(user.password_hash, password);
    if (!ok) {
      return NextResponse.json(
        { ok: false, error: "Invalid credentials" },
        { status: 401 }
      );
    }

    // 3. Create Iron Session
    const { getIronSession } = await import("iron-session");

    const res = NextResponse.json({
      ok: true,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,   // <-- IMPORTANT: frontend uses this!
      },
    });

    const session: any = await getIronSession(req, res, sessionOptions);

    session.user = {
      id: user.id,
      username: user.username,
      role: user.role,
    };

    await session.save();

    return res;


  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error(error);
      return NextResponse.json(
        { ok: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { ok: false, error: "Unexpected error", detail: error },
      { status: 500 }
    );
  }
}
