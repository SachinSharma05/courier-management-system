"use client";

import { useEffect, useState } from "react";

export default function OrderDetail({ params }: any) {
  const { id } = params;
  const [order, setOrder] = useState<any>(null);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    const res = await fetch(`/api/admin/delhivery/orders/${id}`);
    const j = await res.json();
    if (j.success) setOrder(j.data);
  }

  if (!order) return <div className="p-8">Loading…</div>;

  return (
    <div className="p-8 space-y-6">
      <h1 className="text-xl font-bold">Order Details</h1>

      <div className="p-4 bg-white border rounded-xl space-y-3 shadow-sm">

        <p><b>Order ID:</b> {order.order_id}</p>
        <p><b>AWB:</b> {order.awb}</p>
        <p><b>Status:</b> {order.current_status}</p>
        <p><b>Customer:</b> {order.customer_name}</p>
        <p><b>Address:</b> {order.customer_address}</p>
        <p><b>Pincode:</b> {order.customer_pincode}</p>

        <p><b>Package:</b> {order.length_cm}×{order.breadth_cm}×{order.height_cm} cm — {order.weight_g / 1000} kg</p>

        <p><b>Estimated Cost:</b> ₹{order.estimated_cost}</p>

        <p><b>Created:</b> {new Date(order.created_at).toLocaleString()}</p>

        <a
          href={`/admin/delhivery/track?awb=${order.awb}`}
          className="px-4 py-2 border rounded bg-indigo-600 text-white inline-block"
        >
          Track Shipment
        </a>

        <details className="mt-4">
          <summary className="cursor-pointer font-medium">Raw Tracking Data</summary>
          <pre className="bg-gray-100 p-4 rounded text-sm mt-2">
            {JSON.stringify(order.tracking_response, null, 2)}
          </pre>
        </details>

      </div>
    </div>
  );
}