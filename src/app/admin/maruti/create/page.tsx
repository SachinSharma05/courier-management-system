"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";

export default function MarutiCreateShipment() {
  const [loading, setLoading] = useState(false);
  const [awb, setAwb] = useState<string | null>(null);

  async function submit(e: any) {
    e.preventDefault();
    setLoading(true);
    setAwb(null);

    const form = Object.fromEntries(new FormData(e.currentTarget));

    const res = await fetch("/api/admin/maruti/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    const json = await res.json();
    if (json.success) setAwb(json.awb);

    setLoading(false);
  }

  return (
    <div className="p-8 max-w-3xl space-y-6">
      <h1 className="text-2xl font-bold">Maruti – Create Shipment</h1>

      <form onSubmit={submit} className="bg-white p-6 rounded-xl border space-y-4">

        <Input name="reference_number" label="Reference Number" />
        <Input name="origin_city" label="Origin City" />
        <Input name="destination_city" label="Destination City" />
        <Input name="destination_pincode" label="Destination Pincode" />

        <Input name="weight_kg" label="Weight (kg)" type="number" />

        <select name="payment_mode" className="border rounded px-3 py-2 w-full">
          <option value="prepaid">Prepaid</option>
          <option value="cod">COD</option>
        </select>

        <button
          disabled={loading}
          className="bg-indigo-600 text-white px-6 py-2 rounded flex items-center gap-2"
        >
          {loading && <Loader2 className="animate-spin" size={16} />}
          Create Shipment
        </button>
      </form>

      {awb && (
        <div className="p-4 bg-green-50 border rounded text-green-700">
          ✅ Shipment created. AWB: <b>{awb}</b>
        </div>
      )}
    </div>
  );
}

function Input({ label, ...props }: any) {
  return (
    <div>
      <label className="text-sm text-gray-600">{label}</label>
      <input {...props} className="border rounded px-3 py-2 w-full" />
    </div>
  );
}