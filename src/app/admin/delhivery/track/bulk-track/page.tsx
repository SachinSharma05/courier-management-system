"use client";

import { useState } from "react";
import * as XLSX from "xlsx";
import { UploadCloud, FileSpreadsheet, Loader2 } from "lucide-react";

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

    const awbRows = rows
    .map((r: any) => {
      const awb =
        r.Waybill ??
        r.waybill ??
        r.AWB ??
        r.awb ??
        r["Waybill No"] ??
        r["AWB No"] ??
        null;

      const reference =
        r.reference_no ??
        r.Reference_No ??
        r["Reference No"] ??
        r["reference no"] ??
        r["REFERENCE NO"] ??
        null;

      return awb || reference
        ? {
            awb: awb ? String(awb).trim() : null,
            reference_number: reference ? String(reference).trim() : null,
          }
        : null;
    })
    .filter(Boolean);

    if (!awbRows.length) {
      alert("No Waybill / AWB / Reference No column found");
      setProcessing(false);
      return;
    }

    // 🔑 ONE API CALL
    const res = await fetch("/api/admin/delhivery/track/db", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        clientId: 1,   // ✅ system/admin
        rows: awbRows,
      }),
    });

    const json = await res.json();

    if (json.success) {
      setResults(json.results);
      setProgress(100);
    } else {
      alert(json.error || "Bulk tracking failed");
    }

    setProcessing(false);
  }

  return (
    <div className="p-8 space-y-8">
      <div className="flex items-center gap-3">
        <FileSpreadsheet className="text-indigo-600" size={26} />
        <h1 className="text-2xl font-bold">Bulk Track Delhivery Shipments</h1>
      </div>

      <div className="p-6 bg-white rounded-xl border shadow-sm space-y-4">
        <label className="w-full border rounded-xl bg-gray-50 hover:bg-gray-100 p-6 flex flex-col items-center justify-center cursor-pointer">
          <UploadCloud size={32} className="text-indigo-600 mb-2" />
          <span className="font-medium">
            {fileName || "Upload Excel file"}
          </span>
          <input type="file" accept=".xlsx,.xls,.csv" hidden onChange={handleUpload} />
        </label>

        {processing && (
          <div className="flex items-center gap-2">
            <Loader2 className="animate-spin" size={18} />
            Processing…
          </div>
        )}
      </div>

      {results.length > 0 && (
        <div className="bg-white border rounded-xl p-6">
          <table className="w-full text-sm border">
            <thead className="bg-gray-100">
              <tr>
                <th className="border p-2">AWB</th>
                <th className="border p-2">Status</th>
                <th className="border p-2">Success</th>
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
