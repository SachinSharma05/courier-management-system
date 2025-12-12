"use client";

import Link from "next/link";
import { useState } from "react";
import * as XLSX from "xlsx";
import { Search, Upload } from "lucide-react";

export default function TrackShipment() {
  const [awb, setAwb] = useState("");
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  async function track() {
    if (!awb.trim()) return;

    setLoading(true);
    setResult(null);

    const r = await fetch(`/api/admin/delhivery/track?awb=${awb}`);
    setResult(await r.json());

    setLoading(false);
  }

  return (
    <div className="p-8 space-y-6">
      <h1 className="text-2xl font-bold">Track Delhivery Shipments</h1>

      {/* Search / Buttons Row */}
      <div className="p-6 bg-white border rounded-xl shadow-sm space-y-4">

        <div className="flex flex-col md:flex-row md:items-center md:gap-4 space-y-3 md:space-y-0">
          <input
            className="flex-1 p-3 border rounded-lg"
            placeholder="Enter AWB"
            value={awb}
            onChange={(e) => setAwb(e.target.value)}
          />

          <button
            onClick={track}
            disabled={loading}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg flex items-center gap-2 hover:bg-indigo-700"
          >
            <Search size={16} />
            {loading ? "Tracking…" : "Track Shipment"}
          </button>

          <Link
            href="/admin/delhivery/track/bulk-track"
            className="px-4 py-2 bg-black text-white rounded-lg flex items-center gap-2 hover:bg-gray-800"
          >
            <Upload size={16} />
            Bulk Tracking
          </Link>
        </div>
      </div>

      {/* EMPTY STATE */}
      {!loading && !result && (
        <div className="p-8 text-gray-500 text-center">
          Enter an AWB number to view tracking details.
        </div>
      )}

      {/* TRACKING RESULT */}
      {result?.live?.ShipmentData && (
        <div className="p-6 bg-white border rounded-xl shadow-sm space-y-8">
          {/* Summary Header */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">Shipment Summary</h2>
              <p className="text-gray-600">AWB: {awb}</p>
            </div>

            {/* Status badge */}
            <span
              className={`px-4 py-1 rounded-full text-sm font-medium ${
                result.status === "Delivered"
                  ? "bg-green-100 text-green-700"
                  : result.status === "In Transit"
                  ? "bg-blue-100 text-blue-700"
                  : result.status === "RTO"
                  ? "bg-red-100 text-red-700"
                  : "bg-yellow-100 text-yellow-700"
              }`}
            >
              {result.status}
            </span>
          </div>

          {/* Sender / Receiver Info */}
          {(() => {
            const shipment = result.live.ShipmentData?.[0]?.Shipment;
            if (!shipment) return null;

            return (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 border rounded-lg bg-gray-50">
                  <h3 className="font-semibold mb-2">Sender</h3>
                  <p className="font-medium">{shipment.SenderName}</p>
                  <p className="text-sm text-gray-600">{shipment.Origin}</p>
                </div>

                <div className="p-4 border rounded-lg bg-gray-50">
                  <h3 className="font-semibold mb-2">Receiver</h3>
                  <p className="font-medium">{shipment.Consignee?.Name}</p>
                  <p className="text-sm text-gray-600">{shipment.Destination}</p>
                  <p className="text-sm text-gray-600">
                    Pincode: {shipment.Consignee?.PinCode}
                  </p>
                </div>
              </div>
            );
          })()}

          {/* Timeline */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Shipment Timeline</h3>

            <div className="max-h-96 overflow-y-auto space-y-4 pr-2">

              {result.live.ShipmentData?.[0]?.Shipment?.Scans?.map(
                (scan: any, i: number) => {
                  const s = scan.ScanDetail;

                  return (
                    <div
                      key={i}
                      className="relative border-l-4 border-indigo-500 pl-4 py-2 bg-gray-50 rounded-lg shadow-sm"
                    >
                      {/* Dot */}
                      <div className="absolute -left-2 top-3 h-3 w-3 bg-indigo-500 rounded-full"></div>

                      <div className="flex justify-between">
                        <p className="font-medium">{s.Scan}</p>
                        <p className="text-sm text-gray-500">
                          {new Date(s.ScanDateTime).toLocaleString()}
                        </p>
                      </div>

                      <p className="text-sm">{s.Instructions}</p>

                      {s.ScannedLocation && (
                        <p className="text-xs mt-1 text-gray-500">
                          Location: {s.ScannedLocation}
                        </p>
                      )}
                    </div>
                  );
                }
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
