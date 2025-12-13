// lib/providers/maruti/maruti.api.ts
import axios from "axios";

const BASE_URL = process.env.MARUTI_BASE_URL!;
const USERNAME = process.env.MARUTI_USERNAME!;
const PASSWORD = process.env.MARUTI_PASSWORD!;

let accessToken: string | null = null;
let tokenExpiry = 0;

// ---------- AUTH ----------
async function getAccessToken() {
  if (accessToken && Date.now() < tokenExpiry) return accessToken;

  const res = await axios.post(
    `${BASE_URL}/fulfillment/public/seller/auth/login`,
    { username: USERNAME, password: PASSWORD }
  );

  accessToken = res.data.accessToken;
  tokenExpiry = Date.now() + 23 * 60 * 60 * 1000; // 23 hrs
  return accessToken;
}

async function authHeaders() {
  const token = await getAccessToken();
  return { Authorization: `Bearer ${token}` };
}

// ---------- BOOKING ----------
export async function marutiCreateOrder(payload: any) {
  return axios.post(
    `${BASE_URL}/fulfillment/public/seller/order/create`,
    payload,
    { headers: await authHeaders() }
  );
}

// ---------- LABEL ----------
export async function marutiDownloadLabel(awb: string, cAwb: string) {
  return axios.get(
    `${BASE_URL}/fulfillment/public/seller/order/download/label-invoice`,
    {
      headers: await authHeaders(),
      params: { awbNumber: awb, cAwbNumber: cAwb },
    }
  );
}

// ---------- MANIFEST ----------
export async function marutiCreateManifest(data: {
  awbNumber?: string[];
  cAwbNumber?: string[];
}) {
  return axios.post(
    `${BASE_URL}/fulfillment/public/seller/order/create-manifest`,
    data,
    { headers: await authHeaders() }
  );
}

// ---------- TRACK ----------
export async function marutiTrackOrder(awb: string) {
  return axios.get(
    `${BASE_URL}/fulfillment/public/seller/order/order-tracking/${awb}`,
    { headers: await authHeaders() }
  );
}

// ---------- CANCEL ----------
export async function marutiCancelOrder(data: {
  awbNumber?: string;
  cAwbNumber?: string;
}) {
  return axios.post(
    `${BASE_URL}/fulfillment/public/seller/order/cancel`,
    data,
    { headers: await authHeaders() }
  );
}