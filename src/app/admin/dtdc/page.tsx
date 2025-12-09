"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function DtdcDashboard() {
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    fetch("/api/dashboard/stats?provider=dtdc")
      .then((r) => r.json())
      .then((data) => setStats(data));
  }, []);

  if (!stats) return <div className="p-8">Loading…</div>;

  return (
    <div className="p-8 space-y-6">
      <h1 className="text-2xl font-semibold">DTDC Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">

        {/* Total */}
        <Link href={`/admin/providerTrack/dtdc?status=all`}>
          <div className="cursor-pointer border rounded-xl p-6 shadow-md bg-white hover:shadow-lg hover:-translate-y-1 transition">
            <div className="flex justify-between">
              <span className="text-lg font-semibold flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-blue-500"></span>
                Total Shipments
              </span>
              <span className="text-xl font-bold">{stats.total}</span>
            </div>
          </div>
        </Link>

        {/* Delivered */}
        <Link href={`/admin/providerTrack/dtdc?status=delivered`}>
          <div className="cursor-pointer border rounded-xl p-6 shadow-md bg-white hover:shadow-lg hover:-translate-y-1 transition">
            <div className="flex justify-between">
              <span className="text-lg font-semibold flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-green-500"></span>
                Delivered
              </span>
              <span className="text-xl font-bold">{stats.delivered}</span>
            </div>
          </div>
        </Link>

        {/* Pending */}
        <Link href={`/admin/providerTrack/dtdc?status=pending`}>
          <div className="cursor-pointer border rounded-xl p-6 shadow-md bg-white hover:shadow-lg hover:-translate-y-1 transition">
            <div className="flex justify-between">
              <span className="text-lg font-semibold flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-yellow-500"></span>
                Pending
              </span>
              <span className="text-xl font-bold">{stats.pending}</span>
            </div>
          </div>
        </Link>

        {/* RTO */}
        <Link href={`/admin/providerTrack/dtdc?status=rto`}>
          <div className="cursor-pointer border rounded-xl p-6 shadow-md bg-white hover:shadow-lg hover:-translate-y-1 transition">
            <div className="flex justify-between">
              <span className="text-lg font-semibold flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-red-500"></span>
                RTO
              </span>
              <span className="text-xl font-bold">{stats.rto}</span>
            </div>
          </div>
        </Link>

      </div>
    </div>
  );
}
