"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function OrderDetail() {
  const params = useParams();
  const id = params.id as string;
  
  const [order, setOrder] = useState<any>(null);

  async function load() {
    const res = await fetch(`/api/admin/delhivery/orders/${id}`);
    const j = await res.json();
    if (j.success) setOrder(j.data);
  }

  const shipment =
  order?.tracking_response?.ShipmentData?.[0]?.Shipment || null;

  useEffect(() => {
    if (!id) return;
    load();
  }, [id]);

  if (!order) return <div className="p-8">Loading…</div>;

  return (
  <div className="p-8 space-y-8">
    <h1 className="text-2xl font-bold mb-4">Delhivery – Shipment Details</h1>

    {/* ===== TOP SUMMARY CARD ===== */}
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

      {/* Left: Basic Info */}
      <div className="bg-white p-6 rounded-xl shadow-sm border space-y-3">
        <h2 className="font-semibold text-lg mb-2">Summary</h2>

        <div className="space-y-2 text-sm">
          <p><b>Order ID:</b> {order.order_id}</p>
          <p><b>AWB:</b> {order.awb}</p>
          <p><b>Status:</b> {order.current_status || "Pending"}</p>
          <p><b>Booked On:</b> {new Date(order.created_at).toLocaleString()}</p>

          <p>
            <b>Last Updated:</b>{" "}
            {order.latest_status_time
              ? new Date(order.latest_status_time).toLocaleString()
              : "--"}
          </p>
        </div>

        <a
          href={`/admin/delhivery/track?awb=${order.awb}`}
          className="mt-3 inline-block px-4 py-2 rounded bg-indigo-600 text-white"
        >
          Track Shipment
        </a>
      </div>

      {/* Middle: Delivery Details */}
      <div className="bg-white p-6 rounded-xl shadow-sm border space-y-3">
        <h2 className="font-semibold text-lg mb-2">Delivery Details</h2>

        <div className="text-sm space-y-2">
          <p><b>Customer:</b> {order.customer_name}</p>
          <p><b>Address:</b> {order.customer_address}</p>
          <p><b>Pincode:</b> {order.customer_pincode}</p>

          {shipment?.Consignee && (
            <>
              <p><b>Destination:</b> {shipment.Consignee.City}</p>
              <p><b>State:</b> {shipment.Consignee.State}</p>
            </>
          )}
        </div>
      </div>

      {/* Right: Package Details */}
      <div className="bg-white p-6 rounded-xl shadow-sm border space-y-3">
        <h2 className="font-semibold text-lg mb-2">Package Details</h2>

        <div className="text-sm space-y-2">
          <p>
            <b>Dimensions:</b>{" "}
            {order.length_cm} × {order.breadth_cm} × {order.height_cm} cm
          </p>

          <p><b>Weight:</b> {(order.weight_g / 1000).toFixed(2)} kg</p>

          <p><b>Estimated Cost:</b> ₹{order.estimated_cost || "--"}</p>

          <p>
            <b>Pieces:</b> {shipment?.Quantity || 1}
          </p>
        </div>
      </div>

    </div>

    {/* ===== STATUS CARD ===== */}
    {shipment?.Status && (
      <div className="bg-white p-6 rounded-xl shadow-sm border space-y-2">
        <h2 className="font-semibold text-lg mb-2">Current Status</h2>

        <p className="text-sm">
          <b>Status:</b> {shipment.Status.Status}
        </p>
        <p className="text-sm">
          <b>Location:</b> {shipment.Status.StatusLocation}
        </p>
        <p className="text-sm">
          <b>Updated:</b>{" "}
          {new Date(shipment.Status.StatusDateTime).toLocaleString()}
        </p>
        <p className="text-sm">
          <b>Instructions:</b> {shipment.Status.Instructions}
        </p>
      </div>
    )}

    {/* ===== TIMELINE ===== */}
    <div className="bg-white p-6 rounded-xl shadow-sm border">
      <h2 className="font-semibold text-lg mb-3">Tracking Timeline</h2>

      <div className="max-h-[350px] overflow-y-auto pr-3 space-y-5">
        {shipment?.Scans?.length ? (
          shipment.Scans.map((scan: any, idx: number) => {
            const s = scan.ScanDetail;
            return (
              <div key={idx} className="border-b pb-3">
                <div className="text-xs text-gray-500">
                  {new Date(s.ScanDateTime).toLocaleString()}
                </div>
                <div className="font-semibold mt-1">{s.Scan}</div>
                <div className="text-sm text-gray-600">{s.ScannedLocation}</div>
                {s.Instructions && (
                  <div className="text-xs text-gray-500 mt-1">
                    {s.Instructions}
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <p className="text-gray-500">No scan history available.</p>
        )}
      </div>
    </div>

    {/* ===== RAW RESPONSE (Collapsible) ===== */}
    <details className="bg-white border rounded-xl shadow-sm p-4">
      <summary className="cursor-pointer font-medium text-sm">
        Raw Tracking Data
      </summary>
      <div className="max-h-[400px] overflow-auto mt-3">
        <pre className="bg-gray-100 p-4 rounded text-xs">
          {JSON.stringify(order.tracking_response, null, 2)}
        </pre>
      </div>
    </details>
  </div>
);

}