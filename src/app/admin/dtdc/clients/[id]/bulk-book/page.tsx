"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import * as XLSX from "xlsx";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import toast from "react-hot-toast";

interface BookingRow {
  consignee_name: string;
  address: string;
  phone: string;
  pincode: string;
  weight: string;
  reference?: string;
}

export default function BulkBookingPage() {
  const { id } = useParams();
  const clientId = Number(id);

  const [rows, setRows] = useState<BookingRow[]>([]);
  const [loading, setLoading] = useState(false);

  function parseExcel(file: File) {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        if (!data) return;

        const workbook = XLSX.read(data, { type: "binary" });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const json = XLSX.utils.sheet_to_json<Record<string, any>>(sheet, { defval: "" });

        const parsed: BookingRow[] = json.map((r) => ({
          consignee_name: r.consignee_name?.toString().trim(),
          address: r.address?.toString().trim(),
          phone: r.phone?.toString().trim(),
          pincode: r.pincode?.toString().trim(),
          weight: r.weight?.toString().trim(),
          reference: r.reference?.toString().trim() || "",
        }))
        .filter((r) => r.consignee_name && r.address && r.phone && r.pincode && r.weight);

        setRows(parsed);
        toast.success(`Loaded ${parsed.length} bookings`);
      } catch (err) {
        toast.error("Failed to parse Excel");
      }
    };
    reader.readAsBinaryString(file);
  }

  async function submitBulk() {
    if (!rows.length) {
      toast.error("No bookings loaded");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/admin/dtdc/book/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId, items: rows }),
      });

      const json = await res.json();

      if (!res.ok || json.error) {
        toast.error(json.error || "Bulk booking failed");
      } else {
        toast.success("Bulk booking completed");

        console.log("Bulk Result:", json);
      }
    } catch (err) {
      toast.error("Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-semibold">DTDC — Bulk Booking</h1>

      <Card className="p-4 space-y-4">
        <input
          type="file"
          accept=".xlsx,.xls"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) parseExcel(file);
          }}
        />

        <Button
          className="bg-blue-600 text-white"
          disabled={loading || rows.length === 0}
          onClick={submitBulk}
        >
          {loading ? "Processing..." : "Submit Bulk Bookings"}
        </Button>
      </Card>

      {rows.length > 0 && (
        <Card className="p-4">
          <h2 className="font-medium mb-3">Preview ({rows.length} rows)</h2>

          <div className="max-h-[450px] overflow-auto border rounded">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Address</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Pincode</TableHead>
                  <TableHead>Weight</TableHead>
                  <TableHead>Reference</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {rows.map((r, i) => (
                  <TableRow key={i}>
                    <TableCell>{r.consignee_name}</TableCell>
                    <TableCell>{r.address}</TableCell>
                    <TableCell>{r.phone}</TableCell>
                    <TableCell>{r.pincode}</TableCell>
                    <TableCell>{r.weight}</TableCell>
                    <TableCell>{r.reference}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}
    </div>
  );
}
