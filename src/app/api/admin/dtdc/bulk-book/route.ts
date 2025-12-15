import { NextResponse } from "next/server";
import { db } from "@/app/db/postgres";
import { clientCredentials, consignments, providerShipments } from "@/app/db/schema";
import { eq } from "drizzle-orm";
import { decrypt } from "@/app/lib/crypto/encryption";

const DTDC_BOOK_URL =
  "https://app.shipsy.in/api/customer/integration/consignment/push";

async function loadCreds(clientId: number) {
  const rows = await db
    .select()
    .from(clientCredentials)
    .where(eq(clientCredentials.client_id, clientId));

  const creds: any = {};
  for (const r of rows) creds[r.env_key] = decrypt(r.encrypted_value);

  return {
    token: creds["api_token"],
    customerCode: creds["DTDC_CUSTOMER_CODE"],
  };
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { clientId, items } = body;

    if (!clientId || !Array.isArray(items)) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const creds = await loadCreds(clientId);
    if (!creds.token || !creds.customerCode) {
      return NextResponse.json({ error: "Missing DTDC credentials" }, { status: 400 });
    }

    const results: any[] = [];

    for (const item of items) {
      const payload = {
        customerCode: creds.customerCode,
        consigneeName: item.consignee_name,
        consigneeAddress: item.address,
        consigneePhone: item.phone,
        referenceNumber: item.reference || "",
        destinationPincode: item.pincode,
        weight: item.weight,
      };

      const res = await fetch(DTDC_BOOK_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Access-Token": creds.token,
        },
        body: JSON.stringify(payload),
      });

      const json = await res.json();

      if (json?.success && json?.awb) {
        // ----------------------------------
        // ✅ NEW NORMALIZED DB WRITE
        // ----------------------------------
        const [consignment] = await db
          .insert(consignments)
          .values({
            awb: json.awb,
            client_id: clientId,
            provider: "dtdc",

            reference_number: item.reference || null,

            destination_pincode: item.pincode ?? null,

            current_status: "BOOKED",
            booked_at: new Date(),
          })
          .onConflictDoNothing()
          .returning({ id: consignments.id });

        // optional but recommended
        if (consignment?.id) {
          await db.insert(providerShipments).values({
            consignment_id: consignment.id,
            provider: "dtdc",
            provider_awb: json.awb,
            raw_request: payload,
            raw_response: json,
            last_synced_at: new Date(),
          });
        }

        results.push({ ok: true, awb: json.awb });
      } else {
        results.push({ ok: false, error: json?.error || "Failed" });
      }
    }

    return NextResponse.json({ ok: true, results });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Server error" },
      { status: 500 }
    );
  }
}