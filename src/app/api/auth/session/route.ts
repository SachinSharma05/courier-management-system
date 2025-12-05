import { getIronSession, IronSession } from "iron-session";
import { sessionOptions } from "@/app/lib/auth/session";
import { NextResponse } from "next/server";

type SessionUser = { id: number; username: string; role: string };

export async function GET(req: Request) {
  const res = new NextResponse();

  const session = await getIronSession(req, res, sessionOptions);

  // Cast session properly
  const s = session as unknown as IronSession<Record<string, unknown>> & {
    user?: SessionUser;
  };

  if (!s.user) {
    return NextResponse.json({ ok: false });
  }

  return NextResponse.json({
    ok: true,
    user: s.user,
  });
}