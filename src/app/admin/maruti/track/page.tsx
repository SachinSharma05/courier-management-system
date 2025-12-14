"use client";

import { useState } from "react";
import { Loader2, Search } from "lucide-react";

export default function MarutiTrackPage() {
  const [awb, setAwb] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  async function track() {
    if (!awb.trim()) return;

    setLoading(true);
    setResult(null);
    setError(null);

    try {
      const res = await fetch("/api/admin/maruti/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ awbs: [awb.trim()] }),
      });

      const json = await res.json();

      if (!json.success || !json.results?.length) {
        setError("No data found");
      } else {
        setResult(json.results[0]);
      }
    } catch (e: any) {
      setError(e.message || "Tracking failed");
    }

    setLoading(false);
  }

  return (
    <div className="p-8 space-y-6 max-w-4xl">

      <h1 className="text-2xl font-bold">Maruti – Track Shipment</h1>

      {/* Input */}
      <div className="flex gap-3">
        <input
          value={awb}
          onChange={(e) => setAwb(e.target.value)}
          placeholder="Enter Maruti AWB"
          className="border rounded-lg px-4 py-2 w-full"
        />
        <button
          onClick={track}
          disabled={loading}
          className="bg-indigo-600 text-white px-6 rounded-lg flex items-center gap-2"
        >
          {loading ? <Loader2 className="animate-spin" size={18} /> : <Search size={18} />}
          Track
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="p-4 bg-red-50 text-red-700 rounded border">
          {error}
        </div>
      )}

      {/* Result */}
      {result && (
        <div className="bg-white rounded-xl border shadow-sm p-6 space-y-6">

          {/* Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Stat label="AWB" value={result.awb} />
            <Stat label="Status" value={result.status || "Unknown"} />
            <Stat label="Provider" value="Maruti" />
          </div>

          {/* Timeline */}
          <div>
            <h2 className="font-semibold text-lg mb-3">Tracking Timeline</h2>

            {result.timeline?.length ? (
              <div className="space-y-4 max-h-[350px] overflow-y-auto pr-2">
                {result.timeline.map((t: any, i: number) => (
                  <div key={i} className="border-b pb-3">
                    <div className="text-xs text-gray-500">
                      {new Date(t.event_time).toLocaleString()}
                    </div>
                    <div className="font-medium">{t.status}</div>
                    <div className="text-sm text-gray-500">{t.location || "-"}</div>
                    {t.remarks && (
                      <div className="text-xs text-gray-400">{t.remarks}</div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No timeline available</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------------- UI Helper ---------------- */

function Stat({ label, value }: { label: string; value: any }) {
  return (
    <div className="p-4 bg-gray-50 rounded-lg border">
      <div className="text-xs text-gray-500">{label}</div>
      <div className="font-semibold">{value}</div>
    </div>
  );
}