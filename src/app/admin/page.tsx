"use client";

import { useEffect, useState, useMemo } from "react";
import toast from "react-hot-toast";
import Link from "next/link";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { providerIcon } from "@/components/admin/provider-icons"; // create below

/* -------------------------
   Small helper components
   ------------------------- */

function Counter({ value = 0, duration = 800 }: { value?: number; duration?: number }) {
  const [current, setCurrent] = useState(0);
  useEffect(() => {
    let start = 0;
    const stepTime = Math.max(10, Math.floor(duration / Math.max(1, value)));
    const handle = setInterval(() => {
      start += Math.max(1, Math.round(value / (duration / stepTime)));
      if (start >= value) {
        setCurrent(value);
        clearInterval(handle);
      } else {
        setCurrent(start);
      }
    }, stepTime);
    return () => clearInterval(handle);
  }, [value, duration]);
  return <span className="text-2xl font-bold">{current.toLocaleString()}</span>;
}

function StatRow({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <span style={{ background: color }} className="w-3 h-3 rounded-full inline-block" />
        <div className="text-sm text-gray-600">{label}</div>
      </div>
      <div className="text-sm font-semibold">{value ?? 0}</div>
    </div>
  );
}

/* -------------------------
   Page
   ------------------------- */

const PROVIDERS = [
  { key: "dtdc", name: "DTDC", href: "/admin/dtdc" },
  { key: "delh", name: "Delhivery", href: "/admin/delhivery" },
  { key: "xb", name: "XpressBees", href: "/admin/xpressbees" },
  { key: "aramax", name: "Aramex", href: "/admin/aramex" },
];

const COLORS = {
  delivered: "#10b981",
  pending: "#f59e0b",
  rto: "#ef4444",
  neutral: "#cbd5e1",
};

