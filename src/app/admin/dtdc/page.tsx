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

      {/* CLIENT-WISE STATS — Only for DTDC */}
      {stats.clients && stats.clients.length > 0 && (
        <div className="mt-10">
          <h2 className="text-xl font-semibold mb-4">Client Wise Performance</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.clients.map((c: any) => (
              <div
                key={c.id}
                className="border rounded-xl p-5 bg-white shadow hover:shadow-lg hover:-translate-y-1 transition cursor-pointer"
              >
                <h3 className="text-lg font-semibold mb-3">{c.company_name}</h3>

                <div className="space-y-3">
                  <Link href={`/admin/dtdc/clients/${c.client_id}/track?status=all`}>
                    <div className="flex justify-between p-3 rounded-lg bg-blue-50 hover:bg-blue-100">
                      <span className="flex items-center gap-2">
                        <span className="h-2 w-2 bg-blue-600 rounded-full"></span>
                        Total
                      </span>
                      <span className="font-bold">{c.total}</span>
                    </div>
                  </Link>

                  <Link href={`/admin/dtdc/clients/${c.client_id}/track?status=delivered`}>
                    <div className="flex justify-between p-3 rounded-lg bg-green-50 hover:bg-green-100">
                      <span className="flex items-center gap-2">
                        <span className="h-2 w-2 bg-green-600 rounded-full"></span>
                        Delivered
                      </span>
                      <span className="font-bold">{c.delivered}</span>
                    </div>
                  </Link>

                  <Link href={`/admin/dtdc/clients/${c.client_id}/track?status=pending`}>
                    <div className="flex justify-between p-3 rounded-lg bg-yellow-50 hover:bg-yellow-100">
                      <span className="flex items-center gap-2">
                        <span className="h-2 w-2 bg-yellow-600 rounded-full"></span>
                        Pending
                      </span>
                      <span className="font-bold">{c.pending}</span>
                    </div>
                  </Link>

                  <Link href={`/admin/dtdc/clients/${c.client_id}/track?status=rto`}>
                    <div className="flex justify-between p-3 rounded-lg bg-red-50 hover:bg-red-100">
                      <span className="flex items-center gap-2">
                        <span className="h-2 w-2 bg-red-600 rounded-full"></span>
                        RTO
                      </span>
                      <span className="font-bold">{c.rto}</span>
                    </div>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
