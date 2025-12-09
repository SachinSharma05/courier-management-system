"use client";

import { useState } from "react";

export default function FetchWaybill() {
  const [awb, setAwb] = useState("");
  const [result, setResult] = useState<any>(null);

  async function fetchWaybill() {
    const r = await fetch(`/api/admin/delhivery/fetch-waybill?awb=${awb}`);
    setResult(await r.json());
  }

  return (
    <div className="p-8 space-y-6">
      <h1 className="text-2xl font-bold">Fetch Delhivery Waybill</h1>

      <div className="p-6 bg-white rounded-xl border shadow-sm space-y-3">
        <input
          className="input"
          placeholder="Enter AWB"
          value={awb}
          onChange={(e) => setAwb(e.target.value)}
        />

        <button onClick={fetchWaybill} className="btn-primary">
          Fetch Waybill
        </button>

        {result && (
          <pre className="bg-gray-100 p-4 rounded-xl text-sm">{JSON.stringify(result, null, 2)}</pre>
        )}
      </div>
    </div>
  );
}
