// lib/dtdc/client.ts
import { decrypt } from "@/app/lib/crypto/encryption";
import { DTDCAuth } from "@/interface/DTDCAuth";

/**
 * Convert DB credential rows into a usable DTDCAuth object.
 */
export function buildAuthFromRows(
  rows: { env_key: string; encrypted_value: string }[]
): DTDCAuth {
  const out: Record<string, string | undefined> = {};

  for (const r of rows) {
    const value = decrypt(r.encrypted_value);
    // Convert null → undefined so TS matches DTDCAuth
    out[r.env_key] = value ?? undefined;
  }

  return {
    username: out["DTDC_USERNAME"],
    password: out["DTDC_PASSWORD"],
    trackingToken: out["DTDC_TRACKING_TOKEN"],
    apiKey: out["DTDC_LABEL_API_KEY"],
    customerCode: out["DTDC_CUSTOMER_CODE"],
  };
}
