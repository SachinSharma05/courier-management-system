"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

export default function OrderDetail() {
  const params = useParams();
  const awb = params.awb as string;

  const [order, setOrder] = useState<any>(null);

  async function load() {
    const res = await fetch(`/api/admin/delhivery/orders/${awb}`);
    const j = await res.json();
    if (j.success) setOrder(j.data);
  }

  useEffect(() => {
    if (!awb) return;
    load();
  }, [awb]);

  if (!order) return <div className="p-8">Loading…</div>;

  const timeline = order.timeline || [];
  const provider = order.provider || null;

  return (
    <div className="p-8 space-y-8">

      <h1 className="text-2xl font-bold">
        Delhivery Shipment — {order.awb}
      </h1>

      {/* ===== SUMMARY ===== */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        <Card title="Summary">
          <Row label="AWB" value={order.awb} />
          <Row label="Status" value={order.current_status || "Pending"} />
          <Row label="Booked On" value={fmt(order.created_at)} />
          <Row label="Last Update" value={fmt(order.last_status_at)} />
        </Card>

        <Card title="Delivery Details">
          <Row label="Customer" value={order.customer_name} />
          <Row label="Address" value={order.customer_address} />
          <Row label="Pincode" value={order.customer_pincode} />
          <Row label="Origin" value={order.origin} />
          <Row label="Destination" value={order.destination} />
        </Card>

        <Card title="Package Details">
          <Row
            label="Dimensions"
            value={`${order.length_cm} × ${order.breadth_cm} × ${order.height_cm} cm`}
          />
          <Row
            label="Weight"
            value={order.weight_g ? `${(order.weight_g / 1000).toFixed(2)} kg` : "--"}
          />
          <Row label="Estimated Cost" value={order.estimated_cost ?? "--"} />
        </Card>

      </div>

      {/* ===== CURRENT STATUS ===== */}
      <Card title="Current Status">
        <Row label="Status" value={order.current_status} />
        <Row label="Location" value={order.destination || "--"} />
        <Row label="Updated" value={fmt(order.last_status_at)} />
      </Card>

      {/* ===== TIMELINE ===== */}
      <Card title="Tracking Timeline">
        {timeline.length ? (
          <div className="space-y-4 max-h-[350px] overflow-y-auto">
            {timeline.map((t: any, i: number) => (
              <div key={i} className="border-b pb-3">
                <div className="text-xs text-gray-500">
                  {fmt(t.event_time)}
                </div>
                <div className="font-medium">{t.status}</div>
                <div className="text-sm text-gray-500">{t.location}</div>
                {t.remarks && (
                  <div className="text-xs text-gray-400">{t.remarks}</div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">No tracking events</p>
        )}
      </Card>

      {/* ===== RAW PROVIDER RESPONSE (optional) ===== */}
      {provider?.raw_response && (
        <details className="bg-white border rounded-xl p-4">
          <summary className="cursor-pointer font-medium text-sm">
            Raw Delhivery Response
          </summary>
          <pre className="bg-gray-100 p-4 mt-3 rounded text-xs overflow-auto">
            {JSON.stringify(provider.raw_response, null, 2)}
          </pre>
        </details>
      )}

    </div>
  );
}

/* ---------- helpers ---------- */

function Row({ label, value }: any) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-gray-500">{label}</span>
      <span className="font-medium">{value ?? "--"}</span>
    </div>
  );
}

function Card({ title, children }: any) {
  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border space-y-2">
      <h2 className="font-semibold text-lg mb-2">{title}</h2>
      {children}
    </div>
  );
}

function fmt(v: any) {
  if (!v) return "--";
  return new Date(v).toLocaleString();
}
