import React from "react";
import { ResponsiveContainer, BarChart, Bar, Cell, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

export default function LeadsChart({ title, data = [] }: { title: string; data: { date: string; value: number; color?: string }[] }) {
  const enriched = data.map(d => ({
    ...d,
    color: d.color ?? (d.value === 0 ? "#cbd5e1" : d.value < 20 ? "#f59e0b" : d.value < 60 ? "#3b82f6" : "#10b981")
  }));

  return (
    <div>
      <h3 className="text-lg font-semibold mb-3">{title}</h3>
      <div style={{ width: "100%", height: 220 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={enriched}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" tick={{ fontSize: 11 }} />
            <YAxis />
            <Tooltip />
            <Bar dataKey="value">
              {enriched.map((entry, i) => <Cell key={`c-${i}`} fill={entry.color} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
