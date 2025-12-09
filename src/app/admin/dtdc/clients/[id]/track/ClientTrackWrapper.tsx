"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import { useSearchParams } from "next/navigation"; 

import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableRow as TR,
  TableHead as TH,
} from "@/components/ui/table";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetTrigger,
} from "@/components/ui/sheet";

import { RefreshCw } from "lucide-react";

import type { ConsignmentRow } from "@/interface/ConsignmentRow";
import { AppError } from "@/interface/AppError";
import {
  computeTAT,
  computeMovement,
  isDelivered,
} from "@/lib/tracking/utils";
import { statusBadgeUI } from "@/lib/tracking/statusUtils";

import { exportConsignmentsToExcel } from "@/lib/export/excel";
import { downloadMergedLabelForRow } from "@/lib/pdf/label-utils";

const DEFAULT_PAGE_SIZE = 50;

export default function ClientTrackWrapper({ clientId }: { clientId: number }) {
  // table + paging + filters
  const [rows, setRows] = useState<ConsignmentRow[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [tatFilter, setTatFilter] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const [loading, setLoading] = useState(false);

  const [isFetching, setIsFetching] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  // Auto-refresh interval ref
  const autoRef = useRef<number | null>(null);

  // ---------- fetchPage ----------
  const fetchPage = useCallback(
  async (force = false) => {
    try {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setIsFetching(true);

      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("pageSize", String(pageSize));

      // filters
      if (search) params.set("search", search);
      if (statusFilter && statusFilter !== "all") {
        if (statusFilter === "pending") {
          params.set("status", "pending-group");
        } else {
          params.set("status", statusFilter.toLowerCase());
        }
      }
      if (dateFrom) params.set("from", dateFrom);
      if (dateTo) params.set("to", dateTo);
      if (tatFilter && tatFilter !== "all") params.set("tat", tatFilter);

      // REQUIRED FOR MULTI-CLIENT
      params.set("clientId", String(clientId));  // 🔥 added

      const res = await fetch(`/api/admin/clients/${clientId}/consignments?${params.toString()}`, {
        signal: controller.signal,
      });

      if (!res.ok) {
        const txt = await res.text();
        toast.error("Failed to load consignments: " + txt);
        setRows([]);
        setTotalPages(1);
        setTotalCount(0);
        return;
      }

      const json = await res.json();
      const items: ConsignmentRow[] = json.items ?? [];
      setRows(items);
      setTotalPages(json.totalPages ?? 1);
      setTotalCount(json.totalCount ?? 0);
      } catch (e: unknown) {
        const err = e as AppError; // safe cast
        console.error(err.message, err.code);
      } finally {
        setIsFetching(false);
      }
    },
    [page, pageSize, search, statusFilter, tatFilter, dateFrom, dateTo, clientId] // include clientId
  );

  // initial + auto refresh
  useEffect(() => {
    fetchPage();
    // auto-refresh every hour
    autoRef.current = window.setInterval(() => {
      fetchPage(true);
      toast("Auto-refresh: data reloaded", { icon: "🔁" });
    }, 60 * 60 * 1000);

    return () => {
      if (autoRef.current) clearInterval(autoRef.current);
      abortRef.current?.abort();
    };
  }, []); // eslint-disable-line

  // re-fetch when page changes or filters change
  useEffect(() => {
    fetchPage();
  }, [fetchPage]);

  // ---------- pagination helpers ----------
  const pageNumbers = useMemo(() => {
    const out: number[] = [];
    const start = Math.max(1, page - 3);
    const end = Math.min(totalPages, page + 3);
    for (let i = start; i <= end; i++) out.push(i);
    return out;
  }, [page, totalPages]);

  const searchParams = useSearchParams();
  useEffect(() => {
    const s = searchParams.get("status");

    if (s) {
      setStatusFilter(s.toLowerCase());
      setPage(1);
    }
  }, []);

  // refresh pending tracking
  async function refreshTracking() {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/dtdc/track`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId,
          provider: "dtdc"
        })
      });

      const json = await res.json();

      if (!res.ok || json.error) {
        toast.error(json.error || "Failed to refresh tracking");
      } else {
        toast.success("Tracking updated");
      }

      await fetchPage(true);
      toast.success("Tracking updated");
    } catch (e) {
      toast.error("Failed to refresh");
    } finally {
      setLoading(false);
    }
  }

  function tatBadgeUI(t: string) {
    switch (t) {
      case "Delivered":
        return <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded">Delivered</span>;
      case "Sensitive":
        return <span className="px-2 py-0.5 bg-red-600 text-white rounded">Sensitive</span>;
      case "Critical":
        return <span className="px-2 py-0.5 bg-red-200 text-red-800 rounded">Critical</span>;
      case "Warning":
        return <span className="px-2 py-0.5 bg-yellow-200 text-yellow-800 rounded">Warning</span>;
      default:
        return <span className="px-2 py-0.5 bg-slate-200 text-slate-800 rounded">On Time</span>;
    }
  }

  function moveBadgeUI(t: string) {
    return tatBadgeUI(t); // identical styling rules
  }

  {/* ---------- UI (fixed: restores inner scroll exactly) ---------- */}
return (
  <div className={loading ? "pointer-events-none opacity-50" : ""}>
    <div className="space-y-4 p-2 md:p-4">

      {/* HEADER */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Track Consignments</h1>
          <p className="text-sm text-gray-500 mt-1">
            Search, filter, manage, export & analyze your tracking data.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            disabled={loading}
            onClick={refreshTracking}
            className="bg-emerald-600 text-white hover:bg-emerald-700 px-5 h-10 rounded-lg flex items-center gap-2 shadow"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10" stroke="white" strokeWidth="4" fill="none" />
                </svg>
                Refreshing…
              </span>
            ) : (
              <>
                <RefreshCw className="h-4 w-4" />
                Refresh Status
              </>
            )}
          </Button>

          <Button
            variant="default"
            className="h-10 px-5 rounded-lg shadow"
            onClick={() => {
              try {
                exportConsignmentsToExcel(rows);
                toast.success("Excel exported");
              } catch {
                toast.error("Unable to export");
              }
            }}
          >
            Export Excel
          </Button>
        </div>
      </div>

      {/* FILTER BAR */}
      <Card className="border shadow-sm rounded-xl">
        <CardContent className="py-0 flex flex-wrap items-center gap-4">
          <Input
            placeholder="Search AWB"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-56 rounded-lg"
          />

          <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
            <SelectTrigger className="w-40 rounded-lg">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="delivered">Delivered</SelectItem>
              <SelectItem value="in transit">In Transit</SelectItem>
              <SelectItem value="out for delivery">Out For Delivery</SelectItem>
              <SelectItem value="reached at destination">Reached At Destination</SelectItem>
              <SelectItem value="received at delivery centre">Received At Delivery Centre</SelectItem>
              <SelectItem value="rto">RTO</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="weekly off">Weekly Off</SelectItem>
              <SelectItem value="undelivered">Undelivered</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">From</span>
            <Input type="date" className="rounded-lg" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setPage(1); }} />
            <span className="text-sm text-gray-500">To</span>
            <Input type="date" className="rounded-lg" value={dateTo} onChange={(e) => { setDateTo(e.target.value); setPage(1); }} />
          </div>

          <Select value={tatFilter} onValueChange={(v) => { setTatFilter(v); setPage(1); }}>
            <SelectTrigger className="w-40 rounded-lg">
              <SelectValue placeholder="TAT" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="warning">Warning</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
              <SelectItem value="sensitive">Sensitive</SelectItem>
            </SelectContent>
          </Select>

          <div className="ml-auto flex items-center gap-2">
            <span className="text-sm text-gray-500">Page Size</span>
            <Input
              type="number"
              className="w-20 rounded-lg"
              value={pageSize}
              onChange={(e) => {
                setPageSize(Math.max(5, Number(e.target.value || DEFAULT_PAGE_SIZE)));
                setPage(1);
              }}
            />
          </div>
        </CardContent>
      </Card>

      {/* TABLE CARD — KEEP the original fixed-height wrapper to restore inner scroll */}
      <Card className="shadow-sm border rounded-xl">
        <CardContent className="p-0">
          {/* IMPORTANT: restore exact behavior — outer wrapper locks height and prevents ScrollArea from expanding */}
          <div className="h-[90vh] flex flex-col overflow-hidden">
            <ScrollArea className="flex-1 overflow-auto">
              <Table className="text-sm w-full">

                {/* sticky header */}
                <TableHeader className="bg-gray-50 sticky top-0 z-20 shadow-sm">
                  <TableRow>
                    <TableHead className="w-[140px]">AWB</TableHead>
                    <TableHead className="w-[160px]">Status</TableHead>
                    <TableHead className="w-[140px]">Booked</TableHead>
                    <TableHead className="w-[160px]">Last Update</TableHead>
                    <TableHead className="w-[140px]">Origin</TableHead>
                    <TableHead className="w-[160px]">Destination</TableHead>
                    <TableHead className="w-[120px]">TAT</TableHead>
                    <TableHead className="w-[120px]">Movement</TableHead>
                    <TableHead className="w-[80px]">Timeline</TableHead>
                    <TableHead className="w-[80px]">PDF</TableHead>
                    <TableHead className="w-[100px]">Details</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {rows.length === 0 && (
                    <TR>
                      <TableCell colSpan={12} className="py-10 text-center text-gray-500">
                        {isFetching ? "Loading..." : "No results found"}
                      </TableCell>
                    </TR>
                  )}

                  {rows.map((r) => {
                    const delivered = isDelivered(r.last_status);
                    const tat = computeTAT(r.awb, r.booked_on, r.last_status);
                    const move = computeMovement(
                      r.timeline?.[0]?.actionDate,
                      r.timeline?.[0]?.actionTime,
                      r.last_status
                    );

                    return (
                      <TR
                        key={r.awb}
                        className={`${delivered ? "bg-green-50" : ""} hover:bg-gray-100 transition`}
                      >
                        <TableCell className="font-medium w-[140px]">{r.awb}</TableCell>
                        <TableCell className="w-[160px]">{statusBadgeUI(r.last_status ?? "-")}</TableCell>
                        <TableCell className="w-[140px]">{r.booked_on ?? "-"}</TableCell>
                        <TableCell className="w-[160px]">{r.last_updated_on ?? "-"}</TableCell>
                        <TableCell className="w-[140px]">{r.origin ?? "-"}</TableCell>
                        <TableCell className="w-[160px]">{r.destination ?? "-"}</TableCell>
                        <TableCell className="w-[120px]">{tatBadgeUI(tat)}</TableCell>
                        <TableCell className="w-[120px]">{moveBadgeUI(move)}</TableCell>

                        {/* Timeline (sheet) */}
                        <TableCell className="w-[80px]">
                          <Sheet>
                            <SheetTrigger asChild>
                              <button className="text-primary underline text-sm">View</button>
                            </SheetTrigger>
                            <SheetContent side="right" className="px-6 w-[480px] sm:w-[560px]">
                              <SheetHeader>
                                <SheetTitle>Timeline — {r.awb}</SheetTitle>
                                <SheetDescription>Complete movement history</SheetDescription>
                              </SheetHeader>

                              <div className="mt-6 max-h-[75vh] overflow-y-auto space-y-6 pr-2">
                                {r.timeline?.length ? (
                                  r.timeline.map((t: any, i: number) => (
                                    <div key={i} className="border-b pb-4">
                                      <div className="text-xs text-gray-500">{t.actionDate} {t.actionTime}</div>
                                      <div className="font-semibold">{t.action}</div>
                                      <div className="text-sm text-gray-500">{t.origin || t.destination}</div>
                                      {t.remarks && <div className="text-xs text-gray-500 mt-1">{t.remarks}</div>}
                                    </div>
                                  ))
                                ) : (
                                  <p className="text-gray-500">No timeline available.</p>
                                )}
                              </div>
                            </SheetContent>
                          </Sheet>
                        </TableCell>

                        {/* PDF */}
                        <TableCell className="w-[80px]">
                          <Button
                            size="sm"
                            variant="outline"
                            className="rounded-lg"
                            onClick={async () => {
                              try {
                                await downloadMergedLabelForRow(r);
                                toast.success("Label downloaded");
                              } catch {
                                toast.error("Failed generating label");
                              }
                            }}
                          >
                            PDF
                          </Button>
                        </TableCell>

                        {/* Details */}
                        <TableCell className="w-[100px]">
                          <Sheet>
                            <SheetTrigger asChild>
                              <Button size="sm" variant="secondary" className="rounded-lg">Details</Button>
                            </SheetTrigger>

                            <SheetContent side="right" className="px-6 w-[480px] sm:w-[560px]">
                              <SheetHeader>
                                <SheetTitle>Consignment Details — {r.awb}</SheetTitle>
                                <SheetDescription>Complete shipment details</SheetDescription>
                              </SheetHeader>

                              <div className="mt-6 max-h-[75vh] overflow-y-auto space-y-4 pr-2">
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                  <div><strong>Status:</strong> {r.last_status}</div>
                                  <div><strong>Booked:</strong> {r.booked_on}</div>
                                  <div><strong>Last Update:</strong> {r.last_updated_on}</div>
                                  <div><strong>Origin:</strong> {r.origin}</div>
                                  <div><strong>Destination:</strong> {r.destination}</div>
                                </div>

                                <div>
                                  <h4 className="text-lg font-semibold mb-3">Timeline</h4>
                                  {r.timeline?.length ? (
                                    <div className="space-y-4">
                                      {r.timeline.map((t: any, i: number) => (
                                        <div key={i} className="border-b pb-3">
                                          <div className="text-xs text-gray-500">{t.actionDate} {t.actionTime}</div>
                                          <div className="font-medium">{t.action}</div>
                                          <div className="text-sm text-gray-500">{t.origin || t.destination}</div>
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    <p className="text-gray-500">No timeline available.</p>
                                  )}
                                </div>
                              </div>
                            </SheetContent>
                          </Sheet>
                        </TableCell>
                      </TR>
                    );
                  })}
                </TableBody>
              </Table>
            </ScrollArea>
          </div>
        </CardContent>
      </Card>

      {/* PAGINATION (outside the fixed-height card) */}
      <div className="mt-4 flex items-center justify-between">
        <div className="text-sm text-gray-500">
          Showing {rows.length} of {totalCount}
        </div>

        <div className="flex items-center gap-2">
          <Button size="sm" variant="ghost" disabled={page === 1} onClick={() => setPage(1)}>First</Button>
          <Button size="sm" variant="ghost" disabled={page === 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>Prev</Button>

          {pageNumbers[0] > 1 && <span className="px-1">…</span>}

          {pageNumbers.map((p) => (
            <button
              key={p}
              onClick={() => { setPage(p); fetchPage(true); }}
              className={`px-3 py-1 rounded-lg text-sm ${p === page ? "bg-primary text-white" : "bg-white border"}`}
            >
              {p}
            </button>
          ))}

          {pageNumbers[pageNumbers.length - 1] < totalPages && <span className="px-1">…</span>}

          <Button size="sm" variant="ghost" disabled={page === totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>Next</Button>
          <Button size="sm" variant="ghost" disabled={page === totalPages} onClick={() => setPage(totalPages)}>Last</Button>

          <div className="ml-4 flex items-center gap-2">
            <span className="text-sm text-gray-700">Jump</span>
            <Input
              type="number"
              min={1}
              max={totalPages}
              className="w-20 rounded-lg"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  const v = Number((e.target as HTMLInputElement).value || 1);
                  const pg = Math.max(1, Math.min(totalPages, v));
                  setPage(pg);
                  fetchPage(true);
                }
              }}
            />
          </div>
        </div>
      </div>
    </div>
  </div>
);

}