"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Truck,
  Search,
  PlusSquare,
  FileText,
  Boxes,
} from "lucide-react";

export default function MarutiDashboard() {
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    fetch("/api/admin/maruti/dashboard/stats?provider=maruti")
      .then((r) => r.json())
      .then((data) => setStats(data));
  }, []);

  if (!stats) return <div className="p-8">Loading…</div>;

  return (
    <div className="p-6 space-y-6 bg-slate-50 min-h-screen">

      {/* ---------- HEADER ---------- */}
      <h1 className="text-2xl font-semibold">Maruti Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Overview and quick actions for Maruti shipments
        </p>

      {/* ---------- STATS ---------- */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          ["Total Shipments", stats.total, "all", "blue"],
          ["Delivered", stats.delivered, "delivered", "green"],
          ["Pending", stats.pending, "pending", "yellow"],
          ["RTO", stats.rto, "rto", "red"],
        ].map(([l, v, s, c]: any) => (
          <Link key={l} href="">
            <div className="bg-white border rounded-xl p-4 hover:shadow">
              <div className="text-xs text-gray-500">{l}</div>
              <div className={`text-2xl font-bold text-${c}-600`}>{v}</div>
            </div>
          </Link>
        ))}
      </div>

      {/* ---------- QUICK ACTIONS ---------- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">

        {/* All Shipments */}
        <ActionCard
          href="/admin/providerTrack/maruti"
          icon={<Boxes size={20} />}
          title="All Shipments"
          desc="View, filter & search Maruti consignments"
        />

        {/* Track Shipment */}
        <ActionCard
          href="/admin/maruti/track"
          icon={<Search />}
          title="Track Shipment"
          desc="Track Maruti shipment by AWB"
        />

        {/* Create Shipment */}
        <ActionCard
          href="/admin/maruti/create"
          icon={<PlusSquare />}
          title="Create Shipment"
          desc="Create a new Maruti shipment"
        />

        {/* Manifest / Label */}
        <ActionCard
          href="/admin/maruti/manifest"
          icon={<FileText />}
          title="Manifest / Label"
          desc="Generate manifest or download labels"
        />

      </div>
    </div>
  );
}

/* ----------------- Small Components ----------------- */
function ActionCard({
  href,
  icon,
  title,
  desc,
}: any) {
  return (
    <Link href={href}>
      <div className="cursor-pointer border rounded-xl p-6 bg-white shadow-sm hover:shadow-lg hover:-translate-y-1 transition">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-lg bg-muted text-primary">
            {icon}
          </div>
          <div>
            <div className="font-semibold">{title}</div>
            <div className="text-sm text-muted-foreground">{desc}</div>
          </div>
        </div>
      </div>
    </Link>
  );
}