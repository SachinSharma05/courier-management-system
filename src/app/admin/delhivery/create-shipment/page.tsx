"use client";

import { useState, useEffect } from "react";
import type { CreateShipmentPayload, DelhiveryItem } from "@/interface/Delhivery";

function Input(props: any) {
  return <input {...props} className="w-full p-2 border rounded-lg focus:outline-none" />;
}

function Textarea(props: any) {
  return <textarea {...props} className="w-full p-2 border rounded-lg focus:outline-none" />;
}

export default function DelhiveryCreate() {
  const [loading, setLoading] = useState(false);
  const [payload, setPayload] = useState<CreateShipmentPayload>({
    pickup_location: "",
    service_type: "standard",
    cod_amount: 0,
    order: { name: "", phone: "", address: "", pincode: "" },
    items: [{ name: "", qty: 1 }],
    total_weight: undefined,
    dimensions: {},
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pincodeCheck, setPincodeCheck] = useState<any>(null);
  const [result, setResult] = useState<any>(null);

  useEffect(() => {
    // compute total weight if items have weight
    const w = payload.items.reduce((s, it) => s + (it.weight ?? 0) * (it.qty ?? 1), 0);
    if (w > 0) setPayload((p) => ({ ...p, total_weight: parseFloat(w.toFixed(2)) }));
  }, [payload.items]);

  function updateOrder(k: keyof CreateShipmentPayload["order"], v: any) {
    setPayload((p) => ({ ...p, order: { ...p.order, [k]: v } }));
  }

  function updateItem(idx: number, k: keyof DelhiveryItem, v: any) {
    const items = [...payload.items];
    // @ts-ignore
    items[idx][k] = k === "qty" ? Number(v) : v;
    setPayload((p) => ({ ...p, items }));
  }

  function addItem() {
    setPayload((p) => ({ ...p, items: [...p.items, { name: "", qty: 1 }] }));
  }
  function removeItem(i: number) {
    setPayload((p) => ({ ...p, items: p.items.filter((_, idx) => idx !== i) }));
  }

  async function checkPincode() {
    if (!payload.order.pincode) return setErrors({ pincode: "Enter pincode first" });
    setErrors({});
    setPincodeCheck(null);
    try {
      const r = await fetch(`/api/admin/delhivery/pincode?pincode=${encodeURIComponent(payload.order.pincode)}`);
      const j = await r.json();
      setPincodeCheck(j);
    } catch (e: any) {
      setPincodeCheck({ error: e.message || "Failed" });
    }
  }

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (!payload.order.name) e.name = "Name required";
    if (!payload.order.phone || !/^\d{7,15}$/.test(payload.order.phone)) e.phone = "Valid phone required";
    if (!payload.order.address) e.address = "Address required";
    if (!payload.order.pincode || !/^\d{5,6}$/.test(payload.order.pincode)) e.pincode = "Valid pincode required";
    payload.items.forEach((it, idx) => {
      if (!it.name) e[`item_name_${idx}`] = "Item name required";
      if (!it.qty || it.qty <= 0) e[`item_qty_${idx}`] = "Qty > 0";
    });
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function submit() {
    if (!validate()) return;
    setLoading(true);
    setResult(null);
    try {
      const r = await fetch("/api/admin/delhivery/create-shipment", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      const j = await r.json();
      setResult(j);
      if (j?.awb) {
        // auto-generate label (optional): call label endpoint
        // We'll not auto-download but show actions
      }
    } catch (err: any) {
      setResult({ error: err?.message ?? "Create failed" });
    } finally {
      setLoading(false);
    }
  }

  async function generateLabel() {
    if (!result?.awb) return;
    try {
      const r = await fetch("/api/admin/delhivery/label", {
        method: "POST",
        body: JSON.stringify({ awb: result.awb }),
      });
      const j = await r.json();
      if (j.base64 || j.pdf) {
        const base64 = j.base64 ?? j.pdf;
        const link = document.createElement("a");
        link.href = `data:application/pdf;base64,${base64}`;
        link.download = `${result.awb}.pdf`;
        link.click();
      } else {
        alert("Label result: " + JSON.stringify(j));
      }
    } catch (e: any) {
      alert("Label generation failed: " + (e?.message ?? e));
    }
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Create Shipment — Delhivery</h1>
        <div className="text-sm text-gray-600">Enterprise form • validation • previews</div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* left: form */}
        <div className="col-span-2 p-6 bg-white border rounded-xl shadow-sm space-y-4">
          <h2 className="font-semibold">Order & Recipient</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-sm">Recipient Name</label>
              <Input value={payload.order.name} onChange={(e: any) => updateOrder("name", e.target.value)} />
              {errors.name && <div className="text-xs text-red-500">{errors.name}</div>}
            </div>

            <div>
              <label className="text-sm">Phone</label>
              <Input value={payload.order.phone} onChange={(e: any) => updateOrder("phone", e.target.value)} />
              {errors.phone && <div className="text-xs text-red-500">{errors.phone}</div>}
            </div>

            <div className="md:col-span-2">
              <label className="text-sm">Address</label>
              <Textarea rows={3} value={payload.order.address} onChange={(e: any) => updateOrder("address", e.target.value)} />
              {errors.address && <div className="text-xs text-red-500">{errors.address}</div>}
            </div>

            <div>
              <label className="text-sm">Pincode</label>
              <div className="flex gap-2">
                <Input value={payload.order.pincode} onChange={(e: any) => updateOrder("pincode", e.target.value)} />
                <button onClick={checkPincode} className="px-3 rounded-lg bg-slate-800 text-white">Check</button>
              </div>
              {errors.pincode && <div className="text-xs text-red-500">{errors.pincode}</div>}
              {pincodeCheck && (
                <div className="mt-2 text-sm text-gray-700">
                  {pincodeCheck.error ? <span className="text-red-500">Not serviceable</span> :
                    <span>Serviceable — <strong>{pincodeCheck?.serviceability ?? "Yes"}</strong></span>}
                </div>
              )}
            </div>

            <div>
              <label className="text-sm">Pickup Location (warehouse)</label>
              <Input value={payload.pickup_location ?? ""} onChange={(e: any) => setPayload(p => ({ ...p, pickup_location: e.target.value }))} />
            </div>
          </div>

          <hr />

          <h2 className="font-semibold">Items</h2>
          <div className="space-y-3">
            {payload.items.map((it, idx) => (
              <div key={idx} className="grid grid-cols-1 md:grid-cols-6 gap-2 items-end">
                <div className="md:col-span-3">
                  <label className="text-sm">Item name</label>
                  <Input value={it.name} onChange={(e: any) => updateItem(idx, "name", e.target.value)} />
                  {errors[`item_name_${idx}`] && <div className="text-xs text-red-500">{errors[`item_name_${idx}`]}</div>}
                </div>
                <div>
                  <label className="text-sm">Qty</label>
                  <Input type="number" value={it.qty} onChange={(e: any) => updateItem(idx, "qty", Number(e.target.value))} />
                  {errors[`item_qty_${idx}`] && <div className="text-xs text-red-500">{errors[`item_qty_${idx}`]}</div>}
                </div>
                <div>
                  <label className="text-sm">Weight (kg)</label>
                  <Input type="number" step="0.01" value={it.weight ?? ""} onChange={(e: any) => updateItem(idx, "weight", Number(e.target.value))} />
                </div>
                <div>
                  <label className="text-sm">Price</label>
                  <Input type="number" step="0.01" value={it.price ?? ""} onChange={(e: any) => updateItem(idx, "price", Number(e.target.value))} />
                </div>
                <div className="flex gap-2">
                  <button type="button" onClick={() => removeItem(idx)} className="px-3 py-2 bg-red-500 text-white rounded">Remove</button>
                </div>
              </div>
            ))}

            <div>
              <button type="button" onClick={addItem} className="px-3 py-2 bg-slate-800 text-white rounded">Add Item</button>
            </div>
          </div>

          <hr />

          <h2 className="font-semibold">Shipment Options</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="text-sm">Service Type</label>
              <select value={payload.service_type} onChange={(e) => setPayload(p => ({ ...p, service_type: e.target.value }))} className="w-full p-2 border rounded">
                <option value="standard">Standard</option>
                <option value="express">Express</option>
                <option value="cod">COD</option>
              </select>
            </div>

            <div>
              <label className="text-sm">COD Amount</label>
              <Input type="number" value={payload.cod_amount ?? 0} onChange={(e: any) => setPayload(p => ({ ...p, cod_amount: Number(e.target.value) }))} />
            </div>

            <div>
              <label className="text-sm">Package Dimensions (L×B×H cm)</label>
              <div className="flex gap-2">
                <Input type="number" placeholder="L" value={payload.dimensions?.length ?? ""} onChange={(e:any)=> setPayload(p=>({ ...p, dimensions: { ...(p.dimensions||{}), length: Number(e.target.value) } }))} />
                <Input type="number" placeholder="B" value={payload.dimensions?.breadth ?? ""} onChange={(e:any)=> setPayload(p=>({ ...p, dimensions: { ...(p.dimensions||{}), breadth: Number(e.target.value) } }))} />
                <Input type="number" placeholder="H" value={payload.dimensions?.height ?? ""} onChange={(e:any)=> setPayload(p=>({ ...p, dimensions: { ...(p.dimensions||{}), height: Number(e.target.value) } }))} />
              </div>
            </div>
          </div>

          <div className="flex gap-3 mt-4">
            <button onClick={submit} disabled={loading} className="px-4 py-2 bg-slate-900 text-white rounded">
              {loading ? "Creating…" : "Create Shipment"}
            </button>

            <button onClick={() => { setPayload({ pickup_location: "", service_type: "standard", cod_amount: 0, order: { name: "", phone: "", address: "", pincode: "" }, items: [{ name: "", qty: 1 }], dimensions: {} }); setErrors({}); }} className="px-4 py-2 border rounded">
              Reset
            </button>
          </div>

        </div>

        {/* right: preview / result */}
        <div className="p-6 bg-white border rounded-xl shadow-sm space-y-4">
          <h3 className="font-semibold">Payload Preview</h3>
          <pre className="bg-gray-50 p-3 rounded text-sm max-h-[360px] overflow-auto">{JSON.stringify(payload, null, 2)}</pre>

          <h3 className="font-semibold">Serviceability</h3>
          {pincodeCheck ? <pre className="bg-gray-50 p-3 rounded text-sm">{JSON.stringify(pincodeCheck, null, 2)}</pre> : <div className="text-sm text-gray-500">No check run</div>}

          <h3 className="font-semibold">Result</h3>
          {result ? (
            <div>
              <pre className="bg-gray-50 p-3 rounded text-sm">{JSON.stringify(result, null, 2)}</pre>
              {result.awb && (
                <div className="flex gap-2 mt-3">
                  <button onClick={generateLabel} className="px-3 py-2 bg-indigo-700 text-white rounded">Generate Label</button>
                  <a className="px-3 py-2 border rounded" href={`/admin/providerConsignments/delhivery?awb=${result.awb}`}>Open Consignment</a>
                </div>
              )}
            </div>
          ) : <div className="text-sm text-gray-500">No result yet</div>}
        </div>
      </div>
    </div>
  );
}