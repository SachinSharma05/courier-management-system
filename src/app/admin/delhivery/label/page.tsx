"use client";

import { useState } from "react";

export default function LabelDownload() {
  const [awb, setAwb] = useState("");
  const [pdfBase64, setPdfBase64] = useState<string | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [filename, setFilename] = useState("");
  const [loading, setLoading] = useState(false);

  async function generate() {
    setLoading(true);
    setPdfBase64(null);
    setPdfUrl(null);

    const r = await fetch("/api/admin/delhivery/label", {
      method: "POST",
      body: JSON.stringify({ awb }),
    });

    const j = await r.json();
    setLoading(false);

    // Prefer direct URL if available
    if (j.link) {
      setPdfUrl(j.link);
      setFilename(`${awb}.pdf`);
      return;
    }

    // Fallback to base64
    if (j.base64) {
      setPdfBase64(j.base64);
      setFilename(`${awb}.pdf`);
      return;
    }

    alert("Label not found for this AWB.");
  }

  function download() {
    if (pdfUrl) {
      const link = document.createElement("a");
      link.href = pdfUrl;
      link.download = filename;
      link.click();
      return;
    }

    if (pdfBase64) {
      const link = document.createElement("a");
      link.href = `data:application/pdf;base64,${pdfBase64}`;
      link.download = filename;
      link.click();
    }
  }

  return (
    <div className="p-8 space-y-6">
      <h1 className="text-2xl font-bold">Download Delhivery Label</h1>

      <div className="p-6 bg-white rounded-xl border shadow-sm space-y-3">
        <input
          className="input"
          placeholder="Enter AWB"
          value={awb}
          onChange={(e) => setAwb(e.target.value)}
        />

        <button onClick={generate} className="btn-primary" disabled={loading}>
          {loading ? "Generating…" : "Generate Label"}
        </button>

        {/* Preview for URL PDF */}
        {pdfUrl && (
          <div className="mt-4 space-y-3">
            <iframe
              className="w-full h-80 border rounded-lg"
              src={pdfUrl}
            />

            <button
              onClick={download}
              className="px-4 py-2 bg-black text-white rounded hover:bg-gray-800"
            >
              Download Label
            </button>
          </div>
        )}

        {/* Preview for Base64 PDF */}
        {pdfBase64 && (
          <div className="mt-4 space-y-3">
            <iframe
              className="w-full h-80 border rounded-lg"
              src={`data:application/pdf;base64,${pdfBase64}`}
            />

            <button
              onClick={download}
              className="px-4 py-2 bg-black text-white rounded hover:bg-gray-800"
            >
              Download Label
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
