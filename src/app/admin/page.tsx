// app/admin/dashboard/page.tsx   (or wherever your ReportsPage lives)
"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import Link from "next/link";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

import LeadsChart from "@/components/admin/LeadsChart";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const PROVIDERS = [
  { key: "dtdc", name: "DTDC" },
  { key: "delh", name: "Delhivery" },
  { key: "xb", name: "XpressBees" },
  { key: "aramax", name: "Aramex" },
];

const COLORS = {
  delivered: "#16a34a", // green
  pending: "#f59e0b", // yellow
  rto: "#dc2626", // red
};

export default function ReportsPage() {
  const [stats, setStats] = useState<any>({
    dtdc: { delivered: 0, pending: 0, rto: 0, total: 0 },
    delh: { delivered: 0, pending: 0, rto: 0, total: 0 },
    xb: { delivered: 0, pending: 0, rto: 0, total: 0 },
    aramax: { delivered: 0, pending: 0, rto: 0, total: 0 },

    billing: { totalRevenue: 0 },
  });
  const [clients, setClients] = useState<any[]>([]);
  const [complaints, setComplaints] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [pie, setPie] = useState<any>({ delivered: 0, pending: 0, rto: 0 });
  const [trend, setTrend] = useState<any[]>([]);
  const [recent, setRecent] = useState<any[]>([]);

  async function fetchDashboard() {
  setLoading(true);
  try {
    const res = await fetch("/api/admin/dashboard");
    const json = await res.json();

    if (!json.ok) {
      toast.error("Failed to load dashboard");
      return;
    }

    // PROVIDERS
    setStats(json.providers);

    // CLIENTS (right sidebar)
    setClients(json.clients ?? []);

    // COMPLAINTS
    setComplaints(json.complaints ?? []);

    // PIE CHART SUMMARY
    setPie(json.pie ?? { delivered: 0, pending: 0, rto: 0 });

    // TREND CHART
    setTrend(json.trend ?? []);

    // RECENT CONSIGNMENTS
    setRecent(json.recent ?? []);

  } catch (err) {
    toast.error("Failed to load dashboard");
  } finally {
    setLoading(false);
  }
}

  useEffect(() => {
    fetchDashboard();
  }, []);

  // pie data combined across providers
  const combined = ["delivered", "pending", "rto"].map((k) => {
    const val =
      (stats.dtdc?.[k] || 0) +
      (stats.delh?.[k] || 0) +
      (stats.xb?.[k] || 0) +
      (stats.aramax?.[k] || 0);
    return { name: k, value: val };
  });

  return (
    <div className="grid grid-cols-12 gap-6 p-4">
      {/* header */}
      <div className="col-span-9 flex items-start justify-between">
        <h1 className="text-3xl font-bold">Dashboard</h1>

        <div className="flex items-center gap-3">
          <label className="cursor-pointer">
            <input
              type="file"
              accept=".xlsx"
              className="hidden"
              onChange={(e) => {
                if (!e.target.files?.[0]) return;
                const file = e.target.files[0];
                // TODO: implement upload endpoint
                toast.success("File ready to upload: " + file.name);
              }}
            />
            <Button variant="outline">Upload XLSX</Button>
          </label>

          <Button onClick={() => { fetchDashboard(); }} variant="outline">
            Refresh
          </Button>
        </div>
      </div>

      {/* Provider cards (4 per row) */}
      <div className="col-span-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          {PROVIDERS.map((p) => {
            const key = p.key as keyof typeof stats;
            const data = stats[key] ?? { delivered: 0, pending: 0, rto: 0, total: 0 };

            return (
              <Card key={p.key} className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-lg font-semibold">{p.name}</div>
                  <div className="text-sm text-gray-500">Total: {data.total ?? 0}</div>
                </div>

                <div className="space-y-2">
                  <StatRow label="Delivered" value={data.delivered ?? 0} color={COLORS.delivered} />
                  <StatRow label="Pending" value={data.pending ?? 0} color={COLORS.pending} />
                  <StatRow label="RTO" value={data.rto ?? 0} color={COLORS.rto} />
                </div>
              </Card>
            );
          })}
        </div>

        {/* Complaints + Pie (split) */}
        <div className="grid grid-cols-12 gap-4 mb-6">
          <div className="col-span-6">
            <Card className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold">Complaints</h3>
                <div className="text-sm text-gray-500">{complaints.length} results</div>
              </div>

              <div className="divide-y rounded-md border">
                {complaints.length === 0 ? (
                  <div className="p-6 text-gray-500">No complaints found.</div>
                ) : (
                  <div className="max-h-[360px] overflow-y-auto">
                    {complaints.map((c: any) => (
                      <div key={c.id} className="p-3 flex items-start justify-between gap-4 hover:bg-gray-50">
                        <div className="w-2/3">
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${c.status === "open" ? "bg-red-100 text-red-700" : c.status === "in_progress" ? "bg-yellow-100 text-yellow-700" : "bg-green-100 text-green-700"}`}>
                              {c.status}
                            </span>
                            <div className="text-sm font-medium ml-2">AWB: {c.awb ?? c.tracking_number ?? "—"}</div>
                          </div>
                          <div className="text-sm text-gray-700 mt-1">{c.message ?? c.note ?? "No message"}</div>
                        </div>

                        <div className="w-1/3 text-right text-xs text-gray-500">
                          <div>{new Date(c.updated_at ?? c.updatedAt ?? c.updatedOn ?? Date.now()).toLocaleString()}</div>
                          <Link href={`/admin/complaints/${c.id}`}>
                            <button className="mt-2 inline-block text-xs px-2 py-1 rounded border text-gray-700">Open</button>
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Card>
          </div>

          <div className="col-span-6">
            <Card className="p-4">
              <h3 className="text-lg font-semibold mb-2">Status Breakdown</h3>
              <div style={{ width: "100%", height: 260 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={combined}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={3}
                    >
                      {combined.map((entry, idx) => {
                        const key = entry.name;
                        const color = key === "delivered" ? COLORS.delivered : key === "pending" ? COLORS.pending : COLORS.rto;
                        return <Cell key={`c-${idx}`} fill={color} />;
                      })}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="mt-3 space-y-2">
                {combined.map((c) => {
                  const color = c.name === "delivered" ? COLORS.delivered : c.name === "pending" ? COLORS.pending : COLORS.rto;
                  return (
                    <div key={c.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span style={{ background: color }} className="w-3 h-3 rounded-full inline-block" />
                        <div className="text-sm capitalize">{c.name}</div>
                      </div>
                      <div className="text-sm font-medium">{c.value}</div>
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>
        </div>

        {/* Leads chart (full width) */}
        <LeadsChart
          title="Total Leads by Day"
          data={trend.map((t) => ({
            date: t.label,
            value: t.value,
          }))}
        />

        <Card className="p-4 mt-6">
          <h3 className="text-lg font-semibold mb-3">Recent Consignments</h3>

          <div className="divide-y border rounded-md">
            {recent.length === 0 ? (
              <div className="p-4 text-gray-500">No consignments found.</div>
            ) : (
              recent.map((r) => (
                <div key={r.id} className="p-3 flex justify-between hover:bg-gray-50">
                  <div>
                    <div className="font-medium">AWB: {r.awb}</div>
                    <div className="text-xs text-gray-500">
                      Providers: {r.providers.join(", ")}
                    </div>
                  </div>
                  <div className="text-right text-xs">
                    <div>{r.last_status}</div>
                    <div className="text-gray-500">
                      {new Date(r.lastUpdatedOn).toLocaleString()}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      {/* RIGHT COLUMN — Clients sidebar */}
      <div className="col-span-4">
        <div className="bg-white rounded-xl shadow p-4 sticky top-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="text-sm text-gray-500">DTDC → CPDP →</div>
              <div className="text-lg font-semibold">Clients</div>
            </div>

            <Link href="/admin/dtdc/clients">
              <Button size="sm" variant="outline">All</Button>
            </Link>
          </div>

          <div className="space-y-2 max-h-[640px] overflow-y-auto">
            {clients.length === 0 ? (
              <div className="text-sm text-gray-500 p-3">No clients found.</div>
            ) : (
              clients.map((c: any) => (
                <div key={c.id} className="flex items-center justify-between p-3 bg-gray-50 rounded hover:bg-gray-100">
                  <div>
                    <div className="font-medium text-sm">{c.company_name}</div>
                    <div className="text-xs text-gray-500">{c.email}</div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <Link href={`/admin/dtdc/clients/${c.id}`}>
                      <Button size="sm" variant="outline">Open</Button>
                    </Link>
                    <div className="text-xs text-gray-400">#{c.id}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* small helper: stat row with colored dot */
function StatRow({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <span style={{ background: color }} className="w-3 h-3 rounded-full inline-block" />
        <div className="text-sm">{label}</div>
      </div>
      <div className="text-sm font-semibold">{value}</div>
    </div>
  );
}
