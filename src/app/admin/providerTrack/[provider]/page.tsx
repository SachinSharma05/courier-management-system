"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import toast from "react-hot-toast";
import * as XLSX from "xlsx";

type Row = {
  id: string;
  awb: string;
  last_status?: string;
  booked_on?: string;
  last_updated_on?: string;
  origin?: string;
  destination?: string;
};

export default function ProviderTrackPage() {
  const { provider } = useParams();
  const providerName = String(provider).toUpperCase();
  const searchParams = useSearchParams();

  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(false);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");

  const abortRef = useRef<AbortController | null>(null);

  // Apply ?status= on load
  useEffect(() => {
    const s = searchParams.get("status");
    if (s) setStatusFilter(s.toLowerCase());
  }, [searchParams]);

  // Fetch consignments
  const fetchPage = useCallback(
    async (p = page, ps = pageSize) => {
      if (!provider) return;

      setIsFetching(true);
      abortRef.current?.abort();

      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const q = new URLSearchParams();
        q.set("provider", String(provider));
        q.set("page", String(p));
        q.set("pageSize", String(ps));
        q.set("status", statusFilter);
        if (search) q.set("search", search);

        const res = await fetch(`/api/admin/providerConsignments?${q}`, {
          signal: controller.signal,
        });

        const json = await res.json();
        if (!res.ok || json.error) {
          toast.error(json.error || "Failed to load consignments");
          return;
        }

        setRows(json.items ?? []);
        setTotalCount(json.total ?? 0);
        setTotalPages(json.totalPages ?? 1);
      } catch (err: any) {
        if (err.name !== "AbortError") toast.error("Network error");
      } finally {
        setIsFetching(false);
      }
    },
    [provider, page, pageSize, statusFilter, search]
  );

  // Fetch whenever filters change
  useEffect(() => {
    setPage(1);
    fetchPage(1, pageSize);

    return () => abortRef.current?.abort();
  }, [provider, statusFilter, search, pageSize]);

  // Fetch when page changes
  useEffect(() => {
    fetchPage(page, pageSize);
  }, [page]);

  // Refresh button action
  const refresh = async () => {
    setLoading(true);
    await fetchPage(1, pageSize);
    setLoading(false);
    toast.success("Refreshed");
  };

  // Export excel
  const exportExcel = () => {
    if (!rows.length) return toast.error("Nothing to export");

    const data = [
      ["AWB", "Status", "Booked", "Last Update", "Origin", "Destination"],
      ...rows.map((r) => [
        r.awb,
        r.last_status,
        r.booked_on,
        r.last_updated_on,
        r.origin,
        r.destination,
      ]),
    ];

    const ws = XLSX.utils.aoa_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
    XLSX.writeFile(
      wb,
      `${providerName}_tracking_${new Date()
        .toISOString()
        .slice(0, 10)}.xlsx`
    );

    toast.success("Exported to Excel");
  };

  // Status badge UI
  const statusBadge = (s?: string | null) => {
    if (!s) return <span className="px-2 py-1 bg-gray-200 rounded text-xs">-</span>;

    const status = s.toLowerCase();

    if (status.includes("deliver"))
      return <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs">Delivered</span>;

    if (status.includes("rto"))
      return <span className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs">RTO</span>;

    if (status.includes("out for"))
      return <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">Out for Delivery</span>;

    if (status.includes("received") || status.includes("reached"))
      return <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded text-xs">In Hub</span>;

    return <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded text-xs">{s}</span>;
  };

  return (
    <div className="p-8 space-y-6">
      {/* Header Summary */}
      <div className="flex justify-between">
        <h1 className="text-2xl font-semibold">
          {providerName} — Tracking Overview
        </h1>

        <div className="flex gap-3">
          <button
            onClick={refresh}
            disabled={loading}
            className="px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700 disabled:opacity-50"
          >
            {loading ? "Refreshing…" : "Refresh"}
          </button>

          <button
            onClick={exportExcel}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Export Excel
          </button>
        </div>
      </div>

      {/* Filters Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-white p-4 rounded-xl shadow">
        <input
          placeholder="Search AWB"
          className="border rounded px-3 py-2"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <select
          className="border rounded px-3 py-2"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="all">All</option>
          <option value="delivered">Delivered</option>
          <option value="rto">RTO</option>
          <option value="pending">Pending</option>
          <option value="out for delivery">Out for Delivery</option>
          <option value="received">Received</option>
        </select>

        <select
          className="border rounded px-3 py-2"
          value={pageSize}
          onChange={(e) => setPageSize(Number(e.target.value))}
        >
          {[25, 50, 100, 200].map((n) => (
            <option key={n} value={n}>
              {n} rows
            </option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="rounded-xl shadow overflow-hidden bg-white">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-xs uppercase text-gray-600">
            <tr>
              <th className="p-3 text-left">AWB</th>
              <th className="p-3 text-left">Status</th>
              <th className="p-3 text-left">Booked</th>
              <th className="p-3 text-left">Last Update</th>
              <th className="p-3 text-left">Origin</th>
              <th className="p-3 text-left">Destination</th>
            </tr>
          </thead>

          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t hover:bg-gray-50">
                <td className="p-3 font-medium">{r.awb}</td>
                <td className="p-3">{statusBadge(r.last_status)}</td>
                <td className="p-3">{r.booked_on ?? "-"}</td>
                <td className="p-3">{r.last_updated_on ?? "-"}</td>
                <td className="p-3">{r.origin ?? "-"}</td>
                <td className="p-3">{r.destination ?? "-"}</td>
              </tr>
            ))}

            {rows.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center py-10 text-gray-500">
                  No results found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between mt-4">
        <div className="text-sm text-gray-600">
          Showing page {page} of {totalPages} — Total {totalCount}
        </div>

        <div className="flex gap-2">
          <button
            disabled={page === 1}
            onClick={() => setPage(1)}
            className="px-3 py-1 border rounded disabled:opacity-50"
          >
            First
          </button>
          <button
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
            className="px-3 py-1 border rounded disabled:opacity-50"
          >
            Prev
          </button>
          <button
            disabled={page === totalPages}
            onClick={() => setPage(page + 1)}
            className="px-3 py-1 border rounded disabled:opacity-50"
          >
            Next
          </button>
          <button
            disabled={page === totalPages}
            onClick={() => setPage(totalPages)}
            className="px-3 py-1 border rounded disabled:opacity-50"
          >
            Last
          </button>
        </div>
      </div>
    </div>
  );
}
