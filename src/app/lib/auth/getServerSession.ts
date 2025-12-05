// lib/auth/getServerSession
export const dynamic = "force-dynamic";

import { cookies } from "next/headers";

export async function getServerSession() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("cms_session")?.value;

    if (!token) return { ok: false };

    // Build ABSOLUTE URL for Vercel
    let base = process.env.NEXT_PUBLIC_APP_URL 
            || process.env.VERCEL_PROJECT_PRODUCTION_URL 
            || process.env.VERCEL_URL;

    if (!base) {
      // local dev
      base = "http://localhost:3000";
    }

    // Normalize to always include https://
    if (!base.startsWith("http")) {
      base = `https://${base}`;
    }

    // Remove trailing slash
    if (base.endsWith("/")) {
      base = base.slice(0, -1);
    }

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