export default function PremiumDashboard() {
  const [stats, setStats] = useState<any>({});
  const [clients, setClients] = useState<any[]>([]);
  const [complaints, setComplaints] = useState<any[]>([]);
  const [pie, setPie] = useState<any>({ delivered: 0, pending: 0, rto: 0 });
  const [trend, setTrend] = useState<any[]>([]);
  const [recent, setRecent] = useState<any[]>([]);
  const [retail, setRetail] = useState<number>();
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");

  async function fetchDashboard() {
    setLoading(true);
    try {
      // use client revalidate hint so Vercel/Next caching can help
      const res = await fetch("/api/admin/dashboard", { next: { revalidate: 60 } });
      const json = await res.json();
      if (!json.ok) {
        toast.error("Failed to load dashboard");
        return;
      }
      setStats(json.providers ?? {});
      setClients(json.clients ?? []);
      setComplaints(json.complaints ?? []);
      setPie(json.pie ?? { delivered: 0, pending: 0, rto: 0 });
      setTrend(json.trend ?? []);
      setRecent(json.recent ?? []);
      setRetail(json.retailBookings ?? 0);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchDashboard(); }, []);

  // combined pie data
  const combined = useMemo(() => {
    return ["delivered", "pending", "rto"].map((k) => ({
      name: k,
      value:
        (stats.dtdc?.[k] || 0) +
        (stats.delh?.[k] || 0) +
        (stats.xb?.[k] || 0) +
        (stats.aramax?.[k] || 0),
    }));
  }, [stats]);

  // filtered clients for sidebar search
  const filteredClients = clients.filter((c: any) => {
    if (!q) return true;
    const s = q.toLowerCase();
    return (c.company_name || "").toLowerCase().includes(s) || (c.email || "").toLowerCase().includes(s);
  });

  return (
    <div className="min-h-screen p-2 bg-slate-50">
      {/* HERO */}
      <div className="flex items-start justify-between mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-extrabold">Analytics Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">Overview · Real-time insights · Actions</p>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="ghost" onClick={fetchDashboard} className="border px-3">Refresh</Button>
          <Link href={`/admin/upload`}>
            <Button variant="default">Upload XLSX</Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* LEFT — main content */}
        <div className="col-span-8 space-y-6">
          {/* KPI Grid */}
          <div className="grid grid-cols-4 gap-4">
            <Card className="p-4 rounded-xl shadow-sm hover:shadow-lg transition transform hover:-translate-y-1">
              <div className="text-xs text-gray-500">Total Revenue</div>
              <div className="mt-2"><Counter value={stats.billing?.totalRevenue ?? 0} /></div>
              <div className="text-xs text-gray-400 mt-1">Monthly trend • Revenue</div>
            </Card>

            <Card className="p-4 rounded-xl shadow-sm hover:shadow-lg transition transform hover:-translate-y-1">
              <div className="text-xs text-gray-500">Retail Bookings</div>
              <div className="mt-2"><Counter value={(retail)} /></div>
              <div className="text-xs text-gray-400 mt-1">Counter Booking</div>
            </Card>

            <Card className="p-4 rounded-xl shadow-sm hover:shadow-lg transition transform hover:-translate-y-1">
              <div className="text-xs text-gray-500">Avg Price / Unit</div>
              <div className="mt-2"><Counter value={42} /></div>
              <div className="text-xs text-gray-400 mt-1">Estimated</div>
            </Card>

            <Card className="p-4 rounded-xl shadow-sm hover:shadow-lg transition transform hover:-translate-y-1">
              <div className="text-xs text-gray-500">Open Complaints</div>
              <div className="mt-2"><Counter value={ (complaints || []).filter((x:any)=>x.status==='open').length } /></div>
              <div className="text-xs text-gray-400 mt-1">Needs attention</div>
            </Card>
          </div>

          {/* Provider cards row */}
          <div className="grid grid-cols-2 gap-4">
            {PROVIDERS.map(p => {
              const d = stats[p.key] ?? { delivered:0, pending:0, rto:0, total:0 };

              return (
                <Link key={p.key} href={p.href}>
                  <Card className="p-4 rounded-xl hover:shadow-xl transition transform hover:-translate-y-1 cursor-pointer">
                    
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="text-2xl">{providerIcon(p.key)}</div>
                        <div>
                          <div className="text-lg font-semibold">{p.name}</div>
                          <div className="text-xs text-gray-400">Total: {d.total ?? 0}</div>
                        </div>
                      </div>
                      <div className="text-xs text-gray-400">Live</div>
                    </div>

                    <div className="space-y-2">
                      <StatRow label="Delivered" value={d.delivered} color={COLORS.delivered}/>
                      <StatRow label="Pending" value={d.pending} color={COLORS.pending}/>
                      <StatRow label="RTO" value={d.rto} color={COLORS.rto}/>
                    </div>

                  </Card>
                </Link>
              );
            })}
          </div>

          {/* Middle row: Complaints + Pie */}
          <div className="grid grid-cols-12 gap-4">
            <div className="col-span-7">
              <Card className="p-4 rounded-xl">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Recent Complaints</h3>
                  <div className="text-sm text-gray-500">{complaints.length} results</div>
                </div>

                <div className="divide-y rounded-lg border max-h-[300px] overflow-y-auto">
                  {complaints.length === 0 ? (
                    <div className="p-6 text-gray-500 text-center">No complaints found</div>
                  ) : complaints.map((c:any) => (
                    <div key={c.id} className="p-4 hover:bg-slate-50 transition flex justify-between">
                      <div>
                        <div className="flex items-center gap-3">
                          <span className={`px-2 py-0.5 rounded text-xs ${c.status==='open'?'bg-red-100 text-red-700':c.status==='in_progress'?'bg-yellow-100 text-yellow-700':'bg-green-100 text-green-700'}`}>
                            {c.status}
                          </span>
                          <div className="text-sm font-medium">AWB: {c.awb ?? "—"}</div>
                        </div>
                        <div className="text-xs text-gray-600 mt-1">{c.message ?? c.note ?? "No message"}</div>
                      </div>

                      <div className="text-xs text-right text-gray-500">
                        <div>{new Date(c.updated_at ?? Date.now()).toLocaleString()}</div>
                        <Link href={`/admin/complaints/${c.id}`}>
                          <Button size="sm" variant="outline" className="mt-2">Open</Button>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>

            <div className="col-span-5">
              <Card className="p-4 rounded-xl flex flex-col items-center">
                <h3 className="text-lg font-semibold mb-2">Status Breakdown</h3>
                <div className="w-full h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={combined} dataKey="value" nameKey="name" innerRadius={60} outerRadius={85} paddingAngle={4}>
                        {combined.map((entry, idx) => (
                          <Cell key={idx} fill={entry.name === "delivered" ? COLORS.delivered : entry.name === "pending" ? COLORS.pending : COLORS.rto} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="w-full mt-4 grid grid-cols-3 gap-3 text-sm">
                  {combined.map(c => (
                    <div key={c.name} className="flex items-center justify-between px-3">
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full" style={{background: c.name === "delivered" ? COLORS.delivered : c.name === "pending" ? COLORS.pending : COLORS.rto}} />
                        <div className="capitalize text-gray-600">{c.name}</div>
                      </div>
                      <div className="font-semibold">{c.value}</div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </div>
        </div>
        {/* RIGHT SIDEBAR */}
        <div className="col-span-4">
          <Card className="p-4 rounded-xl sticky top-6">
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="text-xs text-gray-400">DTDC → CPDP</div>
                <div className="text-lg font-semibold">Clients</div>
              </div>
              <Link href="/admin/dtdc/clients"><Button size="sm" variant="outline">All</Button></Link>
            </div>

            <div className="mb-3">
              <input value={q} onChange={(e)=>setQ(e.target.value)} placeholder="Search clients..." className="w-full border px-3 py-2 rounded-md text-sm" />
            </div>

            <div className="space-y-2 max-h-[680px] overflow-y-auto">
              {loading ? (
                <div className="text-sm text-gray-500 p-4">Loading clients...</div>
              ) : filteredClients.length === 0 ? (
                <div className="text-sm text-gray-500 p-4">No clients found</div>
              ) : (
                filteredClients.map((c:any) => (
                  <div key={c.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-white transition">
                    <div>
                      <div className="font-medium text-sm">{c.company_name}</div>
                      <div className="text-xs text-gray-500">{c.email}</div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <Link href={`/admin/dtdc/clients/${c.id}`}><Button size="sm" variant="outline">Open</Button></Link>
                      <div className="text-xs text-gray-400">#{c.id}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
    </div>

      {/* Trend chart (colored bars) */}
      <Card className="p-4 rounded-xl">
        <h3 className="text-lg font-semibold mb-2">Trend: Bookings (by time window)</h3>
        <div className="w-full h-56">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={trend.map((t:any)=>({ label: t.label, value: t.value }))} margin={{ left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value">
                {trend.map((t:any, idx:number) => {
                  const v = t.value;
                  const color = v === 0 ? COLORS.neutral : v < 20 ? COLORS.pending : v < 60 ? "#3b82f6" : COLORS.delivered;
                  return <Cell key={idx} fill={color} />;
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Recent consignments table */}
      <Card className="p-4 rounded-xl">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold">Recent Consignments</h3>
          <Link href="/admin/consignments"><Button size="sm" variant="outline">View all</Button></Link>
        </div>

        <div className="border rounded-lg overflow-hidden">
          {recent.length === 0 ? (
            <div className="p-6 text-center text-gray-500">No recent consignments</div>
          ) : (
            recent.map((r:any) => (
              <div key={r.id} className="flex items-center justify-between p-3 hover:bg-slate-50 transition">
                <div>
                  <div className="font-medium">AWB: {r.awb}</div>
                  <div className="text-xs text-gray-500">Providers: {(r.providers || []).join(", ")}</div>
                </div>
                <div className="text-right text-sm">
                  <div className="text-sm">{r.last_status}</div>
                  <div className="text-xs text-gray-400">{new Date(r.lastUpdatedOn ?? r.last_updated_on ?? Date.now()).toLocaleString()}</div>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}
