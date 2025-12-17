const C2C_BASE = (process.env.DELHIVERY_C2C_BASE || "https://track.delhivery.com").replace(/\/$/, "");
const C2C_TOKEN = (process.env.DELHIVERY_C2C_TOKEN || "").trim();

async function c2cCall(
  path: string,
  method: string = "GET",
  body?: any,
  query?: any
) {
  const base = C2C_BASE.replace(/\/$/, ""); // ALWAYS a string
  const url = new URL(base + path);

  // Query params
  if (query) {
    for (const [k, v] of Object.entries(query)) {
      if (v !== undefined && v !== null) {
        url.searchParams.set(k, String(v));
      }
    }
  }

  let headers: Record<string, string> = {
    Authorization: `Token ${C2C_TOKEN}`,
  };

  let payload: any = undefined;

  // SPECIAL CASE → CMU create order (x-www-form-urlencoded)
  if (path === "/api/cmu/create.json") {
    headers["Content-Type"] = "application/x-www-form-urlencoded";
    headers["Accept"] = "application/json";

    const form = new URLSearchParams();
    form.append("format", "json");
    form.append("data", JSON.stringify(body));

    payload = form;
  } else {
    // Normal JSON
    if (method !== "GET") {
      headers["Content-Type"] = "application/json";
      payload = body ? JSON.stringify(body) : undefined;
    }
  }

  const res = await fetch(url.toString(), {
    method,
    headers,
    body: payload,
  });

  const raw = await res.text();
  try {
    return JSON.parse(raw);
  } catch {
    return raw;
  }
}

// -----------------------------------------------------
// 📦 C2C SURFACE/EXPRESS API EXPORTS
// -----------------------------------------------------
export const dlvC2C = {
  // ---- PINCODE ----
  pincode: (pin: string) =>
    c2cCall("/c/api/pin-codes/json/", "GET", undefined, {
      filter_codes: pin,
    }),

  // ---- TAT ----
  tat: (origin: string, dest: string, mot = "S") =>
    c2cCall("/api/dc/expected_tat", "GET", undefined, {
      origin_pin: origin,
      destination_pin: dest,
      mot,
    }),

  // ---- WAYBILL GENERATION ----
  generateWaybill: (count: number) =>
    c2cCall("/waybill/api/bulk/json/", "GET", undefined, {
      count,
    }),

  // ---- CREATE SHIPMENT ----
  createShipment: (payload: any) =>
  c2cCall("/api/cmu/create.json", "POST", payload),

  // ---- UPDATE / CANCEL SHIPMENT ----
  updateShipment: (payload: any) =>
    c2cCall("/api/p/edit", "POST", payload),

  cancelShipment: (payload: any) =>
    c2cCall("/api/p/edit", "POST", payload),

  // ---- EWAY BILL UPDATE ----
  updateEwaybill: (waybill: string, payload: any) =>
    c2cCall(`/api/rest/ewaybill/${waybill}/`, "POST", payload),

  // ---- TRACK SHIPMENT ----
  trackShipment: (awb: string, refId?: string) =>
    c2cCall("/api/v1/packages/json/", "GET", undefined, {
      waybill: awb,
      ref_ids: refId,
    }),

// ---- COST ESTIMATE ----
calculateCost: (query: {
  o_pin: string;
  d_pin: string;
  cgm: number;                  // grams
  md?: "E" | "S";
  pt?: "Pre-paid" | "COD";
  ss?: "Delivered" | "RTO" | "DTO";
  cod_amount?: number;
  client_code: string;          // 🔥 REQUIRED
}) => {
  const params: Record<string, any> = {
    o_pin: query.o_pin,
    d_pin: query.d_pin,
    cgm: query.cgm,
    md: query.md ?? "E",
    pt: query.pt ?? "Pre-paid",
    ss: query.ss ?? "Delivered",
    cl: query.client_code,      // ✅ THIS IS CORRECT
  };

  if (query.pt === "COD") {
    params.cod = query.cod_amount ?? 0;
    params.ocod = "Y";
    params.dcod = "Y";
  }

  return c2cCall(
    "/api/kinko/v1/invoice/charges/.json",
    "GET",
    undefined,
    params
  );
},

  // ---- LABEL GENERATION ----
  generateLabel: (awb: string) =>
  c2cCall("/api/p/packing_slip", "GET", undefined, {
    wbns: awb,
    pdf: "true",
    pdf_size: "A4",
  }),

  // ---- PICKUP REQUEST ----
  pickup: (payload: any) =>
    c2cCall("/fm/request/new/", "POST", payload),

  // ---- WAREHOUSE CREATE/UPDATE ----
  warehouseEdit: (payload: any) =>
    c2cCall("/api/backend/clientwarehouse/edit/", "POST", payload),

  // ---- DOCUMENT DOWNLOAD ----
  downloadDocument: (waybill: string, docType: string) =>
    c2cCall("/api/rest/fetch/pkg/document/", "GET", undefined, {
      doc_type: docType,
      waybill,
    }),

  // ---- NDR UPDATE (different base URL) ----
  ndrUpdate: (payload: any) =>
    c2cCall("/api/p/update", "POST", payload),
};