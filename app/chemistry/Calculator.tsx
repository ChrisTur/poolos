"use client"

import { useState } from "react"
import Link from "next/link"
import {
  calcVolumeGal,
  runDosing,
  type PoolShape,
  type ChemReading,
  type DoseResult,
} from "@/lib/chemistry"
import { CheckCircle2, AlertTriangle, XCircle, ChevronDown, ChevronUp, FlaskConical, Droplets } from "lucide-react"

// ── Helpers ──────────────────────────────────────────────────────────────────

const SHAPES: { value: PoolShape; label: string }[] = [
  { value: "rectangular", label: "Rectangular" },
  { value: "round",       label: "Round / Circular" },
  { value: "oval",        label: "Oval" },
  { value: "kidney",      label: "Kidney" },
]

const inputCls = "w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
const labelCls = "block text-xs font-semibold text-gray-600 mb-1"

function StatusBadge({ status }: { status: DoseResult["status"] }) {
  if (status === "ok")   return <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-green-100 text-green-700"><CheckCircle2 className="w-3.5 h-3.5" />In range</span>
  if (status === "low")  return <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-100 text-amber-700"><AlertTriangle className="w-3.5 h-3.5" />Too low</span>
  return <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-red-100 text-red-700"><XCircle className="w-3.5 h-3.5" />Too high</span>
}

function RangeBar({ current, min, max }: { current: number; min: number; max: number }) {
  // Show ±50% outside the range on each side
  const span  = max - min
  const lo    = min - span * 0.5
  const hi    = max + span * 0.5
  const total = hi - lo
  const pct   = Math.min(100, Math.max(0, ((current - lo) / total) * 100))
  const okL   = ((min - lo) / total) * 100
  const okW   = (span / total) * 100

  return (
    <div className="relative h-2 rounded-full bg-gray-100 overflow-hidden mt-2">
      <div className="absolute top-0 bottom-0 bg-green-100 rounded-full" style={{ left: `${okL}%`, width: `${okW}%` }} />
      <div
        className="absolute top-0 bottom-0 w-2.5 h-2.5 -mt-0.5 -ml-1 rounded-full border-2 border-white shadow"
        style={{
          left: `${pct}%`,
          background: current < min ? "#f59e0b" : current > max ? "#ef4444" : "#22c55e",
        }}
      />
    </div>
  )
}

