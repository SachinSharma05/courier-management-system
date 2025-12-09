"use client";

import { useState } from "react";

export default function UpdateShipment() {
  const [awb, setAwb] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [response, setResponse] = useState<any>(null);

  async function update() {
    const r = await fetch("/api/admin/delhivery/update-shipment", {
      method: "POST",
      body: JSON.stringify({
        awb,
        update: { phone: newPhone },
      }),
    });

    setResponse(await r.json());
  }

  return (
    <div className="p-8 space-y-6">
      <h1 className="text-2xl font-bold">Update Delhivery Shipment</h1>

      <div className="p-6 bg-white border rounded-xl shadow-sm space-y-3">

        <input
          className="input"
          placeholder="AWB Number"
          value={awb}
          onChange={(e) => setAwb(e.target.value)}
        />

        <input
          className="input"
          placeholder="New Phone Number"
          value={newPhone}
          onChange={(e) => setNewPhone(e.target.value)}
        />

        <button onClick={update} className="btn-primary">Update Shipment</button>

        {response && (
          <pre className="bg-gray-100 p-4 rounded-xl text-sm">{JSON.stringify(response, null, 2)}</pre>
        )}
      </div>
    </div>
  );
}
