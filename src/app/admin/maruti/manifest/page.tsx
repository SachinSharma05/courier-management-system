"use client";

import { useState } from "react";
import toast from "react-hot-toast";

export default function MarutiManifestPage() {
  const [awbs, setAwbs] = useState("");

  async function createManifest() {
    const list = awbs.split("\n").map(a => a.trim()).filter(Boolean);

    const res = await fetch("/api/admin/maruti/manifest", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ awbNumbers: list }),
    });

    const j = await res.json();
    j.success ? toast.success("Manifest created") : toast.error(j.error);
  }

  return (
    <div className="p-8 space-y-4 max-w-xl">
      <h1 className="text-xl font-bold">Maruti – Create Manifest</h1>

      <textarea
        className="w-full border rounded p-3"
        rows={6}
        placeholder="One AWB per line"
        value={awbs}
        onChange={e => setAwbs(e.target.value)}
      />

      <button
        onClick={createManifest}
        className="bg-indigo-600 text-white px-4 py-2 rounded"
      >
        Create Manifest
      </button>
    </div>
  );
}