"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function AramexDashboard() {
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    fetch("/api/dashboard/stats?provider=aramex")
      .then((r) => r.json())
      .then((data) => setStats(data));
  }, []);

  if (!stats) return <div className="p-8">Loading…</div>;

  // reusable card
  const StatCard = ({
    label,
    value,
    color,
    filter,
  }: {
    label: string;
    value: number;
    color: string;
    filter: string;
  }) => (
    <Link href={`/admin/dtdc/clients/track?status=${filter}`}>
      <div
        className="cursor-pointer border rounded-xl p-6 shadow-md bg-white hover:shadow-lg hover:-translate-y-1 transition-all"
      >
        <div className="flex justify-between items-center">
          <span className="text-lg font-semibold flex items-center gap-2">
            <span className={`h-3 w-3 rounded-full ${color}`}></span>
            {label}
          </span>
          <span className="text-xl font-bold">{value}</span>
        </div>
      </div>
    </Link>
  );

  return (
    <div className="p-8 space-y-6">
      <h1 className="text-2xl font-semibold">Aramex Dashboard</h1>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">

        {/* Total */}
        <StatCard
          label="Total Shipments"
          value={stats.total}
          color="bg-blue-500"
          filter="all"
        />

        {/* Delivered */}
        <StatCard
          label="Delivered"
          value={stats.delivered}
          color="bg-green-500"
          filter="delivered"
        />

        {/* Pending */}
        <StatCard
          label="Pending"
          value={stats.pending}
          color="bg-yellow-500"
          filter="pending"
        />

        {/* RTO */}
        <StatCard
          label="RTO"
          value={stats.rto}
          color="bg-red-500"
          filter="rto"
        />

      </div>
    </div>
  );
}
