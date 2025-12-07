"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as XLSX from "xlsx";
import dayjs from "dayjs";
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

import { RefreshCw, DownloadCloud } from "lucide-react";

import { generateCustomLabel } from "@/app/lib/pdf/generateCustomLabel";
import { mergePDFs } from "@/app/lib/pdf/mergePDFs";

import type { ConsignmentRow } from "@/interface/ConsignmentRow";
import { AppError } from "@/interface/AppError";
import { ColKeySortColumn } from "@/interface/ColKeySortColumn";

const DEFAULT_PAGE_SIZE = 50;
const DEFAULT_BATCH_SIZE = 25;

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

  // ---------- export ----------
  function exportToExcel(rowsToExport: ConsignmentRow[], filename = "dtdc-tracking") {
    if (!rowsToExport.length) return toast.error("No rows to export");
    const data = [
      ["AWB", "Status", "Booked", "Last Update", "Origin", "Destination"],
      ...rowsToExport.map((r) => [r.awb, r.last_status ?? "", r.booked_on ?? "", r.last_updated_on ?? "", r.origin ?? "", r.destination ?? ""]),
    ];
    const ws = XLSX.utils.aoa_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Tracking");
    const out = XLSX.write(wb, { type: "array", bookType: "xlsx" });
    const blob = new Blob([out], { type: "application/octet-stream" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${filename}-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-")}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Export started");
  }

  // ---------- compute badges ----------
  function computeTATLocal(r: ConsignmentRow) {
    if (r.tat) return r.tat;
    if (!r.booked_on) return "On Time";
    const prefix = r.awb?.charAt(0)?.toUpperCase();
    const rules: Record<string, number> = { D: 3, M: 5, N: 7, I: 10 };
    const allowed = rules[prefix as string] ?? 5;
    const age = dayjs().diff(dayjs(r.booked_on), "day");
    if (age > allowed + 3) return "Very Critical";
    if (age > allowed) return "Critical";
    if (age >= Math.max(0, allowed - 1)) return "Warning";
    return "On Time";
  }

  function computeMovementLocal(r: ConsignmentRow) {
    if (r.movement) return r.movement;
    if (!r.timeline || r.timeline.length === 0) return "On Time";
    const last = r.timeline[0];
    if (!last?.actionDate) return "On Time";
    const lastTs = new Date(`${last.actionDate}T${last.actionTime ?? "00:00:00"}`).getTime();
    const hours = Math.floor((Date.now() - lastTs) / (1000 * 60 * 60));
    if (hours >= 72) return "Stuck (72+ hrs)";
    if (hours >= 48) return "Slow (48 hrs)";
    if (hours >= 24) return "Slow (24 hrs)";
    return "On Time";
  }

  function tatBadge(tat: string, isDelivered = false) {
    if (isDelivered) return <span className="px-2 py-0.5 rounded text-sm bg-green-100 text-green-800">Delivered</span>;
    const t = (tat ?? "").toLowerCase();
    if (t.includes("very")) return <span className="px-2 py-0.5 rounded text-sm bg-red-600 text-white">Very Critical</span>;
    if (t.includes("critical")) return <span className="px-2 py-0.5 rounded text-sm bg-red-100 text-red-700">Critical</span>;
    if (t.includes("warn")) return <span className="px-2 py-0.5 rounded text-sm bg-yellow-100 text-yellow-800">Warning</span>;
    return <span className="px-2 py-0.5 rounded text-sm bg-slate-100 text-slate-800">{tat}</span>;
  }

  function moveBadge(move: string, isDelivered = false) {
    if (isDelivered) return <span className="px-2 py-0.5 rounded text-sm bg-green-100 text-green-800">Delivered</span>;
    const m = (move ?? "").toLowerCase();
    if (m.includes("72")) return <span className="px-2 py-0.5 rounded text-sm bg-red-600 text-white">{move}</span>;
    if (m.includes("48")) return <span className="px-2 py-0.5 rounded text-sm bg-red-100 text-red-700">{move}</span>;
    if (m.includes("24")) return <span className="px-2 py-0.5 rounded text-sm bg-yellow-100 text-yellow-800">{move}</span>;
    return <span className="px-2 py-0.5 rounded text-sm bg-slate-100 text-slate-800">{move}</span>;
  }

  // ---------- pagination helpers ----------
  const pageNumbers = useMemo(() => {
    const out: number[] = [];
    const start = Math.max(1, page - 3);
    const end = Math.min(totalPages, page + 3);
    for (let i = start; i <= end; i++) out.push(i);
    return out;
  }, [page, totalPages]);

  // ---------- generate & download merged label ----------
  async function downloadMergedLabel(r: ConsignmentRow) {
    try {
      // fetch DTDC label
      const res = await fetch("/api/dtdc/label", {
        method: "POST",
        body: JSON.stringify({ awb: r.awb }),
      });
      const json = await res.json();
      if (!json?.data?.[0]?.label) {
        toast.error(json?.error?.message || "DTDC label not available");
        return;
      }
      const dtdcBase64 = json.data[0].label; // assuming base64 or binary wrapped as base64

      // generate custom label (returns Uint8Array or ArrayBuffer)
      const customPdf = await generateCustomLabel({
        awb: r.awb,
        company: "VIS Pvt Ltd",
        address: "Indore, Madhya Pradesh",
        phone: "+91 9340384339",
      });

      // merge (both must be Uint8Array)
      const mergedBytes = await mergePDFs(new Uint8Array(customPdf), new Uint8Array(dtdcBase64));

      const blob = new Blob([new Uint8Array(mergedBytes)], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `LABEL_${r.awb}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Label downloaded");
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate label");
    }
  }

  // Mapping sortable columns
  function colKey(label: string) {
    const map: ColKeySortColumn = {
        AWB: "awb",
        Status: "last_status",
        Booked: "booked_on",
        Last_Update: "last_updated_on",
        Origin: "origin",
        Destination: "destination",
    };

    return map[label] ?? label;
  }

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


  // ---------- UI ----------
  return (
    <div className={loading ? "pointer-events-none opacity-50" : ""}>
      <div className="space-y-2 px-0 md:px-2 lg:px-2 py-0">
        {/* header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold">Track Consignments</h1>
            <p className="text-sm text-muted-foreground mt-1">Search, filter, manage, export & analyze your tracking data.</p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              className="bg-emerald-600 text-white hover:bg-emerald-700"
              onClick={refreshTracking}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Click me to refresh status
            </Button>

            <Button variant="outline" onClick={() => exportToExcel(rows)}>
              <DownloadCloud className="mr-2 h-4 w-4" /> Export All
            </Button>

            <Button variant="default" onClick={() => exportToExcel(rows /* filtered rows already */ , "filtered-tracking")}>
              Export Filtered
            </Button>
          </div>
        </div>

        {/* filters */}
        <Card className="shadow-sm border">
          <CardContent className="py-0 flex flex-wrap gap-4 items-center">
            <Input placeholder="Search AWB" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="w-56" />

            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
              <SelectTrigger className="w-40"><SelectValue placeholder="All" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="delivered">Delivered</SelectItem>
                <SelectItem value="in transit">In Transit</SelectItem>
                <SelectItem value="out for delivery">Out For Delivery</SelectItem>
                <SelectItem value="attempted">Attempted</SelectItem>
                <SelectItem value="held">Held Up</SelectItem>
                <SelectItem value="rto">RTO</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">From</span>
              <Input type="date" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setPage(1); }} />
              <span className="text-sm text-muted-foreground">To</span>
              <Input type="date" value={dateTo} onChange={(e) => { setDateTo(e.target.value); setPage(1); }} />
            </div>

            <Select value={tatFilter} onValueChange={(v) => { setTatFilter(v); setPage(1); }}>
              <SelectTrigger className="w-40"><SelectValue placeholder="TAT" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="warning">Warning</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
                <SelectItem value="very critical">Very Critical</SelectItem>
              </SelectContent>
            </Select>

            <div className="ml-auto flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Page Size</span>
              <Input type="number" className="w-20" value={pageSize} onChange={(e) => { setPageSize(Math.max(5, Number(e.target.value || DEFAULT_PAGE_SIZE))); setPage(1); }} />
            </div>
          </CardContent>
        </Card>

        {/* table card (fixed height wrapper) */}
        <Card className="shadow-sm border">
          <CardContent className="p-0">
          {/* Outer wrapper must lock height AND prevent ScrollArea from expanding */}
          <div className="h-[90vh] flex flex-col overflow-hidden">

            {/* Header row does NOT scroll */}
            <div className="shrink-0">
              <Table className="text-sm">
                <TableHeader className="bg-slate-50 sticky top-0 z-10">
                  <TableRow>
                    {/* --- Sortable columns --- */}
                  {[
                    "AWB",
                    "Status",
                    "Booked",
                    "Last Update",
                    "Origin",
                    "Destination",
                  ].map((col) => (
                    <TableHead
                      key={col}
                      className="cursor-pointer select-none hover:bg-muted/40"
                      onClick={() => {
                        setRows([...rows].sort((a: any, b: any) =>
                          (a[colKey(col)] ?? "").localeCompare(b[colKey(col)] ?? "")
                        ));
                      }}
                    >
                      {col} ▲▼
                    </TableHead>
                  ))}

                  <TableHead>TAT</TableHead>
                  <TableHead>Movement</TableHead>
                  <TableHead>Timeline</TableHead>
                  <TableHead></TableHead>
                  <TableHead></TableHead>
                  <TableHead></TableHead>

                  </TableRow>
                </TableHeader>
              </Table>
            </div>

            {/* Scrollable body */}
            <ScrollArea className="flex-1 overflow-auto">
              <Table className="text-sm">
                <TableBody>
                  {rows.length === 0 && (
                    <TR>
                      <TableCell colSpan={12} className="text-center py-12 text-muted-foreground">
                        {isFetching ? "Loading..." : "No results found"}
                      </TableCell>
                    </TR>
                  )}

                  {rows.map((r) => {
                    const delivered = ((r.last_status ?? "") + "").toLowerCase().includes("deliv");
                    const tat = computeTATLocal(r);
                    const move = computeMovementLocal(r);

                    return (
                      <TR key={r.awb} className={`${delivered ? "bg-green-50" : ""} hover:bg-muted/40`}>
                        <TableCell className="font-medium">{r.awb}</TableCell>
                        <TableCell>{r.last_status ?? "-"}</TableCell>
                        <TableCell>{r.booked_on ?? "-"}</TableCell>
                        <TableCell>{r.last_updated_on ?? "-"}</TableCell>
                        <TableCell>{r.origin ?? "-"}</TableCell>
                        <TableCell>{r.destination ?? "-"}</TableCell>

                        <TableCell>{tatBadge(delivered ? "Delivered" : tat, delivered)}</TableCell>
                        <TableCell>{moveBadge(delivered ? "Delivered" : move, delivered)}</TableCell>

                        {/* Timeline */}
                        <TableCell>
                          <Sheet>
                            <SheetTrigger asChild>
                              <button className="text-sm underline text-primary">View</button>
                            </SheetTrigger>

                            <SheetContent side="right" className="px-6 w-[480px] sm:w-[560px]">
                              <SheetHeader>
                                <SheetTitle>Timeline — {r.awb}</SheetTitle>
                                <SheetDescription>Complete movement history</SheetDescription>
                              </SheetHeader>

                              <div className="mt-6 max-h-[75vh] overflow-y-auto pr-2 space-y-6">
                                {r.timeline?.length ? (
                                  r.timeline.map((t: any, i: number) => (
                                    <div key={i} className="border-b pb-4">
                                      <div className="text-xs text-muted-foreground">
                                        {t.actionDate} {t.actionTime}
                                      </div>
                                      <div className="font-semibold">{t.action}</div>
                                      <div className="text-sm text-muted-foreground">
                                        {t.origin || t.destination}
                                      </div>
                                      {t.remarks && (
                                        <div className="text-xs text-muted-foreground mt-1">
                                          {t.remarks}
                                        </div>
                                      )}
                                    </div>
                                  ))
                                ) : (
                                  <p className="text-muted-foreground">No timeline available.</p>
                                )}
                              </div>
                            </SheetContent>
                          </Sheet>
                        </TableCell>

                        {/* PDF */}
                        <TableCell>
                          <Button size="sm" variant="outline" onClick={() => downloadMergedLabel(r)}>
                            PDF
                          </Button>
                        </TableCell>

                        {/* Details */}
                        <TableCell>
                          <Sheet>
                            <SheetTrigger asChild>
                              <Button size="sm" variant="secondary">Details</Button>
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
                                          <div className="text-xs text-muted-foreground">
                                            {t.actionDate} {t.actionTime}
                                          </div>
                                          <div className="font-medium">{t.action}</div>
                                          <div className="text-sm text-muted-foreground">
                                            {t.origin || t.destination}
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    <p className="text-muted-foreground">No timeline available.</p>
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

        {/* Pagination wrapper (OUTSIDE the Card containing the ScrollArea) */}
        <div className="mt-6 flex items-center justify-between w-full">
          <div className="text-sm text-muted-foreground">
            Showing {rows.length} of {totalCount}
          </div>

          <div className="flex items-center gap-2">
            <Button size="sm" variant="ghost" disabled={page === 1} onClick={() => { setPage(1) }}>
              First
            </Button>

            <Button size="sm" variant="ghost" disabled={page === 1} onClick={() => { setPage((p) => Math.max(1, p - 1)) }}>
              Prev
            </Button>

            {pageNumbers[0] > 1 && <span className="px-1">…</span>}

            {pageNumbers.map((p) => (
              <button
                key={p}
                onClick={() => { setPage(p); fetchPage(true); }}
                className={`px-3 py-1 rounded ${p === page ? "bg-primary text-white" : "bg-white border"}`}
              >
                {p}
              </button>
            ))}

            {pageNumbers[pageNumbers.length - 1] < totalPages && <span className="px-1">…</span>}

            <Button size="sm" variant="ghost" disabled={page === totalPages} onClick={() => { setPage((p) => Math.min(totalPages, p + 1)) }}>
              Next
            </Button>

            <Button size="sm" variant="ghost" disabled={page === totalPages} onClick={() => { setPage(totalPages) }}>
              Last
            </Button>

            {/* quick jump */}
            <div className="ml-4 flex items-center gap-2">
              <span className="text-sm">Jump</span>
              <Input
                type="number"
                min={1}
                max={totalPages}
                className="w-20"
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