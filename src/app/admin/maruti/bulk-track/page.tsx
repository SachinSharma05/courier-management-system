"use client";

import { useState } from "react";
import * as XLSX from "xlsx";
import { UploadCloud, FileSpreadsheet, Loader2 } from "lucide-react";

export default function MarutiBulkTrackPage() {
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

    // 1️⃣ Read Excel
    const data = await file.arrayBuffer();
    const workbook = XLSX.read(data);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows: any[] = XLSX.utils.sheet_to_json(sheet);

    // 2️⃣ Extract AWBs safely
    const awbs = Array.from(
      new Set(
        rows
          .map(r => r.AWB || r.awb || r.Waybill || r.waybill)
          .filter(Boolean)
          .map(a => String(a).trim())
      )
    );

    if (!awbs.length) {
      alert("No AWB column found (AWB / Waybill)");
      setProcessing(false);
      return;
    }

    // 3️⃣ SINGLE API CALL
    const res = await fetch("/api/admin/maruti/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ awbs }),
    });

    const json = await res.json();

    setResults(json.results || []);
    setProgress(100);
    setProcessing(false);
  }

  return (
    <div className="p-8 space-y-8">
      <div className="flex items-center gap-3">
        <FileSpreadsheet className="text-indigo-600" size={26} />
        <h1 className="text-2xl font-bold">Maruti – Bulk Track Shipments</h1>
      </div>

      {/* Upload */}
      <div className="p-6 bg-white rounded-xl border shadow-sm space-y-4">
        <p className="text-gray-600">
          Upload Excel with <b>AWB / Waybill</b> column
        </p>

        <label className="w-full border rounded-xl bg-gray-50 hover:bg-gray-100 p-6 flex flex-col items-center cursor-pointer">
          <UploadCloud size={32} className="text-indigo-600 mb-2" />
          <span className="font-medium">
            {fileName || "Click to upload Excel file"}
          </span>
          <input
            type="file"
            accept=".xlsx,.xls,.csv"
            className="hidden"
            onChange={handleUpload}
          />
        </label>

        {processing && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 font-medium">
              <Loader2 className="animate-spin" size={18} />
              Tracking in progress… {progress}%
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-indigo-600 h-2 rounded-full"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Results */}
      {results.length > 0 && (
        <div className="p-6 bg-white rounded-xl border shadow-sm">
          <h2 className="text-lg font-semibold mb-4">Results</h2>

          <table className="w-full border text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-2 border">AWB</th>
                <th className="p-2 border">Status</th>
                <th className="p-2 border">Success</th>
              </tr>
            </thead>
            <tbody>
              {results.map((r, i) => (
                <tr key={i}>
                  <td className="border p-2">{r.awb}</td>
                  <td className="border p-2">{r.status || r.error}</td>
                  <td className="border p-2 text-center">
                    {r.success ? "✔" : "✖"}
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