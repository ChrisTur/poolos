"use client"

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"

interface Visit {
  visitedAt: Date
  chlorine: number | null
  ph: number | null
  alkalinity: number | null
  calcium: number | null
}

interface ChemicalChartProps {
  visits: Visit[]
}

function formatXAxis(dateStr: string) {
  const d = new Date(dateStr)
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" })
}

export default function ChemicalChart({ visits }: ChemicalChartProps) {
  // Filter to visits with at least one reading, then sort oldest-first for the chart
  const filtered = visits
    .filter((v) => v.chlorine != null || v.ph != null || v.alkalinity != null || v.calcium != null)
    .sort((a, b) => new Date(a.visitedAt).getTime() - new Date(b.visitedAt).getTime())

  if (filtered.length === 0) return null

  const data = filtered.map((v) => ({
    date: new Date(v.visitedAt).toISOString(),
    chlorine: v.chlorine,
    ph: v.ph,
    alkalinity: v.alkalinity,
    calcium: v.calcium,
  }))

  const hasChlorine  = data.some((d) => d.chlorine  != null)
  const hasPh        = data.some((d) => d.ph        != null)
  const hasAlkalinity = data.some((d) => d.alkalinity != null)
  const hasCalcium   = data.some((d) => d.calcium   != null)

  return (
    <ResponsiveContainer width="100%" height={240}>
      <LineChart data={data} margin={{ top: 4, right: 16, left: -16, bottom: 0 }}>
        <XAxis
          dataKey="date"
          tickFormatter={formatXAxis}
          tick={{ fontSize: 11, fill: "#9ca3af" }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
        <Tooltip
          labelFormatter={(label) => formatXAxis(label as string)}
          contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e5e7eb" }}
        />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        {hasChlorine && (
          <Line
            type="monotone"
            dataKey="chlorine"
            name="Chlorine"
            stroke="#3b82f6"
            dot={false}
            strokeWidth={2}
            connectNulls
          />
        )}
        {hasPh && (
          <Line
            type="monotone"
            dataKey="ph"
            name="pH"
            stroke="#22c55e"
            dot={false}
            strokeWidth={2}
            connectNulls
          />
        )}
        {hasAlkalinity && (
          <Line
            type="monotone"
            dataKey="alkalinity"
            name="Alkalinity"
            stroke="#f97316"
            dot={false}
            strokeWidth={2}
            connectNulls
          />
        )}
        {hasCalcium && (
          <Line
            type="monotone"
            dataKey="calcium"
            name="Calcium"
            stroke="#a855f7"
            dot={false}
            strokeWidth={2}
            connectNulls
          />
        )}
      </LineChart>
    </ResponsiveContainer>
  )
}
