// app/api/auth/logout/route.ts
import { NextResponse } from "next/server";
import { sessionOptions } from "@/app/lib/auth/session";

export async function POST(req: Request) {
  const { getIronSession } = await import("iron-session");
  const session = await getIronSession(req, new Response(), sessionOptions);
  session.destroy();
  return NextResponse.json({ ok: true });
}