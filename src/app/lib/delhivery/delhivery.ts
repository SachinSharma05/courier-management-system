// src/lib/delhivery.ts
import fetch from "node-fetch";

const BASE = process.env.DELHIVERY_API_BASE;
const TOKEN = process.env.DELHIVERY_API_TOKEN;
const USE_BEARER = process.env.DELHIVERY_USE_BEARER === "true";

if (!BASE || !TOKEN) {
  console.warn("Delhivery env not configured: DELHIVERY_API_BASE or DELHIVERY_API_TOKEN missing");
}

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

// ------------------------------
// Core Caller (named export)
// ------------------------------
export async function callDelhivery<T = any>(
  path: string,
  method: HttpMethod = "POST",
  body?: unknown,
  query?: Record<string, string>
): Promise<T> {
  const url = new URL(`${BASE}${path}`);
  if (query) Object.entries(query).forEach(([k, v]) => url.searchParams.set(k, v));

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Authorization: USE_BEARER ? `Bearer ${TOKEN}` : `Token ${TOKEN}`,
  };

  const res = await fetch(url.toString(), {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const text = await res.text();
  let json: any = null;

  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = text;
  }

  if (!res.ok) {
    const err: any = new Error("Delhivery API error");
    err.status = res.status;
    err.response = json ?? text;
    throw err;
  }

  return json;
}

// ------------------------------
// Named Wrappers (all exported)
// ------------------------------
export async function checkPincode(pincode: string) {
  return callDelhivery(`/public/pincode/search`, "POST", { pincode });
}

export async function createShipment(payload: any) {
  return callDelhivery(`/v3/package/create`, "POST", payload);
}

export async function updateShipment(payload: any) {
  return callDelhivery(`/v3/package/update`, "POST", payload);
}

export async function fetchWaybill(awb: string) {
  return callDelhivery(`/public/get_awb_details?awb=${encodeURIComponent(awb)}`, "GET");
}

export async function generateLabel(payload: any) {
  return callDelhivery(`/v2/package/label/generate`, "POST", payload);
}

export async function requestPickup(payload: any) {
  return callDelhivery(`/public/pickup/create`, "POST", payload);
}

export async function trackShipment(awb: string) {
  return callDelhivery(`/public/track?awb=${encodeURIComponent(awb)}`, "GET");
}

// Additional ones we added earlier
export async function calculateCost(payload: any) {
  return callDelhivery(`/v1/rate-calculator`, "POST", payload);
}

export async function ndrAction(payload: any) {
  return callDelhivery(`/v1/ndr/action`, "POST", payload);
}