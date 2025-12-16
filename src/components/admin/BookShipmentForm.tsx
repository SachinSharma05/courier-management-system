"use client";

import toast from "react-hot-toast";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { useState } from "react";

type Props = {
  clientId: number;
};

export default function BookShipmentForm({ clientId }: Props) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    address: "",
    phone: "",
    pincode: "",
    weight: "",
    reference: "",
  });

  function update(k: string, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function submit() {
    if (!form.name || !form.address || !form.phone || !form.pincode || !form.weight) {
      toast.error("Please fill all required fields");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/admin/dtdc/book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId,
          payload: {
            consignee_name: form.name,
            consignee_address: form.address,
            consignee_phone: form.phone,
            pincode: form.pincode,
            weight: form.weight,
            reference: form.reference || "",
          },
        }),
      });

      const json = await res.json();
      if (!res.ok || json.error) toast.error(json.error || "Booking failed");
      else toast.success(`AWB Created: ${json.awb}`);
    } catch {
      toast.error("Network error");
    }
    setLoading(false);
  }

  return (
    <div className="space-y-4">
      <Input placeholder="Consignee Name" value={form.name} onChange={(e) => update("name", e.target.value)} />
      <Input placeholder="Address" value={form.address} onChange={(e) => update("address", e.target.value)} />
      <Input placeholder="Phone" value={form.phone} onChange={(e) => update("phone", e.target.value)} />
      <Input placeholder="Pincode" value={form.pincode} onChange={(e) => update("pincode", e.target.value)} />
      <Input placeholder="Weight (kg)" value={form.weight} onChange={(e) => update("weight", e.target.value)} />
      <Input placeholder="Reference (optional)" value={form.reference} onChange={(e) => update("reference", e.target.value)} />

      <Button disabled={loading} onClick={submit} className="w-full">
        {loading ? "Booking..." : "Create Booking"}
      </Button>
    </div>
  );
}