function ResultCard({ r }: { r: DoseResult }) {
  const [open, setOpen] = useState(r.status !== "ok")

  const borderCls =
    r.status === "ok"   ? "border-green-200 bg-green-50/30" :
    r.status === "low"  ? "border-amber-200 bg-amber-50/30" :
                          "border-red-200   bg-red-50/30"

  return (
    <div className={`rounded-2xl border ${borderCls} overflow-hidden`}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-5 py-4 text-left gap-4"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="font-semibold text-gray-900 text-sm">{r.label}</span>
            <StatusBadge status={r.status} />
          </div>
          <div className="flex items-center gap-2 mt-1.5">
            <span className="text-lg font-bold text-gray-900">
              {r.unit === "" ? r.current.toFixed(1) : r.current}{r.unit && ` ${r.unit}`}
            </span>
            <span className="text-xs text-gray-400">
              Target: {r.min}–{r.max}{r.unit && ` ${r.unit}`}
            </span>
          </div>
          <RangeBar current={r.current} min={r.min} max={r.max} />
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-gray-400 shrink-0" /> : <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />}
      </button>

      {open && (
        <div className="px-5 pb-5 space-y-4 border-t border-current/10">
          {r.actions.length > 0 && (
            <div className="space-y-3 pt-4">
              {r.actions.map((a, i) => (
                <div key={i} className="bg-white rounded-xl border border-gray-200 px-4 py-3">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <span className="text-sm font-medium text-gray-800">{a.chemical}</span>
                    {a.amount && (
                      <span className="text-sm font-bold text-sky-700 shrink-0 font-mono">{a.amount}</span>
                    )}
                  </div>
                  {a.note && <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">{a.note}</p>}
                </div>
              ))}
              {r.actions.length > 1 && (
                <p className="text-xs text-gray-400 italic">Choose one option above — do not combine multiple chemicals at once.</p>
              )}
            </div>
          )}
          {r.tip && (
            <p className="text-xs text-gray-500 bg-white/80 rounded-lg px-3 py-2 border border-gray-100 leading-relaxed">
              💡 {r.tip}
            </p>
          )}
        </div>
      )}
    </div>
  )
}

// ── Main calculator ───────────────────────────────────────────────────────────

const DEFAULT: ChemReading = {
  volume: 15000, fc: 0, ph: 0, ta: 0, ch: 0, cya: 0, salt: 0, saltwater: false,
}

export default function Calculator() {
  const [showDimCalc, setShowDimCalc] = useState(false)
  const [shape, setShape]             = useState<PoolShape>("rectangular")
  const [length, setLength]           = useState("")
  const [width, setWidth]             = useState("")
  const [depth, setDepth]             = useState("")
  const [form, setForm]               = useState<ChemReading>(DEFAULT)
  const [results, setResults]         = useState<DoseResult[] | null>(null)

  const set = (field: keyof ChemReading, raw: string) =>
    setForm((f) => ({ ...f, [field]: raw === "" ? 0 : parseFloat(raw) }))

  const calcVolume = () => {
    const l = parseFloat(length), w = parseFloat(width), d = parseFloat(depth)
    if (!isNaN(l) && !isNaN(d)) {
      const vol = calcVolumeGal({ shape, length: l, width: isNaN(w) ? l : w, depth: d })
      setForm((f) => ({ ...f, volume: vol }))
      setShowDimCalc(false)
    }
  }

  const calculate = (e: React.FormEvent) => {
    e.preventDefault()
    setResults(runDosing(form))
    setTimeout(() => document.getElementById("chem-results")?.scrollIntoView({ behavior: "smooth", block: "start" }), 50)
  }

  return (
    <div className="space-y-8">
      {/* ── Input form ─────────────────────────────────────────────────── */}
      <form onSubmit={calculate} className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">

        {/* Pool size */}
        <div className="px-6 py-5 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">Pool size</h2>
          <div className="flex items-end gap-3 flex-wrap">
            <div className="flex-1 min-w-[180px]">
              <label className={labelCls}>Volume (gallons)</label>
              <input
                type="number" min="100" max="500000"
                value={form.volume || ""}
                onChange={(e) => setForm((f) => ({ ...f, volume: parseFloat(e.target.value) || 0 }))}
                placeholder="e.g. 15000"
                className={inputCls}
              />
            </div>
            <button
              type="button"
              onClick={() => setShowDimCalc((v) => !v)}
              className="text-sm font-medium text-sky-600 hover:text-sky-700 whitespace-nowrap pb-2.5"
            >
              {showDimCalc ? "Hide" : "Calculate from dimensions"}
            </button>
          </div>

          {showDimCalc && (
            <div className="mt-4 space-y-3 bg-gray-50 rounded-xl p-4 border border-gray-100">
              <div>
                <label className={labelCls}>Pool shape</label>
                <select value={shape} onChange={(e) => setShape(e.target.value as PoolShape)} className={inputCls}>
                  {SHAPES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className={labelCls}>{shape === "round" ? "Diameter (ft)" : "Length (ft)"}</label>
                  <input type="number" min="1" value={length} onChange={(e) => setLength(e.target.value)} placeholder="40" className={inputCls} />
                </div>
                {shape !== "round" && (
                  <div>
                    <label className={labelCls}>Width (ft)</label>
                    <input type="number" min="1" value={width} onChange={(e) => setWidth(e.target.value)} placeholder="20" className={inputCls} />
                  </div>
                )}
                <div>
                  <label className={labelCls}>Avg depth (ft)</label>
                  <input type="number" min="1" step="0.5" value={depth} onChange={(e) => setDepth(e.target.value)} placeholder="5" className={inputCls} />
                </div>
              </div>
              <button type="button" onClick={calcVolume} className="text-sm font-semibold text-sky-600 hover:text-sky-700">
                → Apply calculated volume
              </button>
            </div>
          )}

          <div className="mt-3 flex items-center gap-3">
            <input
              id="saltwater"
              type="checkbox"
              checked={form.saltwater}
              onChange={(e) => setForm((f) => ({ ...f, saltwater: e.target.checked }))}
              className="w-4 h-4 rounded border-gray-300 text-sky-600 focus:ring-sky-500"
            />
            <label htmlFor="saltwater" className="text-sm text-gray-700 select-none cursor-pointer">Saltwater pool</label>
          </div>
        </div>

        {/* Current readings */}
        <div className="px-6 py-5">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">Current test readings</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { field: "fc"  as const, label: "Free Chlorine",            placeholder: "e.g. 1.5", hint: "Target: 1–3 ppm",   step: "0.1" },
              { field: "ph"  as const, label: "pH",                        placeholder: "e.g. 7.4", hint: "Target: 7.2–7.6",   step: "0.1" },
              { field: "ta"  as const, label: "Total Alkalinity",          placeholder: "e.g. 100", hint: "Target: 80–120 ppm", step: "1"   },
              { field: "ch"  as const, label: "Calcium Hardness",          placeholder: "e.g. 250", hint: "Target: 200–400 ppm", step: "1"  },
              { field: "cya" as const, label: "Cyanuric Acid (Stabilizer)", placeholder: "e.g. 40", hint: "Target: 30–50 ppm",  step: "1"   },
              ...(form.saltwater ? [{ field: "salt" as const, label: "Salt Level", placeholder: "e.g. 3200", hint: "Target: 2700–3400 ppm", step: "10" }] : []),
            ].map(({ field, label, placeholder, hint, step }) => (
              <div key={field}>
                <label className={labelCls}>{label}</label>
                <input
                  type="number" min="0" step={step}
                  value={form[field] || ""}
                  onChange={(e) => set(field, e.target.value)}
                  placeholder={placeholder}
                  className={inputCls}
                />
                <p className="text-xs text-gray-400 mt-1">{hint}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="px-6 pb-6">
          <button
            type="submit"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-sky-600 hover:bg-sky-700 text-white font-semibold text-sm px-8 py-3 rounded-xl transition-colors"
          >
            <FlaskConical className="w-4 h-4" />
            Calculate dosing
          </button>
        </div>
      </form>

      {/* ── Results ────────────────────────────────────────────────────── */}
      {results && (
        <div id="chem-results" className="space-y-4 scroll-mt-8">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900">Results</h2>
            <span className="text-xs text-gray-400">Based on {form.volume.toLocaleString()} gal pool</span>
          </div>

          {/* Summary row */}
          <div className="grid grid-cols-3 gap-3">
            {(["ok", "low", "high"] as const).map((s) => {
              const count = results.filter((r) => r.status === s).length
              return (
                <div key={s} className={`rounded-xl border px-4 py-3 text-center ${
                  s === "ok"   ? "border-green-200 bg-green-50"  :
                  s === "low"  ? "border-amber-200 bg-amber-50"  :
                                 "border-red-200   bg-red-50"
                }`}>
                  <p className={`text-2xl font-bold ${
                    s === "ok" ? "text-green-700" : s === "low" ? "text-amber-700" : "text-red-700"
                  }`}>{count}</p>
                  <p className="text-xs font-medium text-gray-600 capitalize">{s === "ok" ? "In range" : s === "low" ? "Too low" : "Too high"}</p>
                </div>
              )
            })}
          </div>

          {/* Parameter cards — out of range first */}
          <div className="space-y-3">
            {[...results].sort((a, b) => (a.status === "ok" ? 1 : 0) - (b.status === "ok" ? 1 : 0)).map((r) => (
              <ResultCard key={r.key} r={r} />
            ))}
          </div>

          <p className="text-xs text-gray-400 text-center leading-relaxed pt-2">
            Amounts are approximate and based on standard product concentrations. Always follow manufacturer directions,
            add chemicals one at a time, and retest before swimming.
          </p>

          {/* CTA */}
          <div className="rounded-2xl bg-sky-600 px-6 py-6 text-center space-y-3">
            <Droplets className="w-8 h-8 text-sky-200 mx-auto" />
            <h3 className="text-white font-bold text-lg">Track chemical logs for every customer</h3>
            <p className="text-sky-100 text-sm max-w-sm mx-auto">
              PoolOS lets you record chlorine, pH, and more on every service visit — so you always know what a pool looked like last week.
            </p>
            <Link
              href="/register"
              className="inline-block bg-white text-sky-700 font-semibold text-sm px-6 py-2.5 rounded-xl hover:bg-sky-50 transition-colors"
            >
              Start free 14-day trial
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
