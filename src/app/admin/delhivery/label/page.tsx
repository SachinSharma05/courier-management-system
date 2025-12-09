"use client";

import { useState } from "react";

export default function LabelDownload() {
  const [awb, setAwb] = useState("");
  const [result, setResult] = useState<any>(null);

  async function generate() {
    const r = await fetch("/api/admin/delhivery/label", {
      method: "POST",
      body: JSON.stringify({ awb }),
    });

    const j = await r.json();
    setResult(j);

    if (j.base64) {
      const link = document.createElement("a");
      link.href = `data:application/pdf;base64,${j.base64}`;
      link.download = `${awb}.pdf`;
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

        <button onClick={generate} className="btn-primary">
          Generate Label
        </button>

        {result && (
          <pre className="bg-gray-100 p-4 rounded-xl text-sm">{JSON.stringify(result, null, 2)}</pre>
        )}
      </div>
    </div>
  );
}
