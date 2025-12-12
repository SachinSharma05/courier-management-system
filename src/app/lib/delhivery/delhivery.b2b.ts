// ---------------------------------------
// DELHIVERY B2B (LTL) API
// ---------------------------------------

const B2B_BASE = process.env.DELHIVERY_B2B_BASE!;
const B2B_TOKEN = process.env.DELHIVERY_B2B_TOKEN!;

// Universal caller for B2B
async function b2bCall(path: string, method = "GET", body?: any, query?: any) {
  const url = new URL(B2B_BASE + path);

  if (query) {
    Object.entries(query).forEach(([k, v]) =>
      url.searchParams.set(k, v as string)
    );
  }

  const isForm = body instanceof FormData;

  const headers: any = {
    Authorization: `Token ${B2B_TOKEN}`,
  };

  if (!isForm) {
    headers["Content-Type"] = "application/json";
  }

  const res = await fetch(url.toString(), {
    method,
    headers,
    body: isForm ? body : body ? JSON.stringify(body) : undefined,
  });

  const raw = await res.text();
  let json;
  try { json = JSON.parse(raw); } catch { json = raw; }

  if (!res.ok) {
    const err: any = new Error("Delhivery B2B API Error");
    err.status = res.status;
    err.response = json;
    throw err;
  }

  return json;
}

// Exposed B2B functions

export const dlvB2B = {
  createManifest: (form: FormData) =>
    b2bCall(`/manifest`, "POST", form),

  manifestStatus: (jobId: string) =>
    b2bCall(`/manifest`, "GET", undefined, { job_id: jobId }),

  updateLR: (lr: string, form: FormData) =>
    b2bCall(`/lrn/update/${lr}`, "PUT", form),

  lrUpdateStatus: (jobId: string) =>
    b2bCall(`/lrn/update/status`, "GET", undefined, { job_id: jobId }),

  trackLR: (lr: string) =>
    b2bCall(`/lrn/track`, "GET", undefined, { lrnum: lr }),

  cancelLR: (lr: string) =>
    b2bCall(`/lrn/cancel/${lr}`, "DELETE"),

  warehouseCreate: (data: any) =>
    b2bCall(`/client-warehouse/create/`, "POST", data),

  warehouseUpdate: (data: any) =>
    b2bCall(`/client-warehouses/update`, "PATCH", data),

  bookAppointment: (payload: any) =>
    b2bCall(`/appointments/lm`, "POST", payload),

  createPUR: (payload: any) =>
    b2bCall(`/pickup_requests`, "POST", payload),

  cancelPUR: (id: string) =>
    b2bCall(`/pickup_requests/${id}`, "DELETE"),

  getLabelUrls: (lr: string) =>
    b2bCall(`/label/get_urls/std/${lr}`, "GET"),

  printLRCopy: (lr: string) =>
    b2bCall(`/lr_copy/print/${lr}`, "GET"),

  downloadDocument: (lrn: string, type: string, version = "latest") =>
    b2bCall(`/document/download`, "GET", undefined, {
      lrn,
      doc_type: type,
      version,
    }),

  freightBreakup: (list: string) =>
    b2bCall(`/lrn/freight-breakup`, "GET", undefined, { lrns: list }),
};
