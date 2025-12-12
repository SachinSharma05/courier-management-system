"use client";

import { useState } from "react";

export default function DelhiveryPincode() {
  const [pin, setPin] = useState("");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);

  const [tatOrigin, setTatOrigin] = useState("");
  const [tatDest, setTatDest] = useState("");
  const [tatResult, setTatResult] = useState<number | null>(null);

  async function check() {
    if (!pin) return;

    setLoading(true);
    setData(null);

    const r = await fetch(`/api/admin/delhivery/pincode?pin=${pin}`);
    const j = await r.json();

    setLoading(false);
    setData(j.data);
  }

  async function checkTat() {
  if (!tatOrigin || !tatDest) return;

  const r = await fetch(
    `/api/admin/delhivery/tat?origin=${tatOrigin}&dest=${tatDest}`
  );
  const j = await r.json();

  if (j.success) {
    setTatResult(j.data?.tat ?? null);
  } else {
    setTatResult(null);
    alert("TAT not available");
  }
}

  const postal = data?.delivery_codes?.[0]?.postal_code;

  return (
    <div className="p-8 space-y-6">
      <h1 className="text-2xl font-bold">Delhivery Pincode Serviceability</h1>

      {/* Search Box */}
      <div className="p-6 bg-white rounded-xl shadow border space-y-3">
        <div className="flex gap-3">
          <input
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            placeholder="Enter Pincode"
            className="w-full p-3 border rounded-lg"
          />
          <button
            onClick={check}
            disabled={loading}
            className="px-5 py-3 bg-indigo-600 text-white rounded-lg"
          >
            {loading ? "Checking…" : "Check"}
          </button>
        </div>

        {/* No results */}
        {data && !postal && (
          <div className="text-red-600 font-medium">
            No data found for this pincode.
          </div>
        )}

        {/* Result View */}
        {postal && (
          <div className="space-y-6 mt-4">

            {/* Top Summary Card */}
            <div className="p-4 bg-gray-50 border rounded-lg">
              <h2 className="text-lg font-semibold">Basic Information</h2>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3 text-sm">
                <div><strong>City:</strong> {postal.city}</div>
                <div><strong>State:</strong> {postal.state_code}</div>
                <div><strong>District:</strong> {postal.district}</div>
                <div><strong>COD:</strong> {postal.cod === "Y" ? "Available" : "No"}</div>
                <div><strong>Prepaid:</strong> {postal.pre_paid === "Y" ? "Available" : "No"}</div>
                <div><strong>Pickup:</strong> {postal.pickup === "Y" ? "Yes" : "No"}</div>
                <div><strong>ODA:</strong> {postal.is_oda === "Y" ? "Yes" : "No"}</div>
                <div><strong>Cash:</strong> {postal.cash === "Y" ? "Yes" : "No"}</div>
              </div>
            </div>

            {/* Centers */}
            <div>
              <h2 className="text-lg font-semibold mb-2">Centers</h2>

              <div className="max-h-72 overflow-auto border rounded-lg divide-y">
                {postal.center?.map((c: any, idx: number) => (
                  <div key={idx} className="p-3 text-sm flex justify-between">
                    <div>
                      <div className="font-medium">{c.cn}</div>
                      <div className="text-gray-600 text-xs">
                        Sort Code: {c.sort_code}
                      </div>
                    </div>
                    <div className="text-xs text-gray-500">
                      Updated: {c.ud?.split("T")[0]}
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

        {/* --------------------------- */}
{/*      TAT ESTIMATION UI       */}
{/* --------------------------- */}
<div className="mt-8 p-5 border rounded-xl bg-white shadow-sm space-y-4">
  <h2 className="text-lg font-semibold">TAT (Delivery ETA) Estimation</h2>

  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
    <input
      placeholder="Origin Pincode"
      className="p-3 border rounded-lg"
      value={tatOrigin}
      onChange={(e) => setTatOrigin(e.target.value)}
    />

    <input
      placeholder="Destination Pincode"
      className="p-3 border rounded-lg"
      value={tatDest}
      onChange={(e) => setTatDest(e.target.value)}
    />

    <button
      onClick={checkTat}
      className="px-4 py-2 bg-indigo-600 text-white rounded-lg"
    >
      Check TAT
    </button>
  </div>

  {tatResult !== null && (
    <div className="p-4 bg-gray-50 border rounded-lg text-sm">
      <strong>Estimated Delivery:</strong>{" "}
      {tatResult === 0 ? "Same Day" : `${tatResult} Days`}
    </div>
  )}
</div>

      </div>
    </div>
  );
}