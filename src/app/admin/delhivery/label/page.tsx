"use client";

import { useState } from "react";
import { FileText, Loader2, Download } from "lucide-react";

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

    if (j.link) {
      setPdfUrl(j.link);
      setFilename(`${awb}.pdf`);
      return;
    }

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
    <div className="p-8 max-w-4xl mx-auto space-y-8">
      {/* Title */}
      <div className="flex items-center gap-3">
        <FileText size={26} className="text-indigo-600" />
        <h1 className="text-2xl font-bold">Download Delhivery Label</h1>
      </div>

      {/* Input Card */}
      <div className="p-6 bg-white rounded-xl border shadow-sm space-y-4">
        <div>
          <label className="text-sm font-medium">Enter AWB Number</label>
          <input
            className="w-full mt-1 p-3 border rounded-lg focus:outline-none focus:ring focus:ring-indigo-200"
            placeholder="Example: 42315610007136"
            value={awb}
            onChange={(e) => setAwb(e.target.value)}
          />
        </div>

        <button
          onClick={generate}
          disabled={loading || !awb}
          className="px-5 py-2 bg-black text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 flex items-center gap-2"
        >
          {loading && <Loader2 className="animate-spin" size={18} />}
          {loading ? "Generating..." : "Generate Label"}
        </button>

        {/* PDF Preview */}
        {(pdfUrl || pdfBase64) && (
          <div className="mt-6 space-y-4">
            <div className="font-medium text-gray-700">Label Preview</div>

            <div className="border rounded-xl overflow-hidden shadow-sm bg-gray-50">
              <iframe
                className="w-full h-[520px]"
                src={
                  pdfUrl
                    ? pdfUrl
                    : `data:application/pdf;base64,${pdfBase64}`
                }
              />
            </div>

            <button
              onClick={download}
              className="px-5 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-2"
            >
              <Download size={18} />
              Download Label
            </button>
          </div>
        )}
      </div>
    </div>
  );
}