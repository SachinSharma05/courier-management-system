"use client";

import { useState } from "react";

export default function TrackShipment() {
  const [awb, setAwb] = useState("");
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  async function track() {
    setLoading(true);
    setResult(null);

    const r = await fetch(`/api/admin/delhivery/track?awb=${awb}`);
    setResult(await r.json());

    setLoading(false);
  }

  return (
    <div className="p-8 space-y-6">
      <h1 className="text-2xl font-bold">Track Delhivery Shipment</h1>

      <div className="p-6 bg-white border rounded-xl shadow-sm space-y-3">
        <input
          className="input"
          placeholder="Enter AWB"
          value={awb}
          onChange={(e) => setAwb(e.target.value)}
        />

        <button onClick={track} className="btn-primary" disabled={loading}>
          {loading ? "Tracking…" : "Track Shipment"}
        </button>

        {result && (
          <pre className="bg-gray-100 p-4 rounded-xl text-sm">{JSON.stringify(result, null, 2)}</pre>
        )}
      </div>
    </div>
  );
}
