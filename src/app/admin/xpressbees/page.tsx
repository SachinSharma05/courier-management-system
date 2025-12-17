"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function XpressBeesDashboard() {
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    fetch("/api/admin/xpressbees/dashboard/stats?provider=xpressbees")
      .then((r) => r.json())
      .then((data) => setStats(data));
  }, []);

  if (!stats) return <div className="p-8">Loading…</div>;

  return (
    <div className="p-6 space-y-6 bg-slate-50 min-h-screen">
      <h1 className="text-2xl font-semibold">XpressBees Dashboard</h1>
      <p className="text-sm text-muted-foreground">
        Overview and quick actions for XpressBees shipments
      </p>

      {/* SUMMARY */}
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
    </div>
  );
}
