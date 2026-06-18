"use client"

import { formatCurrency } from "@/lib/utils"

// Circle with r=15.9155 has circumference ≈ 100, making stroke-dasharray values == percentages directly
const R  = 15.9155
const CX = 21
const CY = 21
const SW = 7  // strokeWidth

const COLORS: Record<string, string> = {
  cash:    "#10b981", // green
  check:   "#3b82f6", // blue
  card:    "#6366f1", // indigo
  ach:     "#8b5cf6", // violet
  venmo:   "#3D95CE",
  paypal:  "#009CDE",
  cashapp: "#00A86B",
  zelle:   "#6D1ED4",
  other:   "#f59e0b", // amber
  unknown: "#d1d5db", // gray
}

const LABELS: Record<string, string> = {
  cash:    "Cash",
  check:   "Check",
  card:    "Card",
  ach:     "ACH",
  venmo:   "Venmo",
  paypal:  "PayPal",
  cashapp: "Cash App",
  zelle:   "Zelle",
  other:   "Other",
  unknown: "Unspecified",
}

export interface PaymentSlice {
  method: string
  amount: number
  percent: number
}

export default function PaymentDonut({
  slices,
  total,
}: {
  slices: PaymentSlice[]
  total: number
}) {
  if (total === 0) {
    return (
      <p className="text-sm text-gray-400 text-center py-10">
        No payments recorded in this period.
      </p>
    )
  }

  // Build segments: each accumulates the offset from the 12-o'clock start (offset=25)
  let runningOffset = 25
  const segments = slices.map((s) => {
    const offset = runningOffset
    runningOffset -= s.percent
    return { ...s, offset }
  })

  return (
    <div className="flex flex-col sm:flex-row items-center gap-6 py-2">
      {/* SVG donut */}
      <div className="relative shrink-0">
        <svg viewBox="0 0 42 42" className="w-40 h-40 -rotate-90">
          {/* Background ring */}
          <circle
            cx={CX} cy={CY} r={R}
            fill="none"
            stroke="#f3f4f6"
            strokeWidth={SW}
          />
          {segments.map((s) => (
            <circle
              key={s.method}
              cx={CX} cy={CY} r={R}
              fill="none"
              stroke={COLORS[s.method] ?? "#9ca3af"}
              strokeWidth={SW}
              strokeDasharray={`${s.percent} ${100 - s.percent}`}
              strokeDashoffset={s.offset}
            />
          ))}
        </svg>
        {/* Center label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <p className="text-xs text-gray-400 leading-none">Total</p>
          <p className="text-sm font-bold text-gray-900 mt-0.5">{formatCurrency(total)}</p>
        </div>
      </div>

      {/* Legend */}
      <div className="flex-1 space-y-2.5 min-w-0 w-full sm:w-auto">
        {slices.map((s) => (
          <div key={s.method} className="flex items-center gap-2.5">
            <span
              className="w-2.5 h-2.5 rounded-full shrink-0"
              style={{ background: COLORS[s.method] ?? "#9ca3af" }}
            />
            <span className="text-sm text-gray-600 flex-1 truncate">
              {LABELS[s.method] ?? s.method}
            </span>
            <span className="text-sm font-semibold text-gray-900">
              {formatCurrency(s.amount)}
            </span>
            <span className="text-xs text-gray-400 w-9 text-right shrink-0">
              {s.percent < 1 ? "<1" : Math.round(s.percent)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
