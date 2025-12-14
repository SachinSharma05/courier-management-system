"use client";

import { useEffect, useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function DelhiveryOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [pincode, setPincode] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const [pageSize, setPageSize] = useState(50);

  const [syncing, setSyncing] = useState(false);

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  async function loadOrders() {
  setLoading(true);

  const params = new URLSearchParams();
  params.set("page", String(page));
  params.set("limit", String(pageSize));

  if (status) params.set("status", status);
  if (search) params.set("search", search);
  if (from) params.set("from", from);
  if (to) params.set("to", to);
  if (pincode) params.set("pincode", pincode);

  const res = await fetch(`/api/admin/delhivery/orders?` + params.toString());
  const j = await res.json();

  if (j.success) {
    setOrders(j.data);
    setTotalPages(j.totalPages);
  }

  setLoading(false);
}

useEffect(() => {
  loadOrders();
}, [status, from, to, pincode, page]);

  function handleSearch() {
    loadOrders();
  }

  async function bulkSync() {
    setSyncing(true);

    const awbs = orders
      .filter((o) => !String(o.current_status).toLowerCase().includes("deliver"))
      .map((o) => o.awb);

    if (awbs.length === 0) {
      alert("No pending shipments to sync.");
      setSyncing(false);
      return;
    }

    await fetch("/api/admin/delhivery/track/sync", {
      method: "POST",
      body: JSON.stringify({ awbs }),
    });

    await loadOrders();
    setSyncing(false);
  }

  // Status colors
  function badge(status: string) {
    switch (status?.toLowerCase()) {
      case "delivered":
        return "bg-green-100 text-green-700";
      case "in transit":
        return "bg-yellow-100 text-yellow-700";
      case "pending":
        return "bg-gray-200 text-gray-700";
      case "rto":
      case "returned":
        return "bg-red-100 text-red-700";
      default:
        return "bg-blue-100 text-blue-700";
    }
  }

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Delhivery Shipments</h1>

        <div className="flex gap-3">
          <button
            onClick={bulkSync}
            disabled={syncing}
            className="bg-emerald-600 text-white hover:bg-emerald-700 px-5 h-10 rounded-lg flex items-center gap-2 shadow"
          >
            {syncing ? "Syncing…" : "Sync Orders"}
          </button>

          <button
            className="bg-black text-white h-10 px-5 rounded-lg shadow"
            onClick={() => alert("Export Excel coming soon")}
          >
            Export Excel
          </button>
        </div>
      </div>

      {/* FILTER BAR — DTDC STYLE */}
      <div className="p-4 bg-white border rounded-xl shadow-sm">
        <div className="flex flex-wrap items-center gap-3">

          {/* Search */}
          <input
            placeholder="Search AWB / Order ID"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="p-2 border rounded w-[200px]"
          />

          {/* Status */}
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="p-2 border rounded w-[150px]"
          >
            <option value="">All Status</option>
            <option value="Pending">Pending</option>
            <option value="In Transit">In Transit</option>
            <option value="Delivered">Delivered</option>
            <option value="RTO">RTO</option>
            <option value="Returned">Returned</option>
            <option value="Cancelled">Cancelled</option>
          </select>

          {/* Pincode */}
          <input
            placeholder="Pincode"
            maxLength={6}
            value={pincode}
            onChange={(e) => setPincode(e.target.value)}
            className="p-2 border rounded w-[120px]"
          />

          {/* Date From */}
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="p-2 border rounded"
          />

          {/* Date To */}
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="p-2 border rounded"
          />

          {/* Page Size */}
          <div className="flex items-center gap-2 ml-auto">
            <span className="text-sm text-gray-600">Page Size</span>
            <input
              type="number"
              min={10}
              max={200}
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
              className="w-20 p-2 border rounded"
            />
          </div>

          {/* Apply Button */}
          <button
            onClick={handleSearch}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md"
          >
            Apply Filters
          </button>
        </div>
      </div>

      {/* Orders Table */}
      {loading ? (
        <p>Loading…</p>
      ) : (
        <div className="bg-white border rounded-xl overflow-auto shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-3">AWB</th>
                <th className="p-3">Reference No</th>
                <th className="p-3">Origin</th>
                <th className="p-3">Destination</th>
                <th className="p-3">Status</th>
                <th className="p-3">Created</th>
                <th className="p-3">Actions</th>
              </tr>
            </thead>

            <tbody>
              {orders.map((o) => (
                <tr key={o.id} className="border-t">
                  <td className="p-3 font-semibold">
                    <Link href={`/admin/delhivery/orders/${o.awb}`} className="text-primary underline">
                      {o.awb}
                    </Link>
                  </td>
                  <td className="p-3">{o.reference_number}</td>
                  <td className="p-3">{o.origin}</td>
                  <td className="p-3">{o.destination}</td>

                  {/* Status Badge */}
                  <td className="p-3">
                    <span className={`px-2 py-1 rounded text-xs ${badge(o.current_status)}`}>
                      {o.current_status || "Pending"}
                    </span>
                  </td>

                  <td className="p-3">{new Date(o.created_at).toLocaleString()}</td>

                  {/* Actions */}
                  <td className="p-3 flex gap-3">

                    {/* Timeline drawer */}
                    <Sheet>
                      <SheetTrigger asChild>
                        <button className="text-primary underline text-sm">Timeline</button>
                      </SheetTrigger>
                      <SheetContent side="right" className="px-6 w-[480px] sm:w-[560px]">
                        <SheetHeader>
                          <SheetTitle>Timeline — {o.awb}</SheetTitle>
                          <SheetDescription>Complete movement history</SheetDescription>
                        </SheetHeader>

                        <div className="mt-6 max-h-[75vh] overflow-y-auto space-y-6 pr-2">
                          {o.timeline?.length ? (
                            o.timeline.map((t: any, i: number) => (
                              <div key={i} className="border-b pb-4">
                                <div className="text-xs text-gray-500">
                                  {new Date(t.event_time).toLocaleString()}
                                </div>

                                <div className="font-semibold">{t.status}</div>

                                <div className="text-sm text-gray-500">
                                  {t.location}
                                </div>

                                {t.remarks && (
                                  <div className="text-xs text-gray-500 mt-1">
                                    {t.remarks}
                                  </div>
                                )}
                              </div>
                            ))
                          ) : (
                            <p className="text-gray-500">No timeline available.</p>
                          )}
                        </div>
                      </SheetContent>
                    </Sheet>

                    {/* Details drawer */}
                    <Sheet>
                      <SheetTrigger asChild>
                        <Button size="sm" variant="secondary" className="rounded-lg">
                          Details
                        </Button>
                      </SheetTrigger>

                      <SheetContent side="right" className="px-6 w-[480px] sm:w-[560px]">
                        <SheetHeader>
                          <SheetTitle>Shipment Details — {o.awb}</SheetTitle>
                          <SheetDescription>Complete shipment details</SheetDescription>
                        </SheetHeader>

                        <div className="mt-6 max-h-[75vh] overflow-y-auto space-y-4 pr-2">

                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div><strong>Status:</strong> {o.current_status}</div>
                            <div><strong>Booked:</strong> {new Date(o.created_at).toLocaleDateString()}</div>
                            <div><strong>Origin:</strong> {o.origin}</div>
                            <div><strong>Destination:</strong> {o.destination}</div>
                          </div>

                          <div>
                            <h4 className="text-lg font-semibold mb-3">Timeline</h4>
                            {o.timeline?.length ? (
                              o.timeline.map((t: any, i: number) => (
                                <div key={i} className="border-b pb-4">
                                  <div className="text-xs text-gray-500">
                                    {new Date(t.event_time).toLocaleString()}
                                  </div>

                                  <div className="font-semibold">{t.status}</div>

                                  <div className="text-sm text-gray-500">
                                    {t.location}
                                  </div>

                                  {t.remarks && (
                                    <div className="text-xs text-gray-500 mt-1">
                                      {t.remarks}
                                    </div>
                                  )}
                                </div>
                              ))
                            ) : (
                              <p className="text-gray-500">No timeline available.</p>
                            )}
                          </div>
                        </div>
                      </SheetContent>
                    </Sheet>

                    {/* PDF Label button */}
                    {o.awb && (
                      <a
                        href={`/admin/delhivery/label?awb=${o.awb}`}
                        className="px-3 py-1 border rounded text-xs"
                      >
                        PDF
                      </a>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="flex justify-between items-center py-4">
            <button
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
              className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50"
            >
              Previous
            </button>

            <span className="text-sm text-gray-600">
              Page {page} of {totalPages}
            </span>

            <button
              disabled={page >= totalPages}
              onClick={() => setPage(page + 1)}
              className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
