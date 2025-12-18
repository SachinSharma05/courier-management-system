"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import toast from "react-hot-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type Row = {
  awb: string;
  origin: string | null;
  destination: string | null;
  current_status: string;
  last_status_at: string | null;
};

const PAGE_SIZE = 25;

export default function RetailDtdcPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);

  // filters
  const [awbFilter, setAwbFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [page, setPage] = useState(1);

  async function load() {
    const res = await fetch("/api/admin/dtdc/retail");
    const json = await res.json();
    if (json.ok) setRows(json.rows);
  }

  useEffect(() => {
    load();
  }, []);

  async function liveTrack(awbs: string[]) {
    setLoading(true);

    const res = await fetch("/api/admin/dtdc/retail/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ awbs }),
    });

    const json = await res.json();

    if (json.ok) {
      toast.success("Tracking updated");
      load();
    } else {
      toast.error(json.error || "Tracking failed");
    }

    setLoading(false);
  }

  /* ----------------------------
     FILTERING + PAGINATION
  ---------------------------- */
  const filtered = useMemo(() => {
    return rows.filter((r) => {
      if (awbFilter && !r.awb.includes(awbFilter)) return false;
      if (
        statusFilter !== "ALL" &&
        r.current_status?.toUpperCase() !== statusFilter
      )
        return false;
      return true;
    });
  }, [rows, awbFilter, statusFilter]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE
  );

  const pendingAwbs = rows
    .filter((r) => !["DELIVERED", "RTO"].includes(r.current_status?.toUpperCase()))
    .slice(0, 25)
    .map((r) => r.awb);

  return (
    <div className="p-6 space-y-6">

      {/* HEADER */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold">Retail DTDC Consignments</h1>
          <p className="text-sm text-muted-foreground">
            Franchise / retail DTDC shipments (IF549)
          </p>
        </div>

        <Button
          onClick={() => liveTrack(pendingAwbs)}
          disabled={loading || pendingAwbs.length === 0}
          className="bg-black text-white"
        >
          Bulk Track Pending
        </Button>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4">
  {/* LEFT: Filters */}
  <div className="flex items-center gap-3">
    <Input
      placeholder="Search AWB"
      className="w-64"
      value={awbFilter}
      onChange={(e) => setAwbFilter(e.target.value)}
    />

    <Select value={statusFilter} onValueChange={setStatusFilter}>
      <SelectTrigger className="w-40">
        <SelectValue placeholder="All Status" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="ALL">All Status</SelectItem>
        <SelectItem value="DELIVERED">Delivered</SelectItem>
        <SelectItem value="IN TRANSIT">In Transit</SelectItem>
        <SelectItem value="RTO">RTO</SelectItem>
      </SelectContent>
    </Select>
  </div>

  {/* RIGHT: Meta */}
  <div className="text-sm text-muted-foreground">
    {filtered.length} results
  </div>
</div>

      {/* TABLE */}
      <Card className="overflow-hidden">
        <div className="overflow-auto max-h-[65vh]">
          <table className="min-w-full text-sm">
            <thead className="sticky top-0 bg-gray-100 z-10">
              <tr>
                <th className="p-3 text-left">AWB</th>
                <th className="p-3">Status</th>
                <th className="p-3">Origin</th>
                <th className="p-3">Destination</th>
                <th className="p-3">Last Update</th>
                <th className="p-3 text-right">Action</th>
              </tr>
            </thead>

            <tbody>
              {paginated.map((r) => (
                <tr key={r.awb} className="border-t hover:bg-gray-50">
                  <td className="p-3 font-medium">{r.awb}</td>

                  <td className="p-3">
                    <StatusBadge status={r.current_status} />
                  </td>

                  <td className="p-3">{r.origin ?? "-"}</td>
                  <td className="p-3">{r.destination ?? "-"}</td>

                  <td className="p-3">
                    {r.last_status_at
                      ? new Date(r.last_status_at).toLocaleString()
                      : "-"}
                  </td>

                  <td className="p-3 text-right">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => liveTrack([r.awb])}
                    >
                      Track
                    </Button>
                  </td>
                </tr>
              ))}

              {paginated.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-gray-500">
                    No consignments found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINATION */}
        {totalPages > 1 && (
          <div className="flex justify-between items-center p-3 border-t">
            <span className="text-sm text-gray-500">
              Page {page} of {totalPages}
            </span>

            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
              >
                Prev
              </Button>

              <Button
                size="sm"
                variant="outline"
                disabled={page === totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}

/* ----------------------------
   STATUS BADGE
---------------------------- */
function StatusBadge({ status }: { status: string }) {
  const s = status?.toUpperCase() ?? "";

  const map: Record<string, string> = {
    DELIVERED: "bg-green-100 text-green-700",
    "IN TRANSIT": "bg-blue-100 text-blue-700",
    RTO: "bg-red-100 text-red-700",
  };

  return (
    <span
      className={`px-2 py-1 rounded-full text-xs font-medium ${
        map[s] || "bg-gray-100 text-gray-600"
      }`}
    >
      {status}
    </span>
  );
}