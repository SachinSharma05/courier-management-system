import { NextResponse } from "next/server";
import { db } from "@/app/db/postgres";
import { consignments, trackingHistory, clientCredentials } from "@/app/db/schema";
import { eq } from "drizzle-orm";
import { decrypt } from "@/app/lib/crypto/encryption";

const DTDC_CANCEL_URL =
  "https://app.shipsy.in/api/customer/integration/cancel"; // from your PDF mapping

async function loadCreds(clientId: number) {
  const rows = await db
    .select()
    .from(clientCredentials)
    .where(eq(clientCredentials.client_id, clientId));

  const creds: any = {};
  for (const r of rows) creds[r.env_key] = decrypt(r.encrypted_value);

  return {
    loginID: creds["DTDC_CUSTOMER_CODE"],
    requestID: creds["api_token"],
  };
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { clientId, awb, reason } = body;

    if (!clientId || !awb || !reason) {
      return NextResponse.json(
        { error: "clientId, awb, and reason are required" },
        { status: 400 }
      );
    }

    const creds = await loadCreds(clientId);
    if (!creds.loginID || !creds.requestID) {
      return NextResponse.json({ error: "Missing DTDC credentials" }, { status: 400 });
    }

    // Call DTDC Cancel API
    const payload = {
      loginID: creds.loginID,
      requestID: creds.requestID,
      AWBNumbers: awb,
      cancelReason: reason,
    };

    const res = await fetch(DTDC_CANCEL_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Access-Token": creds.requestID,
      },
      body: JSON.stringify(payload),
    });

    const json = await res.json();

    if (!res.ok || json?.status !== "SUCCESS") {
      return NextResponse.json(
        { error: json?.message || "Cancel failed" },
        { status: 400 }
      );
    }

    // Update DB
    await db
      .update(consignments)
      .set({ current_status: "CANCELLED" })
      .where(eq(consignments.awb, awb));

    await db.insert(trackingHistory).values({
      consignment_id: awb,
      old_status: null,
      new_status: "CANCELLED",
      changed_at: new Date(),
    });

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
