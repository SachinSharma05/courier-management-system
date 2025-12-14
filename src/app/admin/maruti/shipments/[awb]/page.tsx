"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { MarutiShipmentActions } from "@/components/admin/maruti/MarutiShipmentActions";

export default function MarutiShipmentDetail() {
  const params = useParams();
  const awb = params.awb as string;

  const [order, setOrder] = useState<any>(null);

  async function load() {
    const res = await fetch(`/api/admin/maruti/shipments/${awb}`);
    const j = await res.json();
    if (j.success) setOrder(j.data);
  }

  useEffect(() => {
    if (awb) load();
  }, [awb]);

  if (!order) return <div className="p-8">Loading…</div>;

  const shipment = order.provider;
  const timeline = order.timeline ?? [];

  return (
    <div className="p-8 space-y-8">
      <h1 className="text-2xl font-bold">
        Maruti Shipment — <span className="text-indigo-600">{order.awb}</span>
      </h1>

      {/* SUMMARY */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        <Card title="Summary">
          <Row label="AWB" value={order.awb} />
          <Row label="Reference" value={order.reference_number} />
          <Row label="Status" value={order.current_status} />
          <Row label="Booked On" value={fmt(order.booked_at)} />
          <Row label="Last Update" value={fmt(order.last_status_at)} />

          <div className="mt-4">
            <MarutiShipmentActions
              awb={order.awb}
              cAwb={shipment?.provider_order_id}
            />
          </div>
        </Card>

        <Card title="Route">
          <Row label="Origin" value={order.origin} />
          <Row label="Destination" value={order.destination} />
          <Row label="Pincode" value={order.destination_pincode} />
        </Card>

        <Card title="Package">
          <Row
            label="Weight"
            value={
              order.weight_g
                ? `${(order.weight_g / 1000).toFixed(2)} kg`
                : "-"
            }
          />
          <Row label="COD Amount" value={order.cod_amount ?? "-"} />
        </Card>
      </div>

      {/* CURRENT STATUS (RAW) */}
      {shipment?.raw_response && (
        <div className="bg-white border rounded-xl p-6">
          <h2 className="font-semibold text-lg mb-2">Provider Status</h2>
          <pre className="text-xs bg-gray-100 p-3 rounded overflow-auto">
            {JSON.stringify(shipment.raw_response, null, 2)}
          </pre>
        </div>
      )}

      {/* TIMELINE */}
      <div className="bg-white border rounded-xl p-6">
        <h2 className="font-semibold text-lg mb-4">Tracking Timeline</h2>

        {timeline.length ? (
          <div className="space-y-4">
            {timeline.map((t: any, i: number) => (
              <div key={i} className="border-b pb-3">
                <div className="text-xs text-gray-500">
                  {fmt(t.event_time)}
                </div>
                <div className="font-medium">{t.status}</div>
                <div className="text-sm text-gray-600">{t.location}</div>
                {t.remarks && (
                  <div className="text-xs text-gray-400">{t.remarks}</div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">No tracking events available</p>
        )}
      </div>
    </div>
  );
}

/* ---------- helpers ---------- */

function Card({ title, children }: any) {
  return (
    <div className="bg-white border rounded-xl p-6 shadow-sm space-y-2">
      <h2 className="font-semibold text-lg mb-2">{title}</h2>
      {children}
    </div>
  );
}

function Row({ label, value }: any) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-gray-500">{label}</span>
      <span className="font-medium">{value ?? "-"}</span>
    </div>
  );
}

function fmt(v: any) {
  if (!v) return "-";
  try {
    return new Date(v).toLocaleString();
  } catch {
    return String(v);
  }
}