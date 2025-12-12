"use client";

import { useState } from "react";

export default function CancelShipmentPage() {
  const [awb, setAwb] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  async function cancel() {
    setLoading(true);
    setResult(null);

    const r = await fetch("/api/admin/delhivery/cancel-shipment", {
      method: "POST",
      body: JSON.stringify({ awb }),
    });

    const json = await r.json();
    setLoading(false);
    setResult(json);
  }

  return (
    <div className="p-8 space-y-6">
      <h1 className="text-2xl font-bold">Cancel Delhivery Shipment</h1>

      <div className="p-6 bg-white border rounded-xl shadow-sm space-y-4">
        <input
          className="w-full p-3 border rounded"
          placeholder="Enter AWB to Cancel"
          value={awb}
          onChange={(e) => setAwb(e.target.value)}
        />

        <button
          disabled={loading}
          onClick={cancel}
          className="px-4 py-2 bg-red-600 text-white rounded"
        >
          {loading ? "Cancelling…" : "Cancel Shipment"}
        </button>

        {result && (
          <pre className="bg-gray-100 p-4 rounded text-sm">
            {JSON.stringify(result, null, 2)}
          </pre>
        )}

        {result?.success && (
          <p className="text-green-600 font-medium">
            Shipment has been cancelled successfully.
          </p>
        )}
      </div>
    </div>
  );
}