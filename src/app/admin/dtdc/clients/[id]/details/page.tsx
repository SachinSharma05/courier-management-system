"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { usePathname, useSearchParams } from "next/navigation";
import { 
  CheckCircle, 
  Undo2, 
  Truck, 
  Send,
  ClipboardCheck,
  Clock,
  RefreshCw
} from "lucide-react";

// LocalStorage Helpers (unchanged)
const CACHE_KEY = "dtdc_awb_cache";
const CACHE_DURATION_MS = 24 * 60 * 60 * 1000;

function loadCache() {
  try {
    return JSON.parse(localStorage.getItem(CACHE_KEY) || "{}");
  } catch {
    return {};
  }
}

function saveCache(data: any) {
  localStorage.setItem(CACHE_KEY, JSON.stringify(data));
}

/* ------------------ Helpers that return ONLY allowed shadcn Badge variants ------------------ */
/* Allowed: "default" | "destructive" | "outline" | "secondary" */

function getTatVariant(t: string | undefined): "default" | "destructive" | "outline" | "secondary" {
  if (!t) return "default";
  if (t === "On Time") return "secondary";
  if (t === "Warning") return "outline";
  return "destructive"; // Critical / Very Critical -> destructive
}

function getMovementVariant(m: string | undefined): "default" | "destructive" | "outline" | "secondary" {
  if (!m) return "default";
  if (m === "On Time") return "secondary";
  if (m.includes("72") || m.toLowerCase().includes("stuck")) return "destructive";
  if (m.includes("48")) return "outline";
  if (m.includes("24")) return "outline";
  return "default";
}

/* ------------------------------------------------------------------------------------------- */

