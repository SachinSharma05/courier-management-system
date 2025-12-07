"use client";

import { useState } from "react";
import * as XLSX from "xlsx";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import toast from "react-hot-toast";
import Link from "next/link";

// Type
type Group = { code: string; awbs: string[] };

export default function UploadPage() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(false);
  const [running, setRunning] = useState(false);

  // -----------------------
  // Excel Parsing (UNCHANGED)
  // -----------------------
  function parseWorkbook(file: File) {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        if (!data) throw new Error("Failed to read file");
        const workbook = XLSX.read(data, { type: "binary" as any });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const raw = XLSX.utils.sheet_to_json<Record<string, any>>(sheet, { defval: "" });

        const rows = raw
          .map((r) => {
            const lower: Record<string, any> = {};
            for (const k of Object.keys(r)) lower[k.toLowerCase().trim()] = r[k];
            return {
              code:
                (lower["dsr_act_cust_code"] ??
                  lower["dsr_act_code"] ??
                  "").toString().trim(),
              awb:
                (lower["dsr_cnno"] ?? lower["awb"] ?? "").toString().trim(),
            };
          })
          .filter((x) => x.awb && x.code);

        const map = new Map<string, string[]>();
        for (const r of rows) {
          const arr = map.get(r.code) ?? [];
          arr.push(r.awb);
          map.set(r.code, arr);
        }

        const g: Group[] = Array.from(map.entries())
        .filter(([code]) => code.toUpperCase() !== "IF549")   // ❗ skip IF549
        .map(([code, awbs]) => ({ code, awbs }))
        .sort((a, b) => b.awbs.length - a.awbs.length);

        setGroups(g);
        toast.success(`Parsed ${rows.length} rows — ${g.length} groups`);
      } catch (err: any) {
        console.error(err);
        toast.error("Failed to parse Excel: " + (err?.message ?? err));
      } finally {
        setLoading(false);
      }
    };

    setLoading(true);
    reader.readAsBinaryString(file);
  }

  // -----------------------
  // Fetch APIs (UNCHANGED)
  // -----------------------
  async function startFetch(group: Group, runTracking = true) {
    setRunning(true);
    try {
      const res = await fetch("/api/admin/upload/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ groups: [group], runTracking }),
      });
      const json = await res.json();
      if (!json.ok) {
        toast.error(json.error || "Failed");
      } else {
        toast.success(json.message || "Processed");
        setGroups((prev) => prev.filter((g) => g.code !== group.code));
      }
    } catch {
      toast.error("Network error");
    } finally {
      setRunning(false);
    }
  }

  async function startAll(runTracking = true) {
    if (!groups.length) return toast.error("No groups to process");
    setRunning(true);
    try {
      const res = await fetch("/api/admin/upload/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ groups, runTracking }),
      });
      const json = await res.json();
      if (!json.ok) toast.error(json.error || "Failed");
      else {
        toast.success(json.message || "Processed all groups");
        setGroups([]);
      }
    } catch {
      toast.error("Network error");
    } finally {
      setRunning(false);
    }
  }

  // -----------------------
  // UI
  // -----------------------
  return (
    <div className="max-w-5xl mx-auto p-6 space-y-8">

      {/* Breadcrumb */}
      <nav className="text-sm text-gray-500 flex gap-2 items-center">
        <Link href="/admin" className="hover:underline">Dashboard</Link>
        <span>/</span>
        <Link href="/admin/dtdc/clients" className="hover:underline">Clients</Link>
        <span>/</span>
        <span className="text-gray-700 font-medium">Upload Excel</span>
      </nav>

      {/* Page Title + Actions */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">
          Upload Excel — AWB / Customer Code
        </h1>

        <div className="flex gap-3">
          <Button
            size="lg"
            className="shadow-md"
            onClick={() => startAll(true)}
            disabled={running || !groups.length}
          >
            Process All & Track
          </Button>
        </div>
      </div>

      {/* Upload Card */}
      <Card className="p-6 shadow-md border border-gray-200">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <input
            type="file"
            accept=".xlsx,.xls"
            className="text-sm cursor-pointer file:mr-3 file:px-3 file:py-1.5 
                       file:rounded-md file:border file:bg-gray-100 
                       file:text-gray-700 hover:file:bg-gray-200"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (!f) return;
              parseWorkbook(f);
            }}
          />
          <p className="text-gray-600 text-sm">
            Select Excel with <strong>DSR_ACT_CUST_CODE</strong> and{" "}
            <strong>DSR_CNNO</strong> columns
          </p>
        </div>
      </Card>

      {/* Groups List */}
      {groups.length === 0 ? (
        <div className="text-gray-500 text-center py-10">
          No groups loaded. Upload an Excel file to begin.
        </div>
      ) : (
        <div className="space-y-4">
          {groups.map((g) => (
            <Card
              key={g.code}
              className="border border-gray-200 p-4 rounded-xl shadow-sm"
            >
              {/* Header row */}
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold">{g.code}</h2>
                  <p className="text-xs text-gray-500">{g.awbs.length} AWBs</p>
                </div>

                <Button
                  size="sm"
                  className="shadow-sm"
                  disabled={running}
                  onClick={() => startFetch(g, true)}
                >
                  Fetch & Track
                </Button>
              </div>

              {/* AWB Grid */}
              <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 text-xs">
                {g.awbs.map((a) => (
                  <div
                    key={a}
                    className="border rounded px-2 py-1 bg-gray-50 font-mono text-[11px]"
                  >
                    {a}
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
