// src/app/api/admin/dtdc/book/route.ts
import { NextResponse } from "next/server";
import { db } from "@/app/db/postgres";
import { consignments, trackingHistory, clientCredentials } from "@/app/db/schema";
import { eq, sql } from "drizzle-orm";
import { decrypt } from "@/app/lib/crypto/encryption";

/**
 * POST body (example):
 * {
 *   clientId: 3,
 *   payload: { /* shipper/consignee/weight etc *\/ }
 * }
 *
 * This calls ShipSy (or ShipSy-like) endpoint to create AWB, then saves AWB into consignments.
 */

async function loadClientCreds(clientId: number) {
  const rows = await db.select().from(clientCredentials).where(eq(clientCredentials.client_id, clientId));
  const creds: Record<string, string | undefined> = {};
  for (const r of rows) creds[r.env_key] = decrypt(r.encrypted_value);
  return creds;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const clientId = Number(body?.clientId ?? 0);
    const payload = body?.payload ?? {};

    if (!clientId) return NextResponse.json({ ok: false, error: "clientId missing" }, { status: 400 });

    const creds = await loadClientCreds(clientId);
    // expecting creds like { SHIPSY_API_TOKEN, SHIPSY_CUSTOMER_CODE } or similar
    const token = creds["SHIPSY_API_TOKEN"] ?? process.env.SHIPSY_TOKEN;
    const customerCode = creds["SHIPSY_CUSTOMER_CODE"] ?? creds["DTDC_CUSTOMER_CODE"];

    if (!token) return NextResponse.json({ ok: false, error: "Missing ShipSy token" }, { status: 400 });
    if (!customerCode) {
      // fallback behaviour: use clientId as retail if needed or fail
      return NextResponse.json({ ok: false, error: "Missing customer code for client" }, { status: 400 });
    }

    // map payload to ShipSy expected fields — adjust this map for your account
    const shipSyBody = {
      ...payload,
      shipper_code: customerCode, // typical mapping; change if different
      // other required fields...
    };

    const SHIPSY_URL = process.env.SHIPSY_URL ?? "https://app.shipsy.in";
    const ENDPOINT = `${SHIPSY_URL}/api/client/integration/consignment/create`;

    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(shipSyBody),
    });

    const json = await res.json().catch(() => ({}));

    if (!res.ok) {
      return NextResponse.json({ ok: false, error: json?.message ?? "ShipSy error", detail: json }, { status: 500 });
    }

    // extract AWB from ShipSy response — adapt path to real response
    const awb = json?.data?.consignment?.awb ?? json?.awb ?? null;
    if (!awb) {
      return NextResponse.json({ ok: false, error: "AWB not returned from ShipSy", detail: json }, { status: 500 });
    }

    // Save to consignments (upsert style). Keep columns minimal — adapt as per your schema
    await db
      .insert(consignments)
      .values({
        awb,
        client_id: clientId,
        providers: ["dtdc"], // or ["shipsy"] if you prefer
        lastStatus: "BOOKED",
        bookedOn: sql`NOW()` as any,
        updatedAt: sql`NOW()` as any,
      })
      .onConflictDoNothing();

    // option: insert tracking history entry
    await db.insert(trackingHistory).values({
      consignmentId: sql`(select id from consignments where awb = ${awb})`,
      oldStatus: null,
      newStatus: "BOOKED",
    } as any);

    return NextResponse.json({ ok: true, awb, raw: json });
  } catch (err: any) {
    console.error("BOOKING ERROR:", err);
    return NextResponse.json({ ok: false, error: err?.message ?? String(err) }, { status: 500 });
  }
}
