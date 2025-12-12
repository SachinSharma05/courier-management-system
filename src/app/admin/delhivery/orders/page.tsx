"use client";

import { useEffect, useState } from "react";

export default function DelhiveryOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [syncing, setSyncing] = useState(false);

  async function loadOrders() {
    setLoading(true);

    const params = new URLSearchParams();
    if (status) params.set("status", status);
    if (search) params.set("search", search);
    if (from) params.set("from", from);
    if (to) params.set("to", to);

    const res = await fetch(`/api/admin/delhivery/orders?` + params.toString());
    const j = await res.json();
    if (j.success) setOrders(j.data);

    setLoading(false);
  }

  useEffect(() => {
    loadOrders();
  }, [status, from, to]);

  function handleSearch() {
    loadOrders();
  }

  async function bulkSync() {
    setSyncing(true);
    const awbs = orders.map((o) => o.awb).filter(Boolean);

    await fetch("/api/admin/delhivery/track/sync", {
      method: "POST",
      body: JSON.stringify({ awbs }),
    });

    await loadOrders();
    setSyncing(false);
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Orders</h1>

        <button
          onClick={bulkSync}
          disabled={syncing}
          className="px-4 py-2 bg-slate-900 text-white rounded"
        >
          {syncing ? "Syncing…" : "Sync All"}
        </button>
      </div>

      {/* Filters */}
      <div className="p-4 bg-white border rounded-xl space-y-3 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">

          <input
            placeholder="Search AWB / Order ID"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="p-2 border rounded"
          />

          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="p-2 border rounded"
          >
            <option value="">All Status</option>
            <option value="Pending">Pending</option>
            <option value="In Transit">In Transit</option>
            <option value="Delivered">Delivered</option>
            <option value="RTO">RTO</option>
            <option value="Returned">Returned</option>
          </select>

          <input type="date" className="p-2 border rounded" value={from} onChange={(e) => setFrom(e.target.value)} />
          <input type="date" className="p-2 border rounded" value={to} onChange={(e) => setTo(e.target.value)} />

        </div>

        <button
          onClick={handleSearch}
          className="px-4 py-2 bg-indigo-600 text-white rounded"
        >
          Search
        </button>
      </div>

      {/* Table */}
      {loading ? (
        <p>Loading…</p>
      ) : (
        <div className="bg-white border rounded-xl overflow-auto shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-3">AWB</th>
                <th className="p-3">Order ID</th>
                <th className="p-3">Customer</th>
                <th className="p-3">Pincode</th>
                <th className="p-3">Status</th>
                <th className="p-3">Created</th>
                <th className="p-3">Actions</th>
              </tr>
            </thead>

            <tbody>
              {orders.map((o) => (
                <tr key={o.id} className="border-t">
                  <td className="p-3 font-semibold">{o.awb}</td>
                  <td className="p-3">{o.order_id}</td>
                  <td className="p-3">{o.customer_name}</td>
                  <td className="p-3">{o.customer_pincode}</td>
                  <td className="p-3">{o.current_status || "Pending"}</td>
                  <td className="p-3">{new Date(o.created_at).toLocaleString()}</td>
                  <td className="p-3 flex gap-2">
                    <a
                      href={`/admin/delhivery/orders/${o.id}`}
                      className="px-3 py-1 border rounded text-xs"
                    >
                      View
                    </a>

                    {o.awb && (
                      <a
                        href={`/admin/delhivery/track?awb=${o.awb}`}
                        className="px-3 py-1 border rounded text-xs"
                      >
                        Track
                      </a>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}