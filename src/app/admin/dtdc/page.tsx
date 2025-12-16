"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

type CPDP = {
  client_id: number;
  company_name: string;
  total: number;
  delivered: number;
  pending: number;
  rto: number;
};

const SORT_OPTIONS = [
  { key: "total", label: "Total" },
  { key: "delivered", label: "Delivered" },
  { key: "pending", label: "Pending" },
  { key: "rto", label: "RTO" },
];

export default function DtdcDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState<keyof CPDP>("total");
  
  const [favorites, setFavorites] = useState<number[]>(() => {
  if (typeof window === "undefined") return [];
    try {
      const saved = localStorage.getItem("dtdc_favorites");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  /* -------------------------
     Load dashboard stats
  ------------------------- */
  useEffect(() => {
    fetch("/api/admin/dtdc/dashboard/stats?provider=dtdc")
      .then((r) => r.json())
      .then((data) => setStats(data));
  }, []);

  /* -------------------------
     Filter + Sort CPDPs
  ------------------------- */
  const cpdpList: CPDP[] = useMemo(() => {
    if (!stats?.clients) return [];

    // 1️⃣ search
    const filtered = stats.clients.filter((c: CPDP) =>
      c.company_name.toLowerCase().includes(query.toLowerCase())
    );

    // 2️⃣ sort by key
    const sorted = [...filtered].sort(
      (a, b) => (Number(b[sortKey]) || 0) - (Number(a[sortKey]) || 0)
    );

    // 3️⃣ pin favorites on top
    return sorted.sort((a, b) => {
      const aFav = favorites.includes(a.client_id);
      const bFav = favorites.includes(b.client_id);
      return aFav === bFav ? 0 : aFav ? -1 : 1;
    });
  }, [stats, query, sortKey, favorites]);

  /* -------------------------
     Persist favorites
  ------------------------- */
  useEffect(() => {
    localStorage.setItem("dtdc_favorites", JSON.stringify(favorites));
  }, [favorites]);

  if (!stats) {
    return <div className="p-8">Loading…</div>;
  }

  /* -------------------------
     Export CSV
  ------------------------- */
  function exportCSV() {
    const rows = [
      ["Company", "Total", "Delivered", "Pending", "RTO"],
      ...cpdpList.map((c) => [
        c.company_name,
        c.total,
        c.delivered,
        c.pending,
        c.rto,
      ]),
    ];

    const csv = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "dtdc_cpdp_stats.csv";
    a.click();
  }

  /* -------------------------
     Toggle Favorite
  ------------------------- */
  function toggleFav(id: number) {
    setFavorites((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  return (
    <div className="p-6 space-y-6 bg-slate-50 min-h-screen">

      {/* HEADER */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">DTDC Dashboard</h1>
      </div>

      {/* SUMMARY */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          ["Total Shipments", stats.total, "all", "blue"],
          ["Delivered", stats.delivered, "delivered", "green"],
          ["Pending", stats.pending, "pending", "yellow"],
          ["RTO (Return to office)", stats.rto, "rto", "red"],
        ].map(([label, value, status, color]: any) => (
          <Link key={label} href={`/admin/providerTrack/dtdc?status=${status}`}>
            <div className="bg-white border rounded-xl p-4 hover:shadow">
              <div className="text-xs text-gray-500">{label}</div>
              <div className={`text-2xl font-bold text-${color}-600`}>
                {value}
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* QUICK ACTIONS */}
      <div className="flex flex-wrap gap-3 bg-white border rounded-xl p-4">
        <Link href="/admin/dtdc/book"><Button>Create Shipment</Button></Link>
        <Link href="/admin/dtdc/bulk-book"><Button variant="secondary">Bulk Upload Shipment</Button></Link>
        <Link href="/admin/dtdc/track"><Button variant="outline">Track Shipment</Button></Link>
        <Link href="/admin/upload"><Button variant="outline">Bulk Track Shipment</Button></Link>
        <Link href="/admin/dtdc/label"><Button variant="outline">Print Label</Button></Link>
        <Link href="/admin/dtdc/cancel"><Button variant="destructive">Cancel Shipments</Button></Link>
      </div>      

      {/* CPDP CLIENTS TABLE */}
      <div className="bg-white border rounded-xl overflow-hidden">

        {/* Header */}
        <div className="px-5 py-4 border-b flex items-center justify-between gap-4">
          <h3 className="font-semibold text-lg">DTDC – CPDP Clients</h3>

          <div className="flex gap-3 items-center">
            <input
              placeholder="Search CPDP…"
              className="border rounded-md px-3 py-2 text-sm w-56 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />

            <select
              className="border rounded-md px-3 py-2 text-sm"
              value={sortKey}
              onChange={(e) => setSortKey(e.target.value as any)}
            >
              {SORT_OPTIONS.map((s) => (
                <option key={s.key} value={s.key}>
                  Sort by {s.label}
                </option>
              ))}
            </select>

            <Button variant="outline" size="sm" onClick={exportCSV}>
              Export CSV
            </Button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 sticky top-0 z-10">
              <tr className="text-left text-gray-600">
                <th className="px-4 py-3 w-10"></th>
                <th className="px-4 py-3">Client</th>
                <th className="px-4 py-3 text-center">Total</th>
                <th className="px-4 py-3 text-center">Delivered</th>
                <th className="px-4 py-3 text-center">Pending</th>
                <th className="px-4 py-3 text-center">RTO</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y">
              {cpdpList.map((c) => {
                const isFav = favorites.includes(c.client_id);

                return (
                  <tr
                    key={c.client_id}
                    className={`hover:bg-slate-50 transition ${
                      isFav ? "bg-yellow-50/40" : ""
                    }`}
                  >
                    {/* Favorite */}
                    <td className="px-4 py-3">
                      <button
                        onClick={() => toggleFav(c.client_id)}
                        title="Pin client"
                        className={`text-lg transition ${
                          isFav ? "text-yellow-500" : "text-gray-400 hover:text-gray-600"
                        }`}
                      >
                        {isFav ? "⭐" : "☆"}
                      </button>
                    </td>

                    {/* Client */}
                    <td className="px-4 py-3 font-medium whitespace-nowrap">
                      <Link href={`/admin/dtdc/clients/${c.client_id}/editclient`} className="text-blue-600 hover:underline">
                        {c.company_name}
                      </Link>
                    </td>

                    {/* Metrics */}
                    <td className="px-4 py-3 text-center">
                      <CountBadge value={c.total} color="blue" />
                    </td>

                    <td className="px-4 py-3 text-center">
                      <CountBadge value={c.delivered} color="green" />
                    </td>

                    <td className="px-4 py-3 text-center">
                      <CountBadge value={c.pending} color="yellow" />
                    </td>

                    <td className="px-4 py-3 text-center">
                      <CountBadge value={c.rto} color="red" />
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <Link href={`/admin/dtdc/clients/${c.client_id}/track?status=all`}>
                          <ActionBtn label="All" color="blue" />
                        </Link>
                        <Link href={`/admin/dtdc/clients/${c.client_id}/track?status=delivered`}>
                          <ActionBtn label="Delivered" color="green" />
                        </Link>
                        <Link href={`/admin/dtdc/clients/${c.client_id}/track?status=pending`}>
                          <ActionBtn label="Pending" color="yellow" />
                        </Link>
                        <Link href={`/admin/dtdc/clients/${c.client_id}/track?status=rto`}>
                          <ActionBtn label="RTO" color="red" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {cpdpList.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-10 text-center text-gray-500">
                    No CPDP clients found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* -------------------------
   Small helper
------------------------- */
function CountBadge({
  value,
  color,
}: {
  value: number;
  color: "blue" | "green" | "yellow" | "red";
}) {
  const styles = {
    blue: "bg-blue-100 text-blue-700",
    green: "bg-green-100 text-green-700",
    yellow: "bg-yellow-100 text-yellow-700",
    red: "bg-red-100 text-red-700",
  };

  return (
    <span
      className={`inline-flex items-center justify-center min-w-[44px] px-2 py-1 rounded-full text-xs font-semibold ${styles[color]}`}
    >
      {value}
    </span>
  );
}

function ActionBtn({
  label,
  color,
}: {
  label: string;
  color: "blue" | "green" | "yellow" | "red";
}) {
  const styles = {
    blue: "bg-blue-50 text-blue-700 hover:bg-blue-100",
    green: "bg-green-50 text-green-700 hover:bg-green-100",
    yellow: "bg-yellow-50 text-yellow-700 hover:bg-yellow-100",
    red: "bg-red-50 text-red-700 hover:bg-red-100",
  };

  return (
    <button
      className={`px-3 py-1 rounded-md text-xs font-medium border transition ${styles[color]}`}
    >
      {label}
    </button>
  );
}
