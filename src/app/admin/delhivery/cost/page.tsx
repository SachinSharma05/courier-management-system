"use client";

import { useState } from "react";

export default function CostCalculator() {
  const [payload, setPayload] = useState({
    origin_pincode: "",
    destination_pincode: "",
    weight: "",
    cod_amount: "",
    service: "standard",
  });

  const [result, setResult] = useState<any>(null);
  const [cost, setCost] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  async function calculate() {
    setLoading(true);
    setResult(null);
    setCost(null);

    const body = {
      origin_pin: payload.origin_pincode,
      destination_pin: payload.destination_pincode,
      cgm: Number(payload.weight) * 1000, // kg → grams
      mode: payload.service === "express" ? "E" : "S",
      payment_type: payload.cod_amount ? "COD" : "Pre-paid",
      cod_amount: payload.cod_amount ? Number(payload.cod_amount) : undefined,
      client_code: "VARIABLEINSTINCT C2C", // 🔥 from client credentials
    };

    const r = await fetch("/api/admin/delhivery/calculate-cost", {
      method: "POST",
      body: JSON.stringify(body),
    });

    const j = await r.json();
    setResult(j);

    if (j?.success) {
      const simplified = simplifyCost(j.result);
      setCost(simplified);
    }

    setLoading(false);
  }

  return (
    <div className="p-4 space-y-6">
      <h1 className="text-2xl font-bold">B2C/C2C – Shipping Cost Calculator</h1>

      <div className="p-6 bg-white border rounded-xl shadow space-y-3">
        {/* Form */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          <input
            className="input"
            placeholder="Origin Pincode"
            value={payload.origin_pincode}
            onChange={(e) => setPayload({ ...payload, origin_pincode: e.target.value })}
          />

          <input
            className="input"
            placeholder="Destination Pincode"
            value={payload.destination_pincode}
            onChange={(e) =>
              setPayload({ ...payload, destination_pincode: e.target.value })
            }
          />

          <input
            className="input"
            placeholder="Weight (kg)"
            value={payload.weight}
            onChange={(e) => setPayload({ ...payload, weight: e.target.value })}
          />

          <input
            className="input"
            placeholder="COD Amount (optional)"
            value={payload.cod_amount}
            onChange={(e) => setPayload({ ...payload, cod_amount: e.target.value })}
          />

          <select
            className="input"
            value={payload.service}
            onChange={(e) => setPayload({ ...payload, service: e.target.value })}
          >
            <option value="standard">Standard</option>
            <option value="express">Express</option>
          </select>
        </div>

        <button
          onClick={calculate}
          className="px-4 py-2 bg-black text-white rounded-md"
          disabled={loading}
        >
          {loading ? "Calculating…" : "Calculate"}
        </button>

        {/* Summary UI */}
        {cost && (
          <div className="mt-6 p-4 bg-white border rounded-xl shadow-sm">
            <h3 className="text-lg font-semibold mb-3">Shipping Cost Summary</h3>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">

              <SummaryCard label="Base Charge" value={cost.base_charge} />
              <SummaryCard label="Fuel Charge" value={cost.fsc} />
              <SummaryCard label="COD Charge" value={cost.cod_charge} />
              <SummaryCard label="CGST" value={cost.taxes.cgst} />
              <SummaryCard label="SGST" value={cost.taxes.sgst} />

              {cost.taxes.igst > 0 && (
                <SummaryCard label="IGST" value={cost.taxes.igst} />
              )}
            </div>

            <div className="mt-4 p-4 bg-blue-50 rounded-lg border">
              <p className="text-gray-700 font-medium">Total Shipping Cost</p>
              <p className="text-xl font-bold text-blue-700">₹{cost.total}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function SummaryCard({ label, value }: any) {
  return (
    <div className="p-3 bg-gray-50 rounded">
      <p className="text-gray-600">{label}</p>
      <p className="font-semibold">₹{value}</p>
    </div>
  );
}

// ---- Simplifier ----
function simplifyCost(result: any[]) {
  if (!Array.isArray(result) || !result.length) return null;

  const r = result[0];

  return {
    zone: r.zone,
    chargedWeight: r.charged_weight,
    base: r.charge_AIR + r.charge_FOD + r.charge_WOD,
    fuel: r.charge_FSC,
    cod: r.charge_COD + r.charge_CCOD,
    gst:
      r.tax_data?.CGST +
      r.tax_data?.SGST +
      r.tax_data?.IGST,
    total: r.total_amount,
  };
}