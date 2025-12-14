"use client";

import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";

export function MarutiShipmentActions({
  awb,
  cAwb,
}: {
  awb: string;
  cAwb?: string;
}) {
  async function downloadLabel() {
    window.open(`/api/admin/maruti/label?awb=${awb}&cAwb=${cAwb}`, "_blank");
  }

  async function cancelShipment() {
    const res = await fetch("/api/admin/maruti/cancel", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ awbNumber: awb }),
    });
    const j = await res.json();
    j.success ? toast.success("Cancelled") : toast.error(j.error);
  }

  return (
    <div className="flex gap-2">
      <Button size="sm" variant="outline" onClick={downloadLabel}>
        Label
      </Button>

      <Button size="sm" variant="destructive" onClick={cancelShipment}>
        Cancel
      </Button>
    </div>
  );
}