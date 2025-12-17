"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import {
  Package,
  Truck,
  ClipboardList,
  MapPin,
  FileDown,
  Repeat,
  Upload,
  Boxes,
  FileSearch,
  ClipboardCheck,
  Send,
  Coins,
} from "lucide-react";

/* ---------- Reusable Components ---------- */
function ToolCard({ title, desc, href, icon }: any) {
  return (
    <Link href={href}>
      <div
        className="
          p-5 rounded-xl bg-white border shadow-sm 
          hover:shadow-lg hover:-translate-y-1 
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
          <h3 className="text-base font-semibold">{title}</h3>
        </div>

        <p className="text-sm text-gray-600 leading-tight">{desc}</p>
      </div>
    </Link>
  );
}

/* ---------- Main Component ---------- */

export default function DelhiveryDashboard() {
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    fetch("/api/admin/delhivery/dashboard/stats")
      .then((r) => r.json())
      .then((data) => setStats(data));
  }, []);

  if (!stats) return <div className="p-8 text-gray-600">Loading…</div>;

  return (
    <div className="p-6 space-y-6 bg-slate-50 min-h-screen">
      {/* Header */}
      <h1 className="text-2xl font-bold">Delhivery Dashboard</h1>
      <p className="text-sm text-muted-foreground">
        Overview and quick actions for Delhivery shipments
      </p>

      {/* SUMMARY */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          ["Total Shipments", stats.total, "all", "blue"],
          ["Delivered", stats.delivered, "delivered", "green"],
          ["Pending", stats.pending, "pending", "yellow"],
          ["RTO", stats.rto, "rto", "red"],
        ].map(([l, v, s, c]: any) => (
          <Link key={l} href={`/admin/providerTrack/dtdc?status=${s}`}>
            <div className="bg-white border rounded-xl p-4 hover:shadow">
              <div className="text-xs text-gray-500">{l}</div>
              <div className={`text-2xl font-bold text-${c}-600`}>{v}</div>
            </div>
          </Link>
        ))}
      </div>

      {/* =============================== */}
      {/* C2C GROUPED TOOLS CARD */}
      {/* =============================== */}

      <div className="bg-white border shadow-sm rounded-xl p-6">
        <h2 className="text-xl font-bold mb-4">C2C — Delhivery Tools</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">

          <ToolCard
            title="All Shipments"
            desc="View, search & filter all C2C shipments."
            href="/admin/delhivery/orders"
            icon={<Boxes size={20} />}
          />

          <ToolCard
            title="Create Shipment"
            desc="Book new surface or express shipments."
            href="/admin/delhivery/create-shipment"
            icon={<Package size={20} />}
          />

          <ToolCard
            title="Track Orders"
            desc="Track single or bulk shipments with AWB."
            href="/admin/delhivery/track"
            icon={<Truck size={20} />}
          />

          <ToolCard
            title="Calculate Cost"
            desc="Calculate shipping costs & transit times."
            href="/admin/delhivery/cost"
            icon={<Coins size={20} />}
          />

          <ToolCard
            title="Generate Labels"
            desc="Generate & download shipping labels."
            href="/admin/delhivery/label"
            icon={<FileDown size={20} />}
          />

          <ToolCard
            title="Pincode / TAT"
            desc="Search pincode / tat serviceability details."
            href="/admin/delhivery/pincode"
            icon={<MapPin size={20} />}
          />

          <ToolCard
            title="Update Shipment"
            desc="Update your booking or shipment details."
            href="/admin/delhivery/update"
            icon={<Upload size={20} />}
          />

          <ToolCard
            title="NDR Details"
            desc="Get NDR information for shipments."
            href="/admin/delhivery/ndr"
            icon={<Repeat size={20} />}
          />
        </div>
      </div>

      {/* =============================== */}
      {/* B2B GROUPED TOOLS CARD */}
      {/* =============================== */}

      <div className="bg-white border shadow-sm rounded-xl p-6">
        <h2 className="text-xl font-bold mb-4">B2B — Delhivery Tools</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">

          <ToolCard
            title="Create Manifest"
            desc="Book LR & manifest shipments in B2B mode."
            href="/admin/delhivery/b2b/create-manifest"
            icon={<ClipboardList size={20} />}
          />

          <ToolCard
            title="Track LR"
            desc="Track LR-based B2B shipments."
            href="/admin/delhivery/b2b/track"
            icon={<FileSearch size={20} />}
          />

          <ToolCard
            title="Update Shipment"
            desc="Modify LR / shipment details."
            href="/admin/delhivery/b2b/update"
            icon={<Repeat size={20} />}
          />

          <ToolCard
            title="Request Pickup (PUR)"
            desc="Schedule a B2B pickup request."
            href="/admin/delhivery/b2b/pickup"
            icon={<Send size={20} />}
          />

          <ToolCard
            title="Appointment Booking"
            desc="Book unloading appointments for warehouses."
            href="/admin/delhivery/b2b/appointment"
            icon={<ClipboardCheck size={20} />}
          />

          <ToolCard
            title="Documents"
            desc="Download invoices, POD, and LR documents."
            href="/admin/delhivery/b2b/document"
            icon={<FileDown size={20} />}
          />
        </div>
      </div>
    </div>
  );
}
