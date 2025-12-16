"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";

export default function BookPage() {
  const { id } = useParams(); // clientId from URL
  const clientId = Number(id);

  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    name: "",
    address: "",
    phone: "",
    pincode: "",
    weight: "",
    reference: ""
  });

  function update(key: string, val: string) {
    setForm((f) => ({ ...f, [key]: val }));
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
            reference: form.reference || ""
          }
        })
      });

      const json = await res.json();

      if (!res.ok || json.error) {
        toast.error(json.error || "Booking failed");
      } else {
        toast.success(`AWB Created: ${json.awb}`);
      }
    } catch (err) {
      toast.error("Network error");
    }
    setLoading(false);
  }

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-semibold">DTDC — Single Booking</h1>

      <Card className="p-6 space-y-4">

        <Input placeholder="Consignee Name" value={form.name}
               onChange={(e) => update("name", e.target.value)} />

        <Input placeholder="Address" value={form.address}
               onChange={(e) => update("address", e.target.value)} />

        <Input placeholder="Phone" value={form.phone}
               onChange={(e) => update("phone", e.target.value)} />

        <Input placeholder="Pincode" value={form.pincode}
               onChange={(e) => update("pincode", e.target.value)} />

        <Input placeholder="Weight (kg)" value={form.weight}
               onChange={(e) => update("weight", e.target.value)} />

        <Input placeholder="Reference No (optional)" value={form.reference}
               onChange={(e) => update("reference", e.target.value)} />

        <Button disabled={loading} onClick={submit} className="w-full bg-blue-600 text-white">
          {loading ? "Booking..." : "Create Booking"}
        </Button>

      </Card>
    </div>
  );
}
