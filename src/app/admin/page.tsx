"use client";

import { useEffect, useState, useMemo } from "react";
import toast from "react-hot-toast";
import Link from "next/link";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { providerIcon } from "@/components/admin/provider-icons"; // create below

/* -------------------------
   Page
   ------------------------- */
const PROVIDERS = [
  { key: "dtdc", name: "DTDC", href: "/admin/dtdc" },
  { key: "delhivery", name: "Delhivery", href: "/admin/delhivery" },
  { key: "xb", name: "XpressBees", href: "/admin/xpressbees" },
  { key: "maruti", name: "Maruti", href: "/admin/maruti" },
];

const COLORS = {
  delivered: "#10b981",
  pending: "#f59e0b",
  rto: "#ef4444",
  neutral: "#cbd5e1",
};

export default function PremiumDashboard() {
  const [stats, setStats] = useState<any>({});
  const [complaints, setComplaints] = useState<any[]>([]);
  const [pie, setPie] = useState<any>({ delivered: 0, pending: 0, rto: 0 });
  const [trend, setTrend] = useState<any[]>([]);
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
      setComplaints(json.complaints ?? []);
      setPie(json.pie ?? { delivered: 0, pending: 0, rto: 0 });
      setTrend(json.trend ?? []);
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

  return (
    <div className="min-h-screen p-4 space-y-6 bg-slate-50">
      {/* HERO */}
      <div className="flex items-start justify-between mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-extrabold">Analytics Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">Overview · Real-time insights · Actions</p>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="default" onClick={fetchDashboard} className="border px-3">Refresh</Button>
          <Link href={`/admin/upload`}>
            <Button variant="default">Upload XLSX</Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* LEFT — main content */}
        <div className="col-span-12 space-y-6">
          {/* Provider cards row */}
          <div className="grid grid-cols-4 gap-6 mt-4">
            {PROVIDERS.map((p) => {
              const d = stats[p.key] ?? { delivered:0, pending:0, rto:0, total:0 };

              const gradient =
                p.key === "dtdc"
                  ? "from-blue-500 to-blue-700"
                  : p.key === "delhivery"
                  ? "from-orange-500 to-red-500"
                  : p.key === "xb"
                  ? "from-yellow-400 to-orange-400"
                  : "from-purple-500 to-indigo-500";

              return (
                <Link key={p.key} href={p.href}>
                  <div className={`p-5 rounded-2xl shadow-sm hover:shadow-xl transition cursor-pointer bg-white`}>
                    
                    {/* Header */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg bg-gradient-to-br ${gradient} text-white text-xl`}>
                          {providerIcon(p.key)}
                        </div>
                        <div>
                          <div className="font-bold text-lg">{p.name}</div>
                          <div className="text-xs text-gray-500">Total: {d.total}</div>
                        </div>
                      </div>

                      <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-700">
                        Live
                      </span>
                    </div>

                    {/* Stats Pills */}
                    <div className="grid grid-cols-3 gap-3 text-center">
                      <div className="py-2 rounded-lg bg-green-50 text-green-700 font-semibold text-sm">
                        {d.delivered}<div className="text-xs font-normal">Delivered</div>
                      </div>
                      <div className="py-2 rounded-lg bg-yellow-50 text-yellow-700 font-semibold text-sm">
                        {d.pending}<div className="text-xs font-normal">Pending</div>
                      </div>
                      <div className="py-2 rounded-lg bg-red-50 text-red-700 font-semibold text-sm">
                        {d.rto}<div className="text-xs font-normal">RTO</div>
                      </div>
                    </div>
                    
                  </div>
                </Link>
              );
            })}
          </div>

          {/* Middle row: Complaints + Pie */}
          <div className="grid grid-cols-12 gap-4">
            <div className="col-span-8">
              {/* Trend chart (colored bars) */}
              <Card className="p-4 rounded-xl flex flex-col items-center">
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
            </div>

            <div className="col-span-4">
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
    </div>
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
  );
}
