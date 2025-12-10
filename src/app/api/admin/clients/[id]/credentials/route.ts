import { NextResponse } from "next/server";
import { db } from "@/app/db/postgres";
import { users, clientCredentials } from "@/app/db/schema";
import { eq } from "drizzle-orm";
import { encrypt, decrypt } from "@/app/lib/crypto/encryption";

export async function GET(req: Request, context: any) {
  const { id } = await context.params;
  const userId = Number(id);

  if (!userId || Number.isNaN(userId)) {
    return NextResponse.json({ ok: false, error: "Invalid client id" }, { status: 400 });
  }

  const rows = await db.select().from(users).where(eq(users.id, userId));
  if (!rows.length) {
    return NextResponse.json({ ok: false, error: "Client not found" }, { status: 404 });
  }

  const user = rows[0];

  let providerIds: number[] = [];
  try {
    if (Array.isArray(user.providers)) {
      providerIds = user.providers.map(Number);
    }
  } catch (_) {}

  // Load stored credentials
  const credsRows = await db
    .select()
    .from(clientCredentials)
    .where(eq(clientCredentials.client_id, userId));

  const creds: any = {
    username: "",
    password: "",
    api_token: "",
    api_key: "",
    DTDC_CUSTOMER_CODE: "",   // 🔥 ADDED HERE
  };

  for (const row of credsRows) {
    creds[row.env_key] = decrypt(row.encrypted_value);
  }

  return NextResponse.json({
    ok: true,
    clientProviderIds: providerIds,
    credentials: creds,
  });
}

export async function PUT(req: Request, context: any) {
  const { id } = await context.params;
  const userId = Number(id);

  if (!userId || Number.isNaN(userId)) {
    return NextResponse.json({ ok: false, error: "Invalid client id" }, { status: 400 });
  }

  const body = await req.json();

  const providerId = Number(body.providerId);
  if (!providerId) {
    return NextResponse.json({ ok: false, error: "ProviderId is required" });
  }

  // ⬅️ Add DTDC_CUSTOMER_CODE to your existing allowed fields
  const fields = [
    "username",
    "password",
    "api_token",
    "api_key",
    "DTDC_CUSTOMER_CODE",   // 🔥 ADDED HERE
  ];

  for (const key of fields) {
    if (!body[key]) continue; // skip empty fields

    const encrypted = encrypt(body[key]);

    await db
      .insert(clientCredentials)
      .values({
        client_id: userId,
        provider_id: providerId,
        env_key: key,
        encrypted_value: encrypted,
      })
      .onConflictDoUpdate({
        target: [
          clientCredentials.client_id,
          clientCredentials.provider_id,
          clientCredentials.env_key,
        ],
        set: { encrypted_value: encrypted },
      });
  }

  return NextResponse.json({ ok: true });
}
