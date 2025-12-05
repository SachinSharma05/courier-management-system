"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export default function LeadsChart({
  title,
  data,
}: {
  title: string;
  data: { date: string; value: number }[];
}) {
  return (
    <div className="bg-white border rounded-xl shadow-sm p-6">
      <div className="flex justify-between mb-4">
        <h3 className="text-xl font-semibold">{title}</h3>

        <div className="flex items-center gap-3 text-sm">
          <select className="border rounded px-2 py-1">
            <option>India</option>
            <option>Canada</option>
          </select>

          <select className="border rounded px-2 py-1">
            <option>This Month</option>
            <option>This Week</option>
            <option>Today</option>
          </select>
        </div>
      </div>

      <div className="w-full h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <XAxis dataKey="date" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip cursor={{ fill: "rgba(0,0,0,0.05)" }} />
            <Bar dataKey="value" fill="#000" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
