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
  const [loading, setLoading] = useState(false);

  async function calculate() {
    setLoading(true);
    setResult(null);

    const r = await fetch("/api/admin/delhivery/calculate-cost", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    setResult(await r.json());
    setLoading(false);
  }

  return (
    <div className="p-8 space-y-8">
      <h1 className="text-2xl font-bold">Delhivery – Shipping Cost Calculator</h1>

      <div className="p-6 bg-white border rounded-xl shadow space-y-3">

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
            onChange={(e) => setPayload({ ...payload, destination_pincode: e.target.value })}
          />

          <input
            className="input"
            placeholder="Weight (kg)"
            value={payload.weight}
            onChange={(e) => setPayload({ ...payload, weight: e.target.value })}
          />

          <input
            className="input"
            placeholder="COD Amount"
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

        {result && (
          <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">{JSON.stringify(result, null, 2)}</pre>
        )}
      </div>
    </div>
  );
}
