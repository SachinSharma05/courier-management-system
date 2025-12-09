"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Package, Truck, ClipboardList, MapPin, FileDown, Repeat } from "lucide-react";

/* --------------------
   Subcomponents (declare outside render)
   -------------------- */
function StatCard({
  label,
  value,
  color,
  link,
}: {
  label: string;
  value: any;
  color: string;
  link: string;
}) {
  return (
    <Link href={link}>
      <div
        className="
          cursor-pointer p-6 rounded-xl 
          bg-white shadow-sm border 
          hover:shadow-xl hover:-translate-y-1 
          transition-all duration-200
        "
      >
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className={`h-3 w-3 rounded-full ${color}`}></span>
            <span className="text-lg font-medium">{label}</span>
          </div>
          <span className="text-2xl font-bold">{value}</span>
        </div>
      </div>
    </Link>
  );
}

function ToolCard({
  title,
  desc,
  href,
  icon,
}: {
  title: string;
  desc: string;
  href: string;
  icon: React.ReactNode;
}) {
  return (
    <Link href={href}>
      <div
        className="
          p-6 rounded-xl bg-white border shadow-sm 
          hover:shadow-xl hover:-translate-y-1 
          transition-all duration-200 cursor-pointer
        "
      >
        <div className="flex items-center gap-3 mb-2">
          <div
            className="
              p-2 rounded-lg bg-blue-50 text-blue-700 
              shadow-sm border border-blue-100
            "
          >
            {icon}
          </div>
          <h3 className="text-lg font-semibold">{title}</h3>
        </div>
        <p className="text-sm text-gray-600">{desc}</p>
      </div>
    </Link>
  );
}

/* --------------------
   Page Component
   -------------------- */
export default function DelhiveryDashboard() {
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    fetch("/api/dashboard/stats?provider=delhivery")
      .then((r) => r.json())
      .then((data) => setStats(data));
  }, []);

  if (!stats) return <div className="p-8 text-gray-600">Loading…</div>;

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Delhivery Dashboard</h1>

        <Link
          href="/admin/providers"
          className="
            px-4 py-2 rounded-lg bg-gradient-to-r 
            from-blue-600 to-blue-700 
            text-white shadow-md 
            hover:shadow-lg hover:-translate-y-0.5 
            transition
          "
        >
          Back to Providers
        </Link>
      </div>

      {/* Shipment Stats */}
      <div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            label="Total Shipments"
            value={stats.total}
            color="bg-blue-500"
            link="/admin/providerConsignments/delhivery?status=all"
          />
          <StatCard
            label="Delivered"
            value={stats.delivered}
            color="bg-green-500"
            link="/admin/providerConsignments/delhivery?status=delivered"
          />
          <StatCard
            label="Pending"
            value={stats.pending}
            color="bg-yellow-500"
            link="/admin/providerConsignments/delhivery?status=pending"
          />
          <StatCard
            label="RTO"
            value={stats.rto}
            color="bg-red-500"
            link="/admin/providerConsignments/delhivery?status=rto"
          />
        </div>
      </div>

      {/* Tools */}
      <div>
        <h2 className="text-xl font-semibold mb-3">Delhivery Tools</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <ToolCard
            title="Create Shipment"
            desc="Book a new Delhivery shipment."
            href="/admin/delhivery/create"
            icon={<Package size={20} />}
          />

          <ToolCard
            title="Track Shipment"
            desc="Track any Delhivery consignment using AWB."
            href="/admin/delhivery/track"
            icon={<Truck size={20} />}
          />

          <ToolCard
            title="Request Pickup"
            desc="Schedule pickup from warehouse."
            href="/admin/delhivery/pickup"
            icon={<ClipboardList size={20} />}
          />

          <ToolCard
            title="Fetch Waybill"
            desc="Fetch AWB details for shipments."
            href="/admin/delhivery/waybill"
            icon={<MapPin size={20} />}
          />

          <ToolCard
            title="Download Label"
            desc="Generate & download shipping labels."
            href="/admin/delhivery/label"
            icon={<FileDown size={20} />}
          />

          <ToolCard
            title="Update Shipment"
            desc="Modify shipment details if required."
            href="/admin/delhivery/update"
            icon={<Repeat size={20} />}
          />
        </div>
      </div>
    </div>
  );
}
