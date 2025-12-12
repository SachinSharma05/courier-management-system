"use client";

import Link from "next/link";
import { useState } from "react";
import * as XLSX from "xlsx";

export default function TrackShipment() {
  const [awb, setAwb] = useState("");
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const [uploading, setUploading] = useState(false);
  const [bulkResults, setBulkResults] = useState<any[]>([]);

  async function track() {
    setLoading(true);
    setResult(null);

    const r = await fetch(`/api/admin/delhivery/track?awb=${awb}`);
    setResult(await r.json());

    setLoading(false);
  }

  // ------------------------------------------
  // EXCEL UPLOAD HANDLER
  // ------------------------------------------
  function handleExcelUpload(e: any) {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);

    const reader = new FileReader();

    reader.onload = async (evt: any) => {
      const bstr = evt.target.result;
      const workbook = XLSX.read(bstr, { type: "binary" });

      // Use first sheet
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];

      const json: any[] = XLSX.utils.sheet_to_json(sheet);

      // Try to find AWB column automatically
      const possibleColumns = ["Waybill", "AWB", "Reference No.", "Tracking Number", "WayBillNumber"];

      let foundColumn = possibleColumns.find((c) => json[0]?.[c] !== undefined);

      if (!foundColumn) {
        alert("No 'Waybill' or AWB column found in Excel.");
        setUploading(false);
        return;
      }

      // Extract AWBs
      const awbs = json
        .map((row) => row[foundColumn])
        .filter(Boolean)
        .map((x) => String(x).trim());

      if (awbs.length === 0) {
        alert("No AWBs found in Excel.");
        setUploading(false);
        return;
      }

      // Now call bulk SYNC tracking API
      const res = await fetch("/api/admin/delhivery/track/sync", {
        method: "POST",
        body: JSON.stringify({ awbs }),
      });

      const j = await res.json();
      setBulkResults(j.results || []);

      setUploading(false);
    };

    reader.readAsBinaryString(file);
  }

  return (
  <div className="p-8 space-y-6">
    <h1 className="text-2xl font-bold">Track Delhivery Shipments</h1>

    {/* Single Tracking */}
    <div className="p-6 bg-white border rounded-xl shadow-sm space-y-3">
      <input
        className="w-full p-3 border rounded"
        placeholder="Enter AWB"
        value={awb}
        onChange={(e) => setAwb(e.target.value)}
      />

      <button
        onClick={track}
        className="px-4 py-2 bg-indigo-600 text-white rounded"
        disabled={loading}
      >
        {loading ? "Tracking…" : "Track Shipment"}
      </button>

      <Link
        href="/admin/delhivery/track/bulk-track"
        className="px-4 py-2 bg-black text-white rounded hover:bg-gray-800"
      >
        Bulk Tracking
      </Link>

      {/* SINGLE TRACKING RESULT */}
      {result?.live?.ShipmentData && (
        <div className="mt-6 p-6 bg-white rounded-xl border shadow-sm space-y-6">

          {/* Shipment Header */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">Shipment Summary</h2>
              <p className="text-gray-600">AWB: {awb}</p>
            </div>

            <span
              className={`
                px-4 py-1 rounded-full text-sm font-medium
                ${result.status === "Delivered" ? "bg-green-100 text-green-700" :
                  result.status === "In Transit" ? "bg-blue-100 text-blue-700" :
                  result.status === "RTO" ? "bg-red-100 text-red-700" :
                  "bg-yellow-100 text-yellow-700"}
              `}
            >
              {result.status}
            </span>
          </div>

          {/* Sender/Receiver Info */}
          {(() => {
            const shipment = result.live.ShipmentData?.[0]?.Shipment;
            if (!shipment) return null;

            return (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 border rounded-lg bg-gray-50">
                  <h3 className="font-semibold mb-2">Sender</h3>
                  <p className="text-sm font-medium">{shipment.SenderName}</p>
                  <p className="text-sm text-gray-600">{shipment.Origin}</p>
                </div>

                <div className="p-4 border rounded-lg bg-gray-50">
                  <h3 className="font-semibold mb-2">Receiver</h3>
                  <p className="text-sm font-medium">{shipment.Consignee?.Name}</p>
                  <p className="text-sm text-gray-600">{shipment.Destination}</p>
                  <p className="text-sm text-gray-600">Pincode: {shipment.Consignee?.PinCode}</p>
                </div>
              </div>
            );
          })()}

          {/* Timeline Section */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Shipment Timeline</h3>

            <div className="max-h-96 overflow-y-auto pr-2 space-y-4">
              {result.live.ShipmentData?.[0]?.Shipment?.Scans?.map((scan: any, index: number) => {
                const s = scan.ScanDetail;
                return (
                  <div
                    key={index}
                    className="p-4 border rounded-lg bg-gray-50 hover:bg-gray-100 transition"
                  >
                    <div className="flex justify-between">
                      <p className="font-medium">{s.Scan}</p>
                      <p className="text-sm text-gray-500">{new Date(s.ScanDateTime).toLocaleString()}</p>
                    </div>

                    <p className="text-sm text-gray-700">{s.Instructions}</p>

                    <p className="text-sm mt-1 text-gray-500">
                      Location: {s.ScannedLocation}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  </div>
);
}