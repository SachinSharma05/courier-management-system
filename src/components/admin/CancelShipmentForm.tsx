"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";

type Props = {
  clientId: number;
};

export default function CancelShipmentForm({ clientId }: Props) {
  const [awb, setAwb] = useState("");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit() {
    if (!awb.trim()) {
      toast.error("Please enter AWB number");
      return;
    }
    if (!reason.trim()) {
      toast.error("Please enter cancellation reason");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/admin/dtdc/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId, awb, reason }),
      });

      const json = await res.json();

      if (!res.ok || json.error) {
        toast.error(json.error || "Cancellation failed");
      } else {
        toast.success(`AWB ${awb} cancelled successfully`);
      }
    } catch (err) {
      toast.error("Network error");
    }
    setLoading(false);
  }

  return (
    <div className="max-w-lg mx-auto p-6 space-y-6">
      <Card className="p-6 space-y-4">
        <Input
          placeholder="Enter AWB Number"
          value={awb}
          onChange={(e) => setAwb(e.target.value)}
        />

        <Input
          placeholder="Reason for Cancellation"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />

        <Button
          className="w-full bg-red-600 text-white hover:bg-red-700"
          disabled={loading}
          onClick={submit}
        >
          {loading ? "Cancelling..." : "Cancel AWB"}
        </Button>
      </Card>
    </div>
  );
}