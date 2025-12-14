"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Truck,
  Search,
  PlusSquare,
  FileText,
} from "lucide-react";

export default function MarutiDashboard() {
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    fetch("/api/dashboard/stats?provider=maruti")
      .then((r) => r.json())
      .then((data) => setStats(data));
  }, []);

  if (!stats) return <div className="p-8">Loading…</div>;

  return (
    <div className="p-6 space-y-8">

      {/* ---------- HEADER ---------- */}
      <div>
        <h1 className="text-2xl font-semibold">Maruti Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Overview and quick actions for Maruti shipments
        </p>
      </div>

      {/* ---------- STATS ---------- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">

        <StatCard
          href="/admin/providerTrack/maruti?status=all"
          label="Total Shipments"
          value={stats.total}
          color="bg-blue-500"
        />

        <StatCard
          href="/admin/providerTrack/maruti?status=delivered"
          label="Delivered"
          value={stats.delivered}
          color="bg-green-500"
        />

        <StatCard
          href="/admin/providerTrack/maruti?status=pending"
          label="Pending"
          value={stats.pending}
          color="bg-yellow-500"
        />

        <StatCard
          href="/admin/providerTrack/maruti?status=rto"
          label="RTO"
          value={stats.rto}
          color="bg-red-500"
        />
      </div>

      {/* ---------- QUICK ACTIONS ---------- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">

        {/* All Shipments */}
        <ActionCard
          href="/admin/providerTrack/maruti"
          icon={<Truck />}
          title="All Shipments"
          desc="View and manage all Maruti consignments"
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

function StatCard({
  href,
  label,
  value,
  color,
}: any) {
  return (
    <Link href={href}>
      <div className="cursor-pointer border rounded-xl p-6 shadow-md bg-white hover:shadow-lg hover:-translate-y-1 transition">
        <div className="flex justify-between items-center">
          <span className="text-lg font-semibold flex items-center gap-2">
            <span className={`h-3 w-3 rounded-full ${color}`} />
            {label}
          </span>
          <span className="text-xl font-bold">{value}</span>
        </div>
      </div>
    </Link>
  );
}

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