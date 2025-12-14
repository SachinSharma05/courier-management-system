"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function MarutiAllShipments() {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);

  async function load() {
    setLoading(true);

    const params = new URLSearchParams({
      page: String(page),
      limit: "50",
      search,
      status,
    });

    const res = await fetch(`/api/admin/maruti/shipments?${params}`);
    const json = await res.json();

    if (json.success) {
      setRows(json.data);
    }

    setLoading(false);
  }

  useEffect(() => {
    load();
  }, [page, status]);

  if (loading) return <div className="p-6">Loading…</div>;

  return (
    <div className="p-6 space-y-6">

      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-semibold">Maruti – All Shipments</h1>
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <input
          placeholder="Search AWB"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border rounded px-3 py-2 text-sm w-60"
        />

        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="border rounded px-3 py-2 text-sm"
        >
          <option value="all">All</option>
          <option value="Delivered">Delivered</option>
          <option value="In Transit">In Transit</option>
          <option value="Pending">Pending</option>
          <option value="RTO">RTO</option>
        </select>

        <button
          onClick={() => load()}
          className="px-4 py-2 rounded bg-indigo-600 text-white text-sm"
        >
          Search
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto border rounded-lg">
        <table className="w-full text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-3 text-left">AWB</th>
              <th className="p-3 text-left">Status</th>
              <th className="p-3 text-left">Origin</th>
              <th className="p-3 text-left">Destination</th>
              <th className="p-3 text-left">Booked On</th>
            </tr>
          </thead>

          <tbody>
            {rows.length ? (
              rows.map((r) => (
                <tr key={r.id} className="border-t hover:bg-gray-50">
                  <td className="p-3 font-medium">
                    <Link
                      href={`/admin/maruti/orders/${r.awb}`}
                      className="text-indigo-600 underline"
                    >
                      {r.awb}
                    </Link>
                  </td>

                  <td className="p-3">{r.current_status || "Pending"}</td>
                  <td className="p-3">{r.origin || "-"}</td>
                  <td className="p-3">{r.destination || "-"}</td>
                  <td className="p-3">
                    {r.created_at
                      ? new Date(r.created_at).toLocaleDateString()
                      : "-"}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="p-6 text-center text-gray-500">
                  No shipments found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

    </div>
  );
}