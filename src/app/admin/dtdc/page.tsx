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
          ["RTO", stats.rto, "rto", "red"],
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
        <Link href="/admin/dtdc/create"><Button>Create Shipment</Button></Link>
        <Link href="/admin/dtdc/bulk-upload"><Button variant="secondary">Bulk Upload</Button></Link>
        <Link href="/admin/dtdc/track"><Button variant="outline">Track</Button></Link>
        <Link href="/admin/dtdc/bulk-track"><Button variant="outline">Bulk Track</Button></Link>
        <Link href="/admin/dtdc/labels"><Button variant="outline">Print Label</Button></Link>
        <Link href="/admin/dtdc/cancel"><Button variant="destructive">Cancel</Button></Link>
      </div>

      {/* CONTROLS */}
      <div className="flex flex-wrap gap-3 items-center bg-white border rounded-xl p-4">
        <input
          placeholder="Search CPDP…"
          className="border rounded px-3 py-2 text-sm w-60"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />

        <select
          className="border rounded px-3 py-2 text-sm"
          value={sortKey}
          onChange={(e) => setSortKey(e.target.value as any)}
        >
          {SORT_OPTIONS.map((s) => (
            <option key={s.key} value={s.key}>
              Sort by {s.label}
            </option>
          ))}
        </select>

        <Button variant="outline" onClick={exportCSV}>
          Export CSV
        </Button>
      </div>

      {/* CPDP LIST */}
      <div className="space-y-3">
        {cpdpList.map((c) => (
          <details key={c.client_id} className="bg-white border rounded-xl">
            <summary className="cursor-pointer px-5 py-4 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    toggleFav(c.client_id);
                  }}
                  className="text-lg"
                >
                  {favorites.includes(c.client_id) ? "⭐" : "☆"}
                </button>
                <span className="font-semibold">{c.company_name}</span>
              </div>

              <div className="flex gap-4 text-sm">
                <span className="text-blue-600">{c.total}</span>
                <span className="text-green-600">{c.delivered}</span>
                <span className="text-yellow-600">{c.pending}</span>
                <span className="text-red-600">{c.rto}</span>
              </div>
            </summary>

            <div className="border-t p-4 grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
              <Link href={`/admin/dtdc/clients/${c.client_id}/track?status=all`}>
                <Tile label="Total" value={c.total} color="blue" />
              </Link>
              <Link href={`/admin/dtdc/clients/${c.client_id}/track?status=delivered`}>
                <Tile label="Delivered" value={c.delivered} color="green" />
              </Link>
              <Link href={`/admin/dtdc/clients/${c.client_id}/track?status=pending`}>
                <Tile label="Pending" value={c.pending} color="yellow" />
              </Link>
              <Link href={`/admin/dtdc/clients/${c.client_id}/track?status=rto`}>
                <Tile label="RTO" value={c.rto} color="red" />
              </Link>
            </div>
          </details>
        ))}
      </div>
    </div>
  );
}

/* -------------------------
   Small helper
------------------------- */
function Tile({ label, value, color }: any) {
  return (
    <div className={`rounded-lg p-3 bg-${color}-50 hover:bg-${color}-100`}>
      <div className="text-xs text-gray-500">{label}</div>
      <div className={`font-bold text-${color}-700`}>{value}</div>
    </div>
  );
}
