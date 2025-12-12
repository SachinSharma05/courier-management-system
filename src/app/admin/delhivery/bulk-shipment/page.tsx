"use client";

import { useState } from "react";
import * as XLSX from "xlsx";

export default function BulkShipmentPage() {
  const [rows, setRows] = useState<any[]>([]);
  const [processing, setProcessing] = useState(false);
  const [results, setResults] = useState<any[]>([]);

  function downloadSample() {
    window.location.href = "/api/admin/delhivery/bulk-sample";
  }

  function onFileChange(e: any) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const wb = XLSX.read(evt.target?.result, { type: "binary" });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const json = XLSX.utils.sheet_to_json(ws);
      setRows(json as any[]);
    };
    reader.readAsBinaryString(file);
  }

  async function createBulk() {
    if (!rows.length) return alert("Upload file first");

    setProcessing(true);
    setResults([]);

    const r = await fetch("/api/admin/delhivery/bulk-create", {
      method: "POST",
      body: JSON.stringify({ rows }),
    });

    const j = await r.json();
    setResults(j.results || []);
    setProcessing(false);
  }

  async function downloadLabel(awb: string) {
    const r = await fetch("/api/admin/delhivery/label", {
      method: "POST",
      body: JSON.stringify({ awb }),
    });

    const j = await r.json();
    if (j.base64) {
      const a = document.createElement("a");
      a.href = `data:application/pdf;base64,${j.base64}`;
      a.download = `${awb}.pdf`;
      a.click();
    }
  }

  return (
    <div className="p-8 space-y-6">
      <h1 className="text-2xl font-bold">Bulk Create Delhivery Shipments</h1>

      <button
        onClick={downloadSample}
        className="px-4 py-2 bg-black text-white rounded"
      >
        Download Sample Excel
      </button>

      <div className="mt-4">
        <input type="file" accept=".xlsx,.xls" onChange={onFileChange}
          className="border p-2 rounded" />
      </div>

      {rows.length > 0 && (
        <div className="bg-white border rounded p-4 shadow-sm">
          <p className="font-semibold mb-2">Preview ({rows.length} rows)</p>
          <pre className="text-xs bg-gray-100 p-2 rounded max-h-64 overflow-auto">
            {JSON.stringify(rows, null, 2)}
          </pre>

          <button
            className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded"
            onClick={createBulk}
            disabled={processing}
          >
            {processing ? "Creating shipments…" : "Create All Shipments"}
          </button>
        </div>
      )}

      {results.length > 0 && (
        <div className="mt-6 bg-white border rounded p-4 shadow-sm">
          <h2 className="font-semibold mb-3">Results</h2>
          <table className="w-full text-sm border">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-2 border">Row</th>
                <th className="p-2 border">Order ID</th>
                <th className="p-2 border">AWB</th>
                <th className="p-2 border">Status</th>
                <th className="p-2 border">Label</th>
              </tr>
            </thead>
            <tbody>
              {results.map((r: any, i: number) => (
                <tr key={i}>
                  <td className="p-2 border">{i + 1}</td>
                  <td className="p-2 border">{r.order_id}</td>
                  <td className="p-2 border">{r.awb || "--"}</td>
                  <td className="p-2 border">
                    {r.success ? (
                      <span className="text-green-600">Success</span>
                    ) : (
                      <span className="text-red-600">Failed</span>
                    )}
                  </td>
                  <td className="p-2 border text-center">
                    {r.awb && (
                      <button
                        onClick={() => downloadLabel(r.awb)}
                        className="text-blue-600 underline"
                      >
                        Download
                      </button>
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