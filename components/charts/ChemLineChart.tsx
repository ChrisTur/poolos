import { chemStatus, CHEM_RANGES, type ChemKey } from "@/lib/chemistry"

interface DataPoint {
  date: Date
  value: number
}

interface Props {
  data: DataPoint[]
  chemKey: ChemKey
}

const DOT_COLOR: Record<string, string> = {
  ok:   "#16a34a",
  low:  "#d97706",
  high: "#dc2626",
}

export default function ChemLineChart({ data, chemKey }: Props) {
  const range = CHEM_RANGES[chemKey]
  const { low, high, unit, label } = range

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-36 text-xs text-gray-400 bg-gray-50 rounded-lg border border-gray-100">
        No readings recorded
      </div>
    )
  }

  const W = 560
  const H = 160
  const PAD = { top: 20, right: 16, bottom: 28, left: 44 }
  const iW = W - PAD.left - PAD.right
  const iH = H - PAD.top - PAD.bottom

  const vals = data.map((d) => d.value)
  const rawMin = Math.min(...vals)
  const rawMax = Math.max(...vals)

  const yMin = Math.max(0, Math.min(rawMin * 0.8, low * 0.8))
  const yMax = Math.max(rawMax * 1.2, high * 1.2)
  const yRange = yMax - yMin || 1

  const yScale = (v: number) => PAD.top + iH - ((v - yMin) / yRange) * iH
  const xScale = (i: number) =>
    data.length === 1
      ? PAD.left + iW / 2
      : PAD.left + (i / (data.length - 1)) * iW

  const bandTop = yScale(high)
  const bandBot = yScale(low)
  const points = data.map((d, i) => `${xScale(i)},${yScale(d.value)}`).join(" ")

  // Y-axis ticks
  const yTicks = [yMin, low, high, yMax].filter(
    (v, i, a) => a.findIndex((x) => Math.abs(x - v) < yRange * 0.05) === i
  )

  // X-axis labels — pick up to 5 evenly spaced
  const labelIdxs = (() => {
    if (data.length <= 5) return data.map((_, i) => i)
    const step = Math.ceil(data.length / 4)
    const idxs = Array.from({ length: Math.ceil(data.length / step) }, (_, i) => i * step)
    if (idxs[idxs.length - 1] !== data.length - 1) idxs.push(data.length - 1)
    return idxs
  })()

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-medium text-gray-700">{label}</span>
        <span className="text-xs text-gray-400">
          Normal: {low}–{high}{unit ? ` ${unit}` : ""}
        </span>
      </div>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full"
        style={{ height: 160 }}
        aria-label={`${label} trend chart`}
      >
        {/* Normal range band */}
        <rect
          x={PAD.left}
          y={bandTop}
          width={iW}
          height={Math.max(0, bandBot - bandTop)}
          fill="#dcfce7"
          opacity={0.7}
        />
        <line x1={PAD.left} y1={bandTop} x2={PAD.left + iW} y2={bandTop} stroke="#86efac" strokeWidth={1} strokeDasharray="4 2" />
        <line x1={PAD.left} y1={bandBot} x2={PAD.left + iW} y2={bandBot} stroke="#86efac" strokeWidth={1} strokeDasharray="4 2" />

        {/* Y-axis */}
        <line x1={PAD.left} y1={PAD.top} x2={PAD.left} y2={PAD.top + iH} stroke="#e5e7eb" strokeWidth={1} />
        {yTicks.map((v) => (
          <g key={v}>
            <line x1={PAD.left - 3} y1={yScale(v)} x2={PAD.left} y2={yScale(v)} stroke="#d1d5db" strokeWidth={1} />
            <text x={PAD.left - 6} y={yScale(v)} textAnchor="end" dominantBaseline="middle" fontSize={9} fill="#9ca3af">
              {v < 10 ? v.toFixed(1) : Math.round(v)}
            </text>
          </g>
        ))}

        {/* X-axis */}
        <line x1={PAD.left} y1={PAD.top + iH} x2={PAD.left + iW} y2={PAD.top + iH} stroke="#e5e7eb" strokeWidth={1} />
        {labelIdxs.map((i) => (
          <text key={i} x={xScale(i)} y={H - 4} textAnchor="middle" fontSize={8} fill="#9ca3af">
            {new Date(data[i].date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
          </text>
        ))}

        {/* Line */}
        {data.length > 1 && (
          <polyline points={points} fill="none" stroke="#0ea5e9" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
        )}

        {/* Dots */}
        {data.map((d, i) => {
          const s = chemStatus(chemKey, d.value) ?? "ok"
          return (
            <circle
              key={i}
              cx={xScale(i)}
              cy={yScale(d.value)}
              r={data.length === 1 ? 5 : 4}
              fill={DOT_COLOR[s]}
              stroke="white"
              strokeWidth={1.5}
            >
              <title>{new Date(d.date).toLocaleDateString()}: {d.value}{unit ? ` ${unit}` : ""}</title>
            </circle>
          )
        })}
      </svg>
    </div>
  )
}
