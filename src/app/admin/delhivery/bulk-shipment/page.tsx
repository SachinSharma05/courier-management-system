"use client";

import { useState } from "react";
import * as XLSX from "xlsx";
import { Download, FileUp, FileSpreadsheet, Loader2 } from "lucide-react";

export default function BulkShipmentPage() {
  const [rows, setRows] = useState<any[]>([]);
  const [processing, setProcessing] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [fileName, setFileName] = useState("");

  function downloadSample() {
    window.location.href = "/api/admin/delhivery/bulk-sample";
  }

  function onFileChange(e: any) {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);

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
    <div className="p-4 space-y-6">
      <h1 className="text-2xl font-bold">Bulk Create Delhivery Shipments</h1>

      {/* Card */}
      <div className="bg-white p-6 rounded-xl border shadow-sm space-y-6">

        {/* Sample Download */}
        <div className="flex items-center justify-between">
          <p className="text-gray-600 text-sm">
            Upload Excel in the required format. You may download the sample template.
          </p>

          <button
            onClick={downloadSample}
            className="px-4 py-2 bg-black text-white rounded-lg flex items-center gap-2 hover:bg-gray-800"
          >
            <Download size={16} />
            Download Sample Excel
          </button>
        </div>

        {/* Upload Box */}
        <div className="border-2 border-dashed rounded-xl p-6 text-center hover:bg-gray-50 transition">
          <label className="cursor-pointer flex flex-col items-center gap-3">
            <FileUp size={40} className="text-gray-500" />
            <span className="text-gray-700">
              {fileName ? (
                <b>{fileName}</b>
              ) : (
                "Click to choose Excel file (.xlsx, .xls)"
              )}
            </span>
            <input
              type="file"
              accept=".xlsx,.xls"
              className="hidden"
              onChange={onFileChange}
            />
          </label>
        </div>

        {/* Preview */}
        {rows.length > 0 && (
          <div className="mt-6 bg-white border rounded-lg p-4 shadow-sm">
            <h3 className="font-semibold text-lg mb-3">
              Preview ({rows.length} rows)
            </h3>

            <div className="max-h-64 overflow-auto bg-gray-50 p-3 rounded border text-xs">
              <pre>{JSON.stringify(rows, null, 2)}</pre>
            </div>

            <button
              onClick={createBulk}
              disabled={processing}
              className="mt-4 px-5 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 flex items-center gap-2"
            >
              {processing ? (
                <>
                  <Loader2 size={18} className="animate-spin" /> Creating…
                </>
              ) : (
                "Create All Shipments"
              )}
            </button>
          </div>
        )}

        {/* Results */}
        {results.length > 0 && (
          <div className="mt-8 bg-white border rounded-lg p-4 shadow-sm">
            <h3 className="font-semibold text-lg mb-3">Results</h3>

            <table className="w-full text-sm border rounded overflow-hidden">
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
                  <tr key={i} className="border-t">
                    <td className="p-2 border text-center">{i + 1}</td>
                    <td className="p-2 border">{r.order_id}</td>
                    <td className="p-2 border">{r.awb || "--"}</td>
                    <td className="p-2 border">
                      {r.success ? (
                        <span className="text-green-600 font-medium">Success</span>
                      ) : (
                        <span className="text-red-600 font-medium">Failed</span>
                      )}
                    </td>
                    <td className="p-2 border text-center">
                      {r.awb ? (
                        <button
                          onClick={() => downloadLabel(r.awb)}
                          className="text-indigo-600 underline"
                        >
                          Download
                        </button>
                      ) : (
                        "-"
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}