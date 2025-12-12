"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useState, useEffect, useCallback } from "react";

const DEFAULT_PICKUP_PIN = "452010"; // change if needed
const generateOrderId = () => `VI-${Date.now()}`;

function Input({ label, error, className = "", ...props }: any) {
  return (
    <div className="flex flex-col gap-1 w-full">
      {label && <label className="text-sm font-medium">{label}</label>}
      <input
        {...props}
        className={
          "w-full p-2 border rounded-lg focus:outline-none " +
          (error ? "border-red-500" : "border-gray-300") +
          " " +
          className
        }
      />
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}

export default function CreateDelhiveryShipmentPage() {
  // ---------------------------
  // FORM STATE
  // ---------------------------
  const [form, setForm] = useState({
    order_id: generateOrderId(),
    channel: "VARIABLEINSTINCT C2C",

    customer_name: "",
    customer_phone: "",
    customer_email: "",
    customer_address: "",
    customer_pincode: "",

    length_cm: "",
    breadth_cm: "",
    height_cm: "",
    weight_kg: "",

    service_type: "surface", // surface | express
    payment_mode: "prepaid", // prepaid | cod
    cod_amount: 0,
  });

  const [errors, setErrors] = useState<any>({});
  const [estimate, setEstimate] = useState<any>(null);
  const [loadingEstimate, setLoadingEstimate] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<any>(null);

  // pincode & tat state
  const [pinInfo, setPinInfo] = useState<any>(null);
  const [pinLoading, setPinLoading] = useState(false);
  const [tatInfo, setTatInfo] = useState<number | null>(null);
  const [computations, setComputations] = useState({
    volumetric_kg: 0,
    chargeable_kg: 0,
  });

  function update(k: string, v: any) {
    setForm((f) => ({ ...f, [k]: v }));
    setErrors((e: any) => ({ ...e, [k]: null }));
  }

  function validate() {
    const e: any = {};
    if (!form.customer_name) e.customer_name = "Required";
    if (!form.customer_phone) e.customer_phone = "Required";
    if (!/^\d{6}$/.test(form.customer_pincode))
      e.customer_pincode = "Invalid pincode";
    if (!form.length_cm) e.length_cm = "Required";
    if (!form.breadth_cm) e.breadth_cm = "Required";
    if (!form.height_cm) e.height_cm = "Required";
    if (!form.weight_kg) e.weight_kg = "Required";
    if (form.payment_mode === "cod" && Number(form.cod_amount) <= 0)
      e.cod_amount = "COD amount required";

    setErrors(e);
    return Object.keys(e).length === 0;
  }

  // ---------------------------
  // WEIGHT CALC & CHARGABLE WEIGHT
  // ---------------------------
  // volumetric factor for cm -> kg: 5000 (common for couriers). Adjust if needed.
  useEffect(() => {
    const l = Number(form.length_cm || 0);
    const b = Number(form.breadth_cm || 0);
    const h = Number(form.height_cm || 0);
    const actual = Number(form.weight_kg || 0);

    if (!l || !b || !h) {
      setComputations({ volumetric_kg: 0, chargeable_kg: actual || 0 });
      return;
    }

    const volumetric_kg = +( (l * b * h) / 5000 ).toFixed(3);
    const chargeable_kg = Math.max(actual || 0, volumetric_kg);

    setComputations({ volumetric_kg, chargeable_kg });
  }, [form.length_cm, form.breadth_cm, form.height_cm, form.weight_kg]);

  // ---------------------------
  // PINCODE SERVICEABILITY & TAT (debounced)
  // ---------------------------
  const fetchPinAndTat = useCallback(
    async (pin: string) => {
      if (!/^\d{6}$/.test(pin)) {
        setPinInfo(null);
        setTatInfo(null);
        return;
      }

      setPinLoading(true);
      setPinInfo(null);
      setTatInfo(null);

      try {
        // Pincode details (your backend should proxy Delhivery pincode API)
        const p = await fetch(`/api/admin/delhivery/pincode?pin=${pin}`);
        const pj = await p.json();
        setPinInfo(pj?.delivery_codes?.[0]?.postal_code ?? pj ?? null);
      } catch (err) {
        console.error("Pin fetch failed", err);
        setPinInfo(null);
      } finally {
        setPinLoading(false);
      }

      try {
        // TAT — origin is your pickup pin, destination is the customer pin
        const t = await fetch(
          `/api/admin/delhivery/tat?origin_pin=${DEFAULT_PICKUP_PIN}&destination_pin=${pin}&mot=S`
        );
        const tj = await t.json();
        setTatInfo(tj?.data?.tat ?? null);
      } catch (err) {
        console.error("TAT fetch failed", err);
        setTatInfo(null);
      }
    },
    []
  );

  useEffect(() => {
    const pin = form.customer_pincode;
    if (!pin) {
      setPinInfo(null);
      setTatInfo(null);
      return;
    }
    const timeout = setTimeout(() => fetchPinAndTat(pin), 450);
    return () => clearTimeout(timeout);
  }, [form.customer_pincode, fetchPinAndTat]);

  // ---------------------------
  // AUTO FREIGHT ESTIMATE (debounced) - uses chargeable weight
  // ---------------------------
  const triggerEstimate = useCallback(async () => {
    if (!/^\d{6}$/.test(form.customer_pincode)) return;
    if (!form.length_cm || !form.breadth_cm || !form.height_cm) return;

    setLoadingEstimate(true);
    setEstimate(null);

    try {
      const res = await fetch("/api/admin/delhivery/create-shipment/estimate", {
        method: "POST",
        body: JSON.stringify({
          customer_pincode: form.customer_pincode,
          length_cm: Number(form.length_cm),
          breadth_cm: Number(form.breadth_cm),
          height_cm: Number(form.height_cm),
          weight_kg: computations.chargeable_kg,
          payment_mode: form.payment_mode,
          service_type: form.service_type,
        }),
      });

      const j = await res.json();
      setEstimate(j);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingEstimate(false);
    }
  }, [form.customer_pincode, form.length_cm, form.breadth_cm, form.height_cm, form.payment_mode, form.service_type, computations.chargeable_kg]);

  useEffect(() => {
    const timeout = setTimeout(triggerEstimate, 450);
    return () => clearTimeout(timeout);
  }, [triggerEstimate]);

  // ---------------------------
  // SUBMIT (Create in Production eventually - backend will handle which environment)
  // ---------------------------
  async function submit() {
    if (!validate()) return;

    setSubmitting(true);
    setResult(null);

    try {
      // Prepare payload for server API. Use chargeable weight there.
      const payload = {
        ...form,
        length_cm: Number(form.length_cm),
        breadth_cm: Number(form.breadth_cm),
        height_cm: Number(form.height_cm),
        // send both actual weight and chargeable weight
        weight_kg: Number(form.weight_kg || 0),
        chargeable_kg: computations.chargeable_kg,
        customer_city: pinInfo?.city ?? "Indore",
        customer_state: pinInfo?.state ?? "Madhya Pradesh",
      };

      const res = await fetch("/api/admin/delhivery/create-shipment", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      const j = await res.json();
      setResult(j);

      if (j?.success) {
        setForm((prev) => ({ ...prev, order_id: generateOrderId() }));
      }
    } catch (err) {
      console.error(err);
      setResult({ error: "Failed to create shipment" });
    } finally {
      setSubmitting(false);
    }
  }

  async function downloadLabel(awb: string) {
    const r = await fetch("/api/admin/delhivery/label", {
      method: "POST",
      body: JSON.stringify({ awb }),
    });

    const j = await r.json();

    if (j.base64) {
      const link = document.createElement("a");
      link.href = `data:application/pdf;base64,${j.base64}`;
      link.download = `${awb}.pdf`;
      link.click();
    }
  }

  // ---------------------------
  // UI
  // ---------------------------
  return (
    
    <div className="space-y-4 p-2 md:p-4">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Create Shipment</h1>
          <p className="text-sm text-gray-500 mt-1">
            Create Delhivery shipments quickly and easily.
          </p>
        </div>

        <div className="flex items-center gap-3">
            <Link href={`/admin/delhivery/bulk-shipment`}>
                <Button
                  className="bg-orange-600 text-white hover:bg-orange-700 px-5 h-10 rounded-lg flex items-center gap-2 shadow"
              >
                Bulk Create Shipment
              </Button>
            </Link>
          </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Form */}
        <div className="lg:col-span-2 space-y-6 p-6 bg-white border rounded-xl shadow-sm">
          {/* Order Details */}
          <h2 className="font-medium mb-3">Order Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Channel" value={form.channel} readOnly className="bg-gray-100 cursor-not-allowed" />
            <Input label="Order ID" value={form.order_id} readOnly className="bg-gray-100 cursor-not-allowed" />
          </div>

          {/* Customer Details */}
          <h2 className="font-medium mb-3 mt-6">Customer Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Name" value={form.customer_name} error={errors.customer_name}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => update("customer_name", e.target.value)} />
            <Input label="Phone" value={form.customer_phone} error={errors.customer_phone}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => update("customer_phone", e.target.value)} />
          </div>

          <Input label="Address"
            value={form.customer_address}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => update("customer_address", e.target.value)}
          />

          <div className="grid grid-cols-2 gap-4">
            <Input label="Pincode" value={form.customer_pincode}
              error={errors.customer_pincode}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => update("customer_pincode", e.target.value)} />
            <Input label="Email (optional)" value={form.customer_email}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => update("customer_email", e.target.value)} />
          </div>

          {/* Box Details */}
          <h2 className="font-medium mt-6">Package Details</h2>
          <div className="grid grid-cols-3 gap-4">
            <Input label="Length (cm)" value={form.length_cm}
              error={errors.length_cm}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => update("length_cm", e.target.value)} />
            <Input label="Breadth (cm)" value={form.breadth_cm}
              error={errors.breadth_cm}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => update("breadth_cm", e.target.value)} />
            <Input label="Height (cm)" value={form.height_cm}
              error={errors.height_cm}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => update("height_cm", e.target.value)} />
          </div>

          <div className="grid grid-cols-2 gap-4 mt-4">
            <Input label="Actual Weight (kg)" value={form.weight_kg}
              error={errors.weight_kg}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => update("weight_kg", e.target.value)} />

            <div className="bg-blue-50 p-3 rounded border">
              <p className="text-sm text-gray-600">Chargeable Weight</p>
              <p className="text-lg font-semibold">
                {computations.chargeable_kg ? `${computations.chargeable_kg} kg` : "--"}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Volumetric: {computations.volumetric_kg ? `${computations.volumetric_kg} kg` : "--"} · Actual: {form.weight_kg || "--"}
              </p>
            </div>
          </div>

          {/* Payment */}
          <h2 className="font-medium mt-6">Payment Mode</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Payment Mode</label>
              <select
                value={form.payment_mode}
                onChange={(e) => update("payment_mode", e.target.value)}
                className="w-full p-2 border rounded-lg"
              >
                <option value="prepaid">Prepaid</option>
                <option value="cod">COD</option>
              </select>
            </div>

            {form.payment_mode === "cod" && (
              <Input
                label="COD Amount"
                value={form.cod_amount}
                error={errors.cod_amount}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => update("cod_amount", e.target.value)}
              />
            )}
          </div>

          {/* Shipping Mode */}
          <h2 className="font-medium mt-6">Shipping Mode</h2>
          <div className="flex gap-4">
            <button
              className={
                "px-4 py-2 border rounded " +
                (form.service_type === "surface"
                  ? "bg-slate-800 text-white"
                  : "")
              }
              onClick={() => update("service_type", "surface")}
            >
              Surface
            </button>
            <button
              className={
                "px-4 py-2 border rounded " +
                (form.service_type === "express"
                  ? "bg-slate-800 text-white"
                  : "")
              }
              onClick={() => update("service_type", "express")}
            >
              Express
            </button>
          </div>

          {/* Submit */}
          <button
            onClick={submit}
            disabled={submitting}
            className="mt-6 px-6 py-3 rounded bg-slate-900 text-white"
          >
            {submitting ? "Creating..." : "Create Order & Get AWB"}
          </button>
        </div>

        {/* Right side - Insights */}
        <div className="p-6 bg-white border rounded-xl shadow-sm space-y-6">
          <h2 className="font-medium">Order Insights</h2>

          {/* Pincode serviceability */}
          <div>
            <p className="text-sm font-medium">Pincode</p>
            {pinLoading ? (
              <p className="text-sm text-gray-500">Checking serviceability…</p>
            ) : pinInfo ? (
              <div className="text-sm space-y-1">
                <p><strong>City:</strong> {pinInfo.city}</p>
                <p><strong>State:</strong> {pinInfo.state}</p>
                <p><strong>Is ODA:</strong> {pinInfo.is_oda === "Y" ? "Yes" : "No"}</p>
                <p><strong>COD Allowed:</strong> {pinInfo.cod === "Y" ? "Yes" : "No"}</p>
                <p><strong>Pre-paid:</strong> {pinInfo.pre_paid === "Y" ? "Yes" : "No"}</p>
                <p><strong>Center(s):</strong> {Array.isArray(pinInfo.center) ? pinInfo.center.slice(0,3).map((c:any)=>c.cn).join(", ") : "--"}</p>
              </div>
            ) : (
              <p className="text-sm text-gray-500">No pincode info</p>
            )}
          </div>

          {/* TAT */}
          <div>
            <p className="text-sm font-medium">Expected TAT</p>
            <p className="text-lg font-semibold">{tatInfo != null ? `${tatInfo} day(s)` : "—"}</p>
          </div>

          {/* Freight estimate */}
          <div>
            <p className="text-sm font-medium">Estimated Charges</p>
            {loadingEstimate ? (
              <p className="text-sm text-gray-500">Calculating…</p>
            ) :  estimate ? (
              <pre className="bg-gray-50 p-3 rounded text-sm">
                {JSON.stringify(extractUsefulCharges(estimate), null, 2)}
              </pre>
            ) : (
              <p className="text-sm text-gray-500">No estimate yet.</p>
            )}
          </div>

          {/* Create Result */}
          <h2 className="font-medium mt-4">Create Shipment Result</h2>
          {result ? (
            <pre className="bg-gray-50 p-3 rounded text-sm">{JSON.stringify(result, null, 2)}</pre>
          ) : (
            <p className="text-sm text-gray-500">No request made yet.</p>
          )}

          {/* Actions if created */}
          {result?.success && (result?.awb || result?.data?.awb) && (
            <div className="mt-3 flex gap-3">
              <button
                onClick={() => downloadLabel(result.data?.awb ?? result.awb)}
                className="px-4 py-2 bg-indigo-700 text-white rounded"
              >
                Download Label
              </button>

              <a
                href="/admin/delhivery/label"
                className="px-4 py-2 border rounded"
              >
                Open Label Page
              </a>

              <Link
                href="/admin/delhivery/orders"
                className="px-4 py-2 border rounded"
              >
                View All Orders
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function extractUsefulCharges(est: any) {
  if (!Array.isArray(est)) return {};

  const row = est[0] ?? {};

  return {
    total_amount: row.total_amount ?? 0,
    base_freight: row.change_f ?? 0,
    fuel_surcharge: row.change_fsc ?? 0,
    cod_charge: row.change_cod ?? 0,
    gst: row.tax_data?.igst_tax ?? 0,
    chargeable_weight_g: row.changed_weight ?? 0,
  };
}
