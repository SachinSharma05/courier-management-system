"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Loader2, Download, FileText } from "lucide-react";
import toast from "react-hot-toast";

import { generateCustomLabel } from "@/app/lib/pdf/generateCustomLabel";
import { mergePDFs } from "@/app/lib/pdf/mergePDFs";
import Link from "next/link";

export default function GenerateLabelPage() {
  const [awb, setAwb] = useState("");
  const [loading, setLoading] = useState(false);

  async function generate() {
    if (!awb.trim()) {
      toast.error("Please enter AWB");
      return;
    }

    try {
      setLoading(true);

      // Step 1: Get DTDC Label
      const res = await fetch("/api/dtdc/label", {
        method: "POST",
        body: JSON.stringify({ awb }),
      });

      const json = await res.json();

      if (!json?.data || !json.data[0]?.label) {
        toast.error("Failed to retrieve DTDC label");
        setLoading(false);
        return;
      }

      const dtdcBase64 = json.data[0].label;

      // Step 2: Generate Custom Label
      const customPdf = await generateCustomLabel({
        awb,
        company: "Masala Store Pvt Ltd",
        address: "Indore, Madhya Pradesh",
        phone: "+91 98765 43210",
      });

      // Step 3: Merge PDFs
      const mergedPdfBytes = await mergePDFs(
        new Uint8Array(customPdf),
        new Uint8Array(dtdcBase64)
      );

      // Step 4: Download Final Combined PDF
      const blob = new Blob([new Uint8Array(mergedPdfBytes)], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `LABEL_${awb}.pdf`;
      a.click();
      toast.success("Label generated");

    } catch (error) {
      console.error(error);
      toast.error("Failed to generate label");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-6 space-y-6 bg-slate-50 min-h-screen">
      {/* HEADER + BREADCRUMB ROW */}
      <div className="flex items-start justify-between gap-4">
        {/* LEFT: Title + subtitle */}
        <div>
          <h1 className="text-2xl font-bold leading-tight">
            Generate Label
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Generate combined shipping labels for DTDC shipments.
          </p>
        </div>

        {/* RIGHT: Breadcrumb */}
        <nav className="text-sm text-gray-500 flex gap-2 items-center whitespace-nowrap">
          <Link href="/admin" className="hover:underline">Home</Link>
          <span>/</span>
          <Link href="/admin/dtdc" className="hover:underline">DTDC Dashboard</Link>
          <span>/</span>
          <span className="text-gray-700 font-medium">Label</span>
        </nav>
      </div>

      <Card className="max-w-xl mx-auto">
        <CardContent className="space-y-4">
          <div className="space-y-1">
            <label className="text-sm font-medium">Enter AWB Number</label>
            <Input
              placeholder="D2004784350"
              value={awb}
              onChange={(e) => setAwb(e.target.value)}
            />
          </div>

          <Button onClick={generate} disabled={loading} className="w-full">
            {loading ? (
              <Loader2 className="animate-spin h-4 w-4 mr-2" />
            ) : (
              <FileText className="h-4 w-4 mr-2" />
            )}
            Generate Combined Label
          </Button>

        </CardContent>
      </Card>
    </div>
  );
}