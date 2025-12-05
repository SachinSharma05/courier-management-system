// lib/auth/getServerSession
export const dynamic = "force-dynamic";

import { cookies } from "next/headers";

export async function getServerSession() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("cms_session")?.value;

    if (!token) return { ok: false };

    // ----- FIXED BASE URL RESOLUTION -----
    let base =
      process.env.NEXT_PUBLIC_APP_URL ||     // Recommended - manually define this
      process.env.VERCEL_URL ||             // Provided automatically by Vercel
      "http://localhost:3000";              // Fallback for local dev

    // Ensure full URL
    if (!base.startsWith("http")) {
      base = `https://${base}`;
    }

    // Remove trailing slash
    if (base.endsWith("/")) {
      base = base.slice(0, -1);
    }
    // -------------------------------------

    const res = await fetch(`${base}/api/auth/session`, {
      method: "GET",
      headers: {
        Cookie: `cms_session=${token}`,
      },
      cache: "no-store",
    });

    return await res.json();
  } catch (err) {
    console.error("getServerSession error:", err);
    return { ok: false };
  }
}