export default function DetailPage() {
  const searchParams = useSearchParams();
  const pathname = usePathname();

  // get awb from query
  const awb = searchParams.get("awb");

  // extract clientId from URL
  const segments = pathname.split("/");
  const clientId = segments[segments.indexOf("clients") + 1];

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  async function fetchDetail(forceRefresh = false) {
    const cache = loadCache();

    if (!awb) {
      console.error("AWB missing from URL");
      setLoading(false);
      return;
    }

    if (
      !forceRefresh &&
      awb &&                                   // ensures awb is not null
      cache[awb] &&
      Date.now() - cache[awb].timestamp < CACHE_DURATION_MS
    ) {
      setData(cache[awb].data);
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`/api/admin/clients/${clientId}/details?awb=${awb}`);
      const json = await res.json();

      if (json.success) {
        cache[awb] = { timestamp: Date.now(), data: json };
        saveCache(cache);
      }

      setData(json);
    } catch (error) {
      console.error(error);
      setData(null);
    }

    setLoading(false);
  }

  useEffect(() => {
    fetchDetail();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [awb]);

  if (loading) return <LoadingUI />;
  if (!data?.success) return <ErrorUI message={data?.message || "No data found"} />;

  const { summary, currentStatus, timeline, reports, tat, movement, consignment } = data;

  // Build display labels with safe fallbacks
  const tatLabel = tat ?? "Unknown";
  const movementLabel = movement ?? "Unknown";

  return (
  <div className="p-4 md:p-6 lg:p-8 space-y-8">

    {/* HEADER */}
    <div className="flex items-center justify-between">
      <div>
        <nav className="text-sm text-muted-foreground mb-2 flex items-center gap-2">
          <Link href="/admin" className="hover:text-primary">Dashboard</Link>
          <span>/</span>
          <span className="hover:text-primary">Track</span>
          <span>/</span>
          <span className="font-semibold text-primary">{awb}</span>
        </nav>

        <h1 className="text-3xl font-bold tracking-tight">
          Shipment Details — <span className="text-blue-600">{awb}</span>
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Complete tracking, timeline, and history for this consignment.
        </p>
      </div>

      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => { setLoading(true); fetchDetail(true); }}
          className="hover:bg-blue-50"
        >
          <RefreshCw className="mr-2 h-4 w-4" /> Refresh
        </Button>

        <Link href="/admin/dtdc">
          <Button variant="outline" size="sm" className="hover:bg-slate-100">
            Back
          </Button>
        </Link>
      </div>
    </div>

    {/* 2-Column Layout */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

      {/* ---------- LEFT SIDE (All Cards) ---------- */}
      <div className="space-y-6">

        {/* SUMMARY */}
        <Card className="rounded-xl shadow-md border">
          <CardHeader className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar>
                <AvatarFallback>{(summary?.awb || "").slice(0, 2)}</AvatarFallback>
              </Avatar>
              <CardTitle className="text-lg font-semibold">Summary</CardTitle>
            </div>

            <div className="flex gap-2">
              <Badge variant={getTatVariant(String(tatLabel))}>TAT: {tatLabel}</Badge>
              <Badge variant={getMovementVariant(String(movementLabel))}>
                {movementLabel}
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="space-y-2">
            <Row label="AWB" value={summary?.awb} />
            <Row label="Origin" value={summary?.origin} />
            <Row label="Destination" value={summary?.destination} />
            <Row label="Booked On" value={summary?.bookedOn} />
            <Row label="Last Updated" value={summary?.lastUpdatedOn} />
            <Row label="Pieces" value={summary?.pieces ?? "-"} />
          </CardContent>
        </Card>

        {/* CURRENT STATUS */}
        <Card className="rounded-xl shadow-md border">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Current Status</CardTitle>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-xs text-muted-foreground">Status</div>
                <div className="font-semibold text-lg">{currentStatus?.status ?? "-"}</div>

                <div className="text-xs text-muted-foreground mt-1">
                  {currentStatus?.date} {currentStatus?.time}
                </div>
              </div>

              <div className="text-right">
                <div className="text-xs text-muted-foreground">Location</div>
                <div className="font-medium">{currentStatus?.location ?? "-"}</div>

                {currentStatus?.remarks && (
                  <div className="text-xs text-muted-foreground mt-1">
                    {currentStatus?.remarks}
                  </div>
                )}
              </div>
            </div>

            <Separator />

            <div className="flex flex-wrap gap-2">
              <Badge variant="outline">Last Scan: {reports?.lastScanLocation ?? "-"}</Badge>
              <Badge variant={reports?.delivered ? "secondary" : "default"}>Delivered</Badge>
              <Badge variant={reports?.outForDelivery ? "secondary" : "default"}>OFD</Badge>
              <Badge variant={reports?.rto ? "destructive" : "default"}>RTO</Badge>
            </div>
          </CardContent>
        </Card>

        {/* REPORTS & ACTIONS */}
        <Card className="rounded-xl shadow-md border">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Reports & Actions</CardTitle>
          </CardHeader>

          <CardContent className="space-y-4">

            <div className="grid grid-cols-2 gap-3">
              <SmallStat label="Delivered" value={reports?.delivered ? "Yes" : "No"} />
              <SmallStat label="Out For Delivery" value={reports?.outForDelivery ? "Yes" : "No"} />
              <SmallStat label="RTO" value={reports?.rto ? "Yes" : "No"} />
              <SmallStat label="Delayed" value={reports?.delayed ? "Yes" : "No"} />
            </div>

            <div className="flex items-center gap-3">
              <Button size="sm" onClick={() => navigator.clipboard.writeText(awb!)}>
                <ClipboardCheck className="mr-2 h-4 w-4" /> Copy AWB
              </Button>
            </div>

          </CardContent>
        </Card>

        {/* CONSIGNMENT INFO */}
        <Card className="rounded-xl shadow-md border">
          <CardHeader>
            <CardTitle className="text-lg">Consignment Info</CardTitle>
          </CardHeader>

          <CardContent className="space-y-2">
            <Row label="Origin" value={consignment?.origin} />
            <Row label="Destination" value={consignment?.destination} />
            <Row label="Booked On" value={consignment?.bookedOn} />
            <Row label="Last Updated" value={consignment?.lastUpdated} />
            <Row label="Status" value={consignment?.lastStatus} />
          </CardContent>
        </Card>

      </div>

      {/* ---------- RIGHT SIDE (TIMELINE ONLY) ---------- */}
      <Card className="rounded-xl shadow-md border h-[140vh] flex flex-col">
        <CardHeader className="sticky top-0 bg-white z-10 pb-2">
          <CardTitle className="text-lg font-semibold">Timeline</CardTitle>
        </CardHeader>

        <CardContent className="flex-1 overflow-hidden">
          <ScrollArea className="h-full pr-4">
            {timeline?.length ? (
              <div className="relative pl-6">

                {/* Line */}
                <div className="absolute left-5 top-0 bottom-0 w-[2px] bg-slate-200"></div>

                <div className="space-y-6">
                  {timeline.map((t: any, i: number) => {

                    const type = (t.action || "").toLowerCase();

                    const icon =
                      type.includes("deliver") ? <CheckCircle className="h-4 w-4" /> :
                      type.includes("rto") ? <Undo2 className="h-4 w-4" /> :
                      type.includes("out for delivery") ? <Truck className="h-4 w-4" /> :
                      type.includes("dispatch") ? <Send className="h-4 w-4" /> :
                      <Clock className="h-4 w-4" />;

                    const color =
                      type.includes("deliver") ? "bg-green-500" :
                      type.includes("rto") ? "bg-red-500" :
                      type.includes("out for delivery") ? "bg-amber-500" :
                      type.includes("dispatch") ? "bg-blue-500" :
                      "bg-slate-400";

                    return (
                      <div key={i} className="relative flex gap-4">

                        {/* Node */}
                        <div className="relative">
                          <div className={`h-8 w-8 rounded-full flex items-center justify-center text-white shadow-md border ${color}`}>
                            {icon}
                          </div>

                          {i < timeline.length - 1 && (
                            <div className="absolute top-8 left-1/2 -translate-x-1/2 w-[2px] h-6 bg-slate-300"></div>
                          )}
                        </div>

                        {/* Details */}
                        <div className="flex-1 pb-4 border-b border-slate-100">
                          <div className="flex items-center justify-between">
                            <div className="font-semibold">{t.action}</div>
                            <span className="text-xs text-muted-foreground">{t.time}</span>
                          </div>

                          <div className="text-sm text-muted-foreground mt-1">
                            {t.origin || t.destination}
                          </div>

                          {t.remarks && (
                            <div className="text-xs text-muted-foreground mt-2">{t.remarks}</div>
                          )}

                          <div className="text-xs mt-2 font-medium text-slate-600">
                            {t.date}
                          </div>
                        </div>

                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No timeline available</p>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

    </div>

  </div>
);

}

/* -------------------------- small UI helpers (shadcn style) ------------------------- */

function Row({ label, value }: { label: string; value: any }) {
  return (
    <div className="flex justify-between text-sm">
      <div className="text-muted-foreground">{label}</div>
      <div className="font-medium">{value ?? "-"}</div>
    </div>
  );
}

function SmallStat({ label, value, positive, negative }: any) {
  return (
    <div className="p-3 bg-muted/40 rounded border">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className={`mt-1 font-semibold ${positive ? "text-green-600" : negative ? "text-red-600" : "text-foreground"}`}>{value}</div>
    </div>
  );
}

/* -------------------------- Loading & Error (shadcn style) ------------------------- */

function LoadingUI() {
  return (
    <div className="p-6">
      <Card>
        <CardContent>
          <div className="animate-pulse space-y-2">
            <div className="h-6 bg-slate-200 rounded w-1/3"></div>
            <div className="h-4 bg-slate-200 rounded w-1/2"></div>
            <div className="h-4 bg-slate-200 rounded w-full"></div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function ErrorUI({ message }: any) {
  return (
    <div className="p-6">
      <Card>
        <CardContent>
          <div className="text-red-600 font-semibold">Error: {message}</div>
        </CardContent>
      </Card>
    </div>
  );
}