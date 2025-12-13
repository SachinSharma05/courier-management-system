// src/app/api/admin/dtdc/book/route.ts
import { NextResponse } from "next/server";
import { db } from "@/app/db/postgres";
import { clientCredentials, consignments, providerShipments } from "@/app/db/schema";
import { eq, sql } from "drizzle-orm";
import { decrypt } from "@/app/lib/crypto/encryption";

/* loadClientCreds */
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

    if (!clientId) {
      return NextResponse.json({ ok: false, error: "clientId missing" }, { status: 400 });
    }

    const creds = await loadClientCreds(clientId);
    const token = creds["SHIPSY_API_TOKEN"] ?? process.env.SHIPSY_TOKEN;
    const customerCode = creds["SHIPSY_CUSTOMER_CODE"] ?? creds["DTDC_CUSTOMER_CODE"];

    if (!token) {
      return NextResponse.json({ ok: false, error: "Missing ShipSy token" }, { status: 400 });
    }
    if (!customerCode) {
      return NextResponse.json({ ok: false, error: "Missing customer code for client" }, { status: 400 });
    }

    const shipSyBody = {
      ...payload,
      shipper_code: customerCode,
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
      return NextResponse.json(
        { ok: false, error: json?.message ?? "ShipSy error", detail: json },
        { status: 500 }
      );
    }

    const awb = json?.data?.consignment?.awb ?? json?.awb ?? null;
    if (!awb) {
      return NextResponse.json(
        { ok: false, error: "AWB not returned from ShipSy", detail: json },
        { status: 500 }
      );
    }

    // ------------------------------------------------
    // ✅ NEW DB WRITES (ONLY CHANGE)
    // ------------------------------------------------

    // 1️⃣ Insert into consignments
    const [consignment] = await db
      .insert(consignments)
      .values({
        client_id: clientId,
        provider: "dtdc",
        awb,

        reference_number: payload?.order_id ?? null,

        service_type: payload?.service_type ?? null,
        payment_mode: payload?.payment_mode ?? null,
        cod_amount:
          payload?.payment_mode === "cod" ? Number(payload?.cod_amount ?? 0) : 0,

        origin: payload?.origin_city ?? null,
        destination: payload?.destination_city ?? null,
        origin_pincode: payload?.origin_pincode ?? null,
        destination_pincode: payload?.destination_pincode ?? null,

        current_status: "BOOKED",
        booked_at: sql`NOW()` as any,
      })
      .onConflictDoNothing()
      .returning({ id: consignments.id });

    // 2️⃣ Insert provider shipment (raw ShipSy / DTDC data)
    if (consignment?.id) {
      await db.insert(providerShipments).values({
        consignment_id: consignment.id,
        provider: "dtdc",

        provider_awb: awb,
        provider_order_id: json?.data?.consignment?.order_id ?? null,

        raw_request: shipSyBody,
        raw_response: json,

        last_synced_at: new Date(),
      });
    }

    return NextResponse.json({ ok: true, awb, raw: json });
  } catch (err: any) {
    console.error("BOOKING ERROR:", err);
    return NextResponse.json(
      { ok: false, error: err?.message ?? String(err) },
      { status: 500 }
    );
  }
}