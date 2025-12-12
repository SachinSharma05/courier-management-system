"use client";

import { useState } from "react";
import * as XLSX from "xlsx";

export default function DelhiveryBulkTrackPage() {
  const [fileName, setFileName] = useState("");
  const [processing, setProcessing] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [progress, setProgress] = useState(0);

  async function handleUpload(e: any) {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setProcessing(true);
    setResults([]);
    setProgress(0);

    const data = await file.arrayBuffer();
    const workbook = XLSX.read(data);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(sheet);

    // Expecting column named: Waybill
    const awbs = rows
      .map((r: any) => r.Waybill || r.waybill || r.AWB || r.awb)
      .filter(Boolean);

    if (awbs.length === 0) {
      alert("No AWB column found. Expected column: Waybill");
      setProcessing(false);
      return;
    }

    const temp: any[] = [];

    for (let i = 0; i < awbs.length; i++) {
      const awb = awbs[i];

      const r = await fetch(`/api/admin/delhivery/track/db?awb=${awb}`);
      const j = await r.json();

      temp.push({
        awb,
        success: j.success,
        status: j.status || j.error,
        live: j.live || null,
      });

      setResults([...temp]);
      setProgress(Math.round(((i + 1) / awbs.length) * 100));
    }

    setProcessing(false);
  }

  return (
    <div className="p-8 space-y-8">
      <h1 className="text-2xl font-bold">Bulk Track Delhivery Shipments</h1>

      {/* Upload Box */}
      <div className="p-6 bg-white rounded-xl border shadow-sm space-y-4">
        <p className="text-gray-600">Upload an Excel file containing AWB numbers (column: Waybill)</p>

        <input
          type="file"
          accept=".xlsx,.xls,.csv"
          onChange={handleUpload}
          className="border p-2 rounded w-full"
        />

        {fileName && <p className="text-sm text-gray-500">File: {fileName}</p>}

        {processing && (
          <div className="mt-4">
            <p className="font-medium">Tracking in progress… ({progress}%)</p>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div
                className="bg-indigo-600 h-2 rounded-full transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Results Table */}
      {results.length > 0 && (
        <div className="p-6 bg-white rounded-xl border shadow-sm">
          <h2 className="text-lg font-semibold mb-4">Results</h2>

          <table className="w-full border text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-2 border">AWB</th>
                <th className="p-2 border">Status</th>
                <th className="p-2 border">Success</th>
                <th className="p-2 border">Details</th>
              </tr>
            </thead>

            <tbody>
              {results.map((r, i) => (
                <tr key={i}>
                  <td className="border p-2">{r.awb}</td>

                  <td className="border p-2">
                    <span
                      className={`
                        px-2 py-1 rounded text-xs font-medium
                        ${
                          r.status?.toLowerCase().includes("deliver")
                            ? "bg-green-100 text-green-700"
                            : r.status?.toLowerCase().includes("transit")
                            ? "bg-blue-100 text-blue-700"
                            : r.status?.toLowerCase().includes("rto")
                            ? "bg-red-100 text-red-700"
                            : "bg-yellow-100 text-yellow-700"
                        }
                      `}
                    >
                      {r.status}
                    </span>
                  </td>

                  <td className="border p-2 text-center">
                    {r.success ? "✔" : "✖"}
                  </td>

                  <td className="border p-2">
                    {r.live ? (
                      <details className="cursor-pointer">
                        <summary className="text-indigo-600">View Timeline</summary>

                        <div className="mt-2 space-y-3 max-h-60 overflow-y-auto">
                          {r.live?.ShipmentData?.[0]?.Shipment?.Scans?.map(
                            (sc: any, idx: number) => {
                              const s = sc.ScanDetail;
                              return (
                                <div
                                  key={idx}
                                  className="p-3 border rounded bg-gray-50"
                                >
                                  <div className="flex justify-between">
                                    <strong>{s.Scan}</strong>
                                    <span className="text-xs text-gray-500">
                                      {new Date(s.ScanDateTime).toLocaleString()}
                                    </span>
                                  </div>
                                  <p className="text-sm">{s.Instructions}</p>
                                  <p className="text-xs text-gray-600">
                                    Location: {s.ScannedLocation}
                                  </p>
                                </div>
                              );
                            }
                          )}
                        </div>
                      </details>
                    ) : (
                      "—"
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