"use client";

import { useState } from "react";

export default function NDRPage() {
  const [awb, setAwb] = useState("");
  const [action, setAction] = useState("reattempt");
  const [date, setDate] = useState("");
  const [remarks, setRemarks] = useState("");
  const [result, setResult] = useState<any>(null);

  async function submit() {
    const payload: any = { awb, action, remarks };

    if (action === "reschedule") payload.date = date;

    const r = await fetch("/api/admin/delhivery/ndr", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    setResult(await r.json());
  }

  return (
    <div className="p-8 space-y-8">
      <h1 className="text-2xl font-bold">Delhivery – NDR Management</h1>

      <div className="p-6 bg-white border rounded-xl shadow space-y-4">
        <input
          className="input"
          placeholder="AWB Number"
          value={awb}
          onChange={(e) => setAwb(e.target.value)}
        />

        <select
          className="input"
          value={action}
          onChange={(e) => setAction(e.target.value)}
        >
          <option value="reattempt">Reattempt Delivery</option>
          <option value="reschedule">Reschedule Delivery</option>
          <option value="rto">Return to Sender</option>
        </select>

        {action === "reschedule" && (
          <input
            className="input"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        )}

        <textarea
          className="input"
          placeholder="Remarks"
          value={remarks}
          onChange={(e) => setRemarks(e.target.value)}
        />

        <button onClick={submit} className="px-4 py-2 bg-black text-white rounded-md">
          Submit NDR Action
        </button>

        {result && (
          <pre className="bg-gray-100 p-4 rounded text-sm">{JSON.stringify(result, null, 2)}</pre>
        )}
      </div>
    </div>
  );
}
