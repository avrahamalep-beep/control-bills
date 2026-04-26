"use client";

import { Pie, PieChart, Cell, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts";
import { t } from "@/lib/i18n";

const PIE_COL = ["#576544", "#8a9168", "#b5a880", "#6b7a52", "#4a5a3c", "#9daa7d", "#c4a574"];

type PieData = { name: string; value: number; color?: string }[];

export function SuperPie({ data, title }: { data: PieData; title: string }) {
  if (!data.length) return <p className="text-sm text-olive-600/80">{t.noData}</p>;
  return (
    <div className="h-64 w-full">
      <h3 className="mb-2 text-sm font-medium text-olive-800">{title}</h3>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Tooltip formatter={(v: number) => `₪${v.toFixed(0)}`} />
          <Legend />
          <Pie
            data={data}
            nameKey="name"
            dataKey="value"
            innerRadius={48}
            outerRadius={88}
            paddingAngle={2}
          >
            {data.map((e, i) => (
              <Cell key={e.name} fill={e.color ?? PIE_COL[i % PIE_COL.length]} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

export function YearBars({ byMonth, yearLabel }: { byMonth: { name: string; value: number }[]; yearLabel: string }) {
  return (
    <div className="h-72 w-full">
      <h3 className="mb-2 text-sm font-medium text-olive-800">
        {t.annualPays} {yearLabel}
      </h3>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={byMonth} margin={{ right: 8, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e0d0b4" />
          <XAxis dataKey="name" style={{ fontSize: 12, fill: "#353f2b" }} tick={{ textAnchor: "end" }} />
          <YAxis
            style={{ fontSize: 12, fill: "#353f2b" }}
            width={50}
            tickFormatter={(v) => (v as number) >= 1000 ? `₪${(v as number) / 1000}K` : `₪${v}`}
          />
          <Tooltip formatter={(v: number) => `₪${v.toFixed(0)}`} />
          <Bar dataKey="value" name="₪" fill="#445036" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
