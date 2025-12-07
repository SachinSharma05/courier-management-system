import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const secret = req.headers.get("x-cron-secret");
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const base = process.env.NEXT_PUBLIC_APP_URL!;
    const res = await fetch(`${base}/api/admin/cron/cleanup-retail`, {
      method: "GET",
      cache: "no-store",
    });

    const json = await res.json();
    return NextResponse.json(json);

  } catch (err: any) {
    console.error("CLEANUP CRON ERROR:", err);
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
