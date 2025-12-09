"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function DelhiveryDashboard() {
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    fetch("/api/dashboard/stats?provider=delhivery")
      .then((r) => r.json())
      .then((data) => setStats(data));
  }, []);

  if (!stats) return <div className="p-8">Loading…</div>;

  const card = (label: string, value: any, color: string, link: string) => (
    <Link href={link}>
      <div className="cursor-pointer border rounded-xl p-6 shadow-sm bg-white hover:shadow-lg hover:-translate-y-1 transition-all duration-200">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className={`h-3 w-3 rounded-full ${color}`}></span>
            <span className="text-lg font-medium">{label}</span>
          </div>
          <span className="text-2xl font-semibold">{value}</span>
        </div>
      </div>
    </Link>
  );

  return (
    <div className="p-8 space-y-10">

      {/* Heading */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">
          Delhivery Provider Dashboard
        </h1>

        <Link
          href="/admin/providers"
          className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition"
        >
          Back to Providers
        </Link>
      </div>

      {/* Stats */}
      <div>
        <h2 className="text-xl font-semibold mb-3">Shipment Overview</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {card("Total Shipments", stats.total, "bg-blue-500", "/admin/providerConsignments/delhivery?status=all")}
          {card("Delivered", stats.delivered, "bg-green-500", "/admin/providerConsignments/delhivery?status=delivered")}
          {card("Pending", stats.pending, "bg-yellow-500", "/admin/providerConsignments/delhivery?status=pending")}
          {card("RTO", stats.rto, "bg-red-500", "/admin/providerConsignments/delhivery?status=rto")}
        </div>
      </div>

      {/* Tools Section */}
      <div>
        <h2 className="text-xl font-semibold mb-3">Delhivery Tools</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">

          {/* Create Shipment */}
          <Link href="/admin/delhivery/create">
            <div className="p-6 rounded-xl bg-white border shadow-sm hover:shadow-lg hover:-translate-y-1 transition cursor-pointer">
              <h3 className="text-lg font-semibold mb-1">Create Shipment</h3>
              <p className="text-sm text-gray-600">
                Book a new Delhivery shipment.
              </p>
            </div>
          </Link>

          {/* Track Shipment */}
          <Link href="/admin/delhivery/track">
            <div className="p-6 rounded-xl bg-white border shadow-sm hover:shadow-lg hover:-translate-y-1 transition cursor-pointer">
              <h3 className="text-lg font-semibold mb-1">Track Shipment</h3>
              <p className="text-sm text-gray-600">
                Track any Delhivery consignment using AWB.
              </p>
            </div>
          </Link>

          {/* Request Pickup */}
          <Link href="/admin/delhivery/pickup">
            <div className="p-6 rounded-xl bg-white border shadow-sm hover:shadow-lg hover:-translate-y-1 transition cursor-pointer">
              <h3 className="text-lg font-semibold mb-1">Request Pickup</h3>
              <p className="text-sm text-gray-600">
                Schedule pickup from warehouse.
              </p>
            </div>
          </Link>

          {/* Fetch Waybill */}
          <Link href="/admin/delhivery/waybill">
            <div className="p-6 rounded-xl bg-white border shadow-sm hover:shadow-lg hover:-translate-y-1 transition cursor-pointer">
              <h3 className="text-lg font-semibold mb-1">Fetch Waybill</h3>
              <p className="text-sm text-gray-600">
                Fetch AWB details for shipments.
              </p>
            </div>
          </Link>

          {/* Download Label */}
          <Link href="/admin/delhivery/label">
            <div className="p-6 rounded-xl bg-white border shadow-sm hover:shadow-lg hover:-translate-y-1 transition cursor-pointer">
              <h3 className="text-lg font-semibold mb-1">Download Label</h3>
              <p className="text-sm text-gray-600">
                Generate and download shipping labels.
              </p>
            </div>
          </Link>

          {/* Update Shipment */}
          <Link href="/admin/delhivery/update">
            <div className="p-6 rounded-xl bg-white border shadow-sm hover:shadow-lg hover:-translate-y-1 transition cursor-pointer">
              <h3 className="text-lg font-semibold mb-1">Update Shipment</h3>
              <p className="text-sm text-gray-600">
                Modify shipment details if required.
              </p>
            </div>
          </Link>

        </div>
      </div>
    </div>
  );
}
