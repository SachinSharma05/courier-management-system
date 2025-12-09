"use client";

import { useState } from "react";

export default function RequestPickup() {
  const [payload, setPayload] = useState({
    warehouse: "",
    date: "",
  });

  const [response, setResponse] = useState<any>(null);

  async function submit() {
    const r = await fetch("/api/admin/delhivery/request-pickup", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    setResponse(await r.json());
  }

  return (
    <div className="p-8 space-y-6">
      <h1 className="text-2xl font-bold">Request Delhivery Pickup</h1>

      <div className="p-6 bg-white border rounded-xl shadow-sm space-y-3">

        <input
          className="input"
          placeholder="Warehouse ID"
          value={payload.warehouse}
          onChange={(e) => setPayload({ ...payload, warehouse: e.target.value })}
        />

        <input
          className="input"
          type="date"
          value={payload.date}
          onChange={(e) => setPayload({ ...payload, date: e.target.value })}
        />

        <button onClick={submit} className="btn-primary">
          Request Pickup
        </button>

        {response && (
          <pre className="bg-gray-100 p-4 rounded-xl text-sm">{JSON.stringify(response, null, 2)}</pre>
        )}
      </div>
    </div>
  );
}
