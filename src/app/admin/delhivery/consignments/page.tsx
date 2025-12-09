"use client";

import { useEffect, useState, useMemo } from "react";
import type { Consignment } from "@/interface/Delhivery";

function Badge({ children, color = "gray" }: any) {
  const map: Record<string, string> = {
    pending: "bg-yellow-200 text-yellow-800",
    delivered: "bg-green-200 text-green-800",
    rto: "bg-red-200 text-red-800",
    in_transit: "bg-blue-200 text-blue-800",
  };
  return <span className={`px-2 py-1 rounded text-xs ${map[color] ?? "bg-gray-200 text-gray-800"}`}>{children}</span>;
}

function TableSkeleton() {
  return <div className="p-6 bg-white rounded shadow-sm">Loading…</div>;
}

export default function ConsignmentList() {
  const [list, setList] = useState<Consignment[]>([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [total, setTotal] = useState(0);
  const [sortBy, setSortBy] = useState<string>("created_at");
  const [sortDir, setSortDir] = useState<"asc"|"desc">("desc");
  const [selected, setSelected] = useState<Record<string, boolean>>({});

  useEffect(() => { fetchData(); }, [page, perPage, status, query, sortBy, sortDir]);

  async function fetchData() {
    setLoading(true);
    try {
      // This endpoint should return { data: Consignment[], total: number }
      const q = new URLSearchParams({ page: String(page), perPage: String(perPage), status, q: query, sortBy, sortDir });
      const r = await fetch(`/api/admin/providerConsignments/delhivery?${q.toString()}`);
      const j = await r.json();
      setList(j.data ?? []);
      setTotal(j.total ?? (j.data?.length ?? 0));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  function toggleSelect(id: string) {
    setSelected((s) => ({ ...s, [id]: !s[id] }));
  }

  function exportCSV() {
    const rows = [ ["AWB","Client Ref","Name","Phone","Pincode","Status","Created At"] ];
    for (const r of list) rows.push([r.awb, r.client_ref ?? "", r.order.name, r.order.phone, r.order.pincode, r.status, r.created_at]);
    const csv = rows.map(r => r.map(c=>`"${String(c).replace(/"/g,'""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `delhivery_consignments_page${page}.csv`;
    a.click();
  }

  async function doAction(action: string, awb: string) {
    try {
      if (action === "track") {
        const r = await fetch(`/api/admin/delhivery/track?awb=${awb}`);
        const j = await r.json();
        alert(JSON.stringify(j, null, 2));
      } else if (action === "fetch-waybill") {
        const r = await fetch(`/api/admin/delhivery/fetch-waybill?awb=${awb}`);
        const j = await r.json();
        alert(JSON.stringify(j, null, 2));
      } else if (action === "label") {
        const r = await fetch("/api/admin/delhivery/label", { method: "POST", body: JSON.stringify({ awb })});
        const j = await r.json();
        if (j.base64 || j.pdf) {
          const base64 = j.base64 ?? j.pdf;
          const link = document.createElement("a");
          link.href = `data:application/pdf;base64,${base64}`;
          link.download = `${awb}.pdf`;
          link.click();
        } else {
          alert(JSON.stringify(j, null, 2));
        }
      } else if (action === "update") {
        const newPhone = prompt("New phone for AWB " + awb);
        if (!newPhone) return;
        const r = await fetch("/api/admin/delhivery/update-shipment", { method: "POST", body: JSON.stringify({ awb, update: { phone: newPhone }})});
        alert(JSON.stringify(await r.json(), null, 2));
        fetchData();
      } else if (action === "pickup") {
        const date = prompt("Pickup date (YYYY-MM-DD)");
        if (!date) return;
        const r = await fetch("/api/admin/delhivery/request-pickup", { method: "POST", body: JSON.stringify({ warehouse: "default", date, reference_awb: awb })});
        alert(JSON.stringify(await r.json(), null, 2));
      }
    } catch (e: any) {
      alert("Action failed: " + e?.message ?? e);
    }
  }

  const totalPages = Math.max(1, Math.ceil(total / perPage));

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Delhivery Consignments</h1>
        <div className="flex gap-2">
          <button onClick={exportCSV} className="px-3 py-2 border rounded">Export CSV</button>
        </div>
      </div>

      <div className="p-4 bg-white border rounded-lg shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center lg:gap-4">
          <div className="flex items-center gap-2">
            <input placeholder="Search AWB / name / client ref" value={query} onChange={(e)=> setQuery(e.target.value)} className="p-2 border rounded" />
            <button onClick={()=> { setPage(1); fetchData(); }} className="px-3 py-2 bg-slate-800 text-white rounded">Search</button>
          </div>

          <div className="flex items-center gap-3 mt-3 lg:mt-0">
            <select value={status} onChange={(e)=> setStatus(e.target.value)} className="p-2 border rounded">
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="in_transit">In Transit</option>
              <option value="delivered">Delivered</option>
              <option value="rto">RTO</option>
            </select>

            <select value={perPage} onChange={(e)=> { setPerPage(Number(e.target.value)); setPage(1); }} className="p-2 border rounded">
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>

            <div className="text-sm text-gray-600">Total: {total}</div>
          </div>
        </div>

        <div className="mt-4">
          {loading ? <TableSkeleton /> : (
            <div className="overflow-auto">
              <table className="w-full table-auto">
                <thead>
                  <tr className="text-left">
                    <th className="p-2"><input type="checkbox" /></th>
                    <th className="p-2">AWB</th>
                    <th className="p-2">Client Ref</th>
                    <th className="p-2">Name</th>
                    <th className="p-2">Phone</th>
                    <th className="p-2">Pincode</th>
                    <th className="p-2">Status</th>
                    <th className="p-2">Created</th>
                    <th className="p-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {list.length === 0 && <tr><td colSpan={9} className="p-6 text-center text-gray-500">No consignments</td></tr>}
                  {list.map((r) => (
                    <tr key={r.id} className="border-t">
                      <td className="p-2"><input type="checkbox" checked={!!selected[r.id]} onChange={()=> toggleSelect(r.id)} /></td>
                      <td className="p-2 font-medium">{r.awb}</td>
                      <td className="p-2">{r.client_ref ?? "-"}</td>
                      <td className="p-2">{r.order.name}</td>
                      <td className="p-2">{r.order.phone}</td>
                      <td className="p-2">{r.order.pincode}</td>
                      <td className="p-2"><Badge color={r.status}>{r.status}</Badge></td>
                      <td className="p-2">{new Date(r.created_at).toLocaleString()}</td>
                      <td className="p-2">
                        <div className="flex gap-2">
                          <button onClick={()=> doAction("track", r.awb)} className="px-2 py-1 border rounded text-sm">Track</button>
                          <button onClick={()=> doAction("fetch-waybill", r.awb)} className="px-2 py-1 border rounded text-sm">Waybill</button>
                          <button onClick={()=> doAction("label", r.awb)} className="px-2 py-1 border rounded text-sm">Label</button>
                          <button onClick={()=> doAction("update", r.awb)} className="px-2 py-1 border rounded text-sm">Update</button>
                          <button onClick={()=> doAction("pickup", r.awb)} className="px-2 py-1 border rounded text-sm">Pickup</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pagination */}
        <div className="mt-4 flex items-center justify-between">
          <div className="text-sm">Page {page} of {totalPages}</div>
          <div className="flex gap-2">
            <button disabled={page <= 1} onClick={()=> setPage(p => Math.max(1, p-1))} className="px-3 py-1 border rounded">Prev</button>
            <button disabled={page >= totalPages} onClick={()=> setPage(p => Math.min(totalPages, p+1))} className="px-3 py-1 border rounded">Next</button>
          </div>
        </div>
      </div>
    </div>
  );
}