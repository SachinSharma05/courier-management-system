// lib/providers/maruti/maruti.api.ts

const BASE_URL = process.env.MARUTI_BASE_URL!;
const USERNAME = process.env.MARUTI_USERNAME!;
const PASSWORD = process.env.MARUTI_PASSWORD!;

let accessToken: string | null = null;
let tokenExpiry = 0;

/* ----------------------------------------
   AUTH
----------------------------------------- */
async function getAccessToken() {
  if (accessToken && Date.now() < tokenExpiry) return accessToken;

  const res = await fetch(
    `${BASE_URL}/fulfillment/public/seller/auth/login`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: USERNAME,
        password: PASSWORD,
      }),
    }
  );

  if (!res.ok) {
    throw new Error("Maruti auth failed");
  }

  const json = await res.json();

  accessToken = json.accessToken;
  tokenExpiry = Date.now() + 23 * 60 * 60 * 1000; // 23 hours

  return accessToken;
}

async function authHeaders() {
  const token = await getAccessToken();
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
}

/* ----------------------------------------
   BOOKING
----------------------------------------- */
export async function marutiCreateOrder(payload: any) {
  const res = await fetch(
    `${BASE_URL}/fulfillment/public/seller/order/create`,
    {
      method: "POST",
      headers: await authHeaders(),
      body: JSON.stringify(payload),
    }
  );

  return res.json();
}

/* ----------------------------------------
   LABEL
----------------------------------------- */
export async function marutiDownloadLabel(awb: string, cAwb: string) {
  const headers = await authHeaders();

  return fetch(
    `${BASE_URL}/fulfillment/public/seller/order/download/label-invoice?awbNumber=${awb}&cAwbNumber=${cAwb}`,
    { headers }
  );
}

/* ----------------------------------------
   MANIFEST
----------------------------------------- */
export async function marutiCreateManifest(data: {
  awbNumber?: string[];
  cAwbNumber?: string[];
}) {
  const res = await fetch(
    `${BASE_URL}/fulfillment/public/seller/order/create-manifest`,
    {
      method: "POST",
      headers: await authHeaders(),
      body: JSON.stringify(data),
    }
  );

  return res.json();
}

// ✅ LIVE TRACK
export async function marutiTrackShipment(awb: string) {
  const res = await fetch(
    `${BASE_URL}/fulfillment/public/seller/order/order-tracking/${awb}`,
    { headers: await authHeaders() }
  );

  if (!res.ok) {
    throw new Error(`Maruti track failed: ${res.status}`);
  }

  return res.json();
}

/* ----------------------------------------
   CANCEL
----------------------------------------- */
export async function marutiCancelOrder(data: {
  awbNumber?: string;
  cAwbNumber?: string;
}) {
  const res = await fetch(
    `${BASE_URL}/fulfillment/public/seller/order/cancel`,
    {
      method: "POST",
      headers: await authHeaders(),
      body: JSON.stringify(data),
    }
  );

  return res.json();
}