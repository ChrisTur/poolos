"use client"

import { useState } from "react"
import { FlaskConical, ChevronDown, ChevronUp, CheckCircle2 } from "lucide-react"
import type { DoseResult } from "@/lib/chemistry"

export default function DosingPanel({ results }: { results: DoseResult[] }) {
  const [open, setOpen] = useState(true)
  const outOfRange = results.filter((r) => r.status !== "ok")
  const inRange    = results.filter((r) => r.status === "ok")

  return (
    <div className="rounded-xl border border-sky-200 bg-sky-50 overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-2.5 text-left"
      >
        <div className="flex items-center gap-2">
          <FlaskConical className="w-4 h-4 text-sky-600" />
          <span className="text-sm font-semibold text-sky-900">Dosing Recommendations</span>
          {outOfRange.length === 0
            ? <span className="text-xs font-medium text-green-700 bg-green-100 px-2 py-0.5 rounded-full">All in range</span>
            : <span className="text-xs font-medium text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">{outOfRange.length} need attention</span>}
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-sky-600" /> : <ChevronDown className="w-4 h-4 text-sky-600" />}
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-2 border-t border-sky-200">
          {outOfRange.map((r) => (
            <div key={r.key} className={`rounded-lg px-3 py-2.5 border ${r.status === "low" ? "bg-amber-50 border-amber-200" : "bg-red-50 border-red-200"}`}>
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="text-xs font-semibold text-gray-800">{r.label}</span>
                <span className={`text-xs font-bold ${r.status === "low" ? "text-amber-700" : "text-red-700"}`}>
                  {r.current}{r.unit ? ` ${r.unit}` : ""} {r.status === "low" ? "▼ Low" : "▲ High"}
                </span>
              </div>
              {r.actions.slice(0, 1).map((a, i) => (
                <p key={i} className="text-xs text-gray-700">
                  <span className="font-medium">{a.chemical}</span>
                  {a.amount && <span className="ml-1 font-bold text-sky-700">{a.amount}</span>}
                  {a.note && <span className="ml-1 text-gray-500">— {a.note}</span>}
                </p>
              ))}
              {r.actions.length > 1 && (
                <p className="text-xs text-gray-400 mt-1">or {r.actions.slice(1).map((a) => a.chemical).join(" / ")}</p>
              )}
            </div>
          ))}
          {inRange.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {inRange.map((r) => (
                <span key={r.key} className="inline-flex items-center gap-1 text-xs text-green-700 bg-green-50 border border-green-200 rounded-full px-2 py-0.5">
                  <CheckCircle2 className="w-3 h-3" />{r.label}
                </span>
              ))}
            </div>
          )}
          <p className="text-xs text-gray-400 pt-1">
            Always follow product directions and retest before swimming.
          </p>
        </div>
      )}
    </div>
  )
}
