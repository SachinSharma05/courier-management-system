"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";

type DbRow = {
  awb: string;
  client_id: number;
  provider: string;
  current_status: string;
  last_status_at: string | null;
};

export default function DtdcSuperTrackPage() {
  const [awb, setAwb] = useState("");
  const [rows, setRows] = useState<DbRow[]>([]);
  const [liveData, setLiveData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  /* -----------------------------
     1️⃣ TRACK FROM DB
  ----------------------------- */
  async function trackFromDb() {
    if (!awb.trim()) {
      toast.error("Enter AWB number");
      return;
    }

    setLoading(true);
    setLiveData(null);

    const res = await fetch(`/api/admin/dtdc/super-track?awb=${awb.trim()}`);
    const json = await res.json();

    if (!json.ok || !json.rows?.length) {
      toast.error("AWB not found in database");
      setRows([]);
    } else {
      setRows(json.rows);
    }

    setLoading(false);
  }

  /* -----------------------------
     2️⃣ LIVE TRACK (DTDC)
  ----------------------------- */
  async function liveTrack(row: DbRow) {
    toast.loading("Live tracking…", { id: row.awb });

    const res = await fetch("/api/admin/dtdc/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        provider: "dtdc",
        clientId: row.client_id,
        consignments: [row.awb],
      }),
    });

    const json = await res.json();

    if (!json.ok || !json.results?.length) {
      toast.error("Live tracking failed", { id: row.awb });
      return;
    }

    toast.success("Live tracking updated", { id: row.awb });

    // 🔥 IMPORTANT: show response
    setLiveData(json.results[0].parsed);
  }

  return (
    <div className="p-6 space-y-6 bg-slate-50 min-h-screen">
      {/* HEADER + BREADCRUMB ROW */}
      <div className="flex items-start justify-between gap-4">
        {/* LEFT: Title + subtitle */}
        <div>
          <h1 className="text-2xl font-bold leading-tight">
            Track DTDC Shipments
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Here you can track DTDC shipments using AWB numbers stored in the database.
          </p>
        </div>

        {/* RIGHT: Breadcrumb */}
        <nav className="text-sm text-gray-500 flex gap-2 items-center whitespace-nowrap">
          <Link href="/admin" className="hover:underline">Home</Link>
          <span>/</span>
          <Link href="/admin/dtdc" className="hover:underline">DTDC Dashboard</Link>
          <span>/</span>
          <span className="text-gray-700 font-medium">Track</span>
        </nav>
      </div>

      {/* INPUT */}
      <div className="flex gap-3 max-w-xl">
        <Input
          placeholder="Enter DTDC AWB"
          value={awb}
          onChange={(e) => setAwb(e.target.value)}
        />
        <Button onClick={trackFromDb} disabled={loading}>
          {loading ? "Tracking…" : "Track"}
        </Button>
      </div>

      {/* DB RESULT */}
      {rows.length > 0 && (
        <div className="bg-white border rounded-xl overflow-hidden">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-3 text-left">AWB</th>
                <th className="p-3">Status</th>
                <th className="p-3">Last Updated</th>
                <th className="p-3 text-right">Action</th>
              </tr>
            </thead>

            <tbody>
              {rows.map((row) => (
                <tr key={row.awb} className="border-t">
                  <td className="p-3 font-medium">{row.awb}</td>
                  <td className="p-3">{row.current_status}</td>
                  <td className="p-3">
                    {row.last_status_at
                      ? new Date(row.last_status_at).toLocaleString()
                      : "-"}
                  </td>
                  <td className="p-3 text-right">
                    <Button
                      size="sm"
                      className="bg-blue-600 text-white hover:bg-blue-700"
                      onClick={() => liveTrack(row)}
                    >
                      Live Track
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* LIVE TRACK VIEW */}
      {liveData && (
        <div className="space-y-6">

          {/* SUMMARY ROW */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            {/* SHIPMENT SUMMARY */}
            <div className="bg-white border rounded-xl p-4">
              <h3 className="font-semibold mb-3">Shipment Summary</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div><b>AWB:</b> {liveData.header.shipmentNo}</div>
                <div><b>Status:</b> {liveData.header.currentStatus}</div>
                <div><b>Origin:</b> {liveData.header.origin}</div>
                <div><b>Destination:</b> {liveData.header.destination}</div>
                <div><b>Booked:</b> {liveData.header.bookedOn}</div>
                <div><b>Last Update:</b> {liveData.header.lastUpdatedOn}</div>
              </div>
            </div>

            {/* TRACKING SUMMARY */}
            <div className="bg-white border rounded-xl p-4">
              <h3 className="font-semibold mb-3">Tracking Summary</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div><b>Ref No:</b> {liveData.raw.trackHeader.strRefNo}</div>
                <div><b>Product:</b> {liveData.raw.trackHeader.strCNProduct}</div>
                <div><b>Client Code:</b> {liveData.raw.trackHeader.strCNActCustCode}</div>
                <div><b>Expected Delivery:</b> {liveData.raw.trackHeader.strExpectedDeliveryDate}</div>
              </div>
            </div>
          </div>

          {/* TIMELINE */}
          <div className="bg-white border rounded-xl">
            <h3 className="font-semibold p-4 border-b">
              Tracking Timeline
            </h3>

            <div className="max-h-[420px] overflow-y-auto divide-y">
              {liveData.timeline.map((t: any, i: number) => (
                <div key={i} className="p-4 text-sm">
                  <div className="font-medium text-blue-700">
                    {t.strAction}
                  </div>
                  <div className="text-gray-600">
                    {t.strOrigin || t.strDestination}
                  </div>
                  <div className="text-xs text-gray-500">
                    {t.strActionDate} {t.strActionTime}
                  </div>
                  {t.sTrRemarks && (
                    <div className="text-xs text-gray-500 mt-1">
                      {t.sTrRemarks}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
