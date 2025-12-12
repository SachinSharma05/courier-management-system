"use client";

import { useState } from "react";

export default function UpdateDelhiveryShipment() {
  const [form, setForm] = useState({
    awb: "",
    phone: "",
    address: "",
    name: "",
    cod_amount: "",
  });

  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  function updateField(key: string, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function submit() {
    setLoading(true);
    setResult(null);

    const payload: any = {
      waybill: form.awb,   // ✅ Matches your old working code
      update: {},
    };

    if (form.phone) payload.update.phone = form.phone;
    if (form.address) payload.update.add = form.address;
    if (form.name) payload.update.name = form.name;
    if (form.cod_amount) payload.update.cod_amount = Number(form.cod_amount);

    const res = await fetch("/api/admin/delhivery/update-shipment", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    setResult(await res.json());
    setLoading(false);
  }

  return (
    <div className="p-8 space-y-8">
      <h1 className="text-2xl font-bold">Update Delhivery Shipment</h1>

      <div className="bg-white border rounded-xl shadow-sm p-6 space-y-6">

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          <div>
            <label className="text-sm font-semibold">AWB Number</label>
            <input
              className="w-full mt-1 p-3 border rounded-lg"
              placeholder="Enter AWB"
              value={form.awb}
              onChange={(e) => updateField("awb", e.target.value)}
            />
          </div>

          <div>
            <label className="text-sm font-semibold">New Phone</label>
            <input
              className="w-full mt-1 p-3 border rounded-lg"
              placeholder="Enter phone"
              value={form.phone}
              onChange={(e) => updateField("phone", e.target.value)}
            />
          </div>

          <div className="md:col-span-2">
            <label className="text-sm font-semibold">New Address</label>
            <input
              className="w-full mt-1 p-3 border rounded-lg"
              placeholder="Enter address"
              value={form.address}
              onChange={(e) => updateField("address", e.target.value)}
            />
          </div>

          <div>
            <label className="text-sm font-semibold">New Customer Name</label>
            <input
              className="w-full mt-1 p-3 border rounded-lg"
              placeholder="Enter name"
              value={form.name}
              onChange={(e) => updateField("name", e.target.value)}
            />
          </div>

          <div>
            <label className="text-sm font-semibold">New COD Amount</label>
            <input
              className="w-full mt-1 p-3 border rounded-lg"
              placeholder="Enter COD amount"
              value={form.cod_amount}
              onChange={(e) => updateField("cod_amount", e.target.value)}
            />
          </div>

        </div>

        <button
          onClick={submit}
          disabled={loading}
          className="px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-900"
        >
          {loading ? "Updating..." : "Update Shipment"}
        </button>

        {result && (
          <pre className="bg-gray-100 p-4 rounded-lg text-sm overflow-auto">
            {JSON.stringify(result, null, 2)}
          </pre>
        )}
      </div>
    </div>
  );
}
