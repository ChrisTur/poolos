"use client"

import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { useCallback } from "react"
import { Calendar } from "lucide-react"

const PRESETS = [
  { key: "7d",   label: "7 days" },
  { key: "30d",  label: "30 days" },
  { key: "90d",  label: "90 days" },
  { key: "ytd",  label: "YTD" },
  { key: "all",  label: "All time" },
]

interface Props {
  /** URL param names — default "from" / "to" / "period" */
  fromParam?: string
  toParam?: string
  periodParam?: string
}

function todayStr() {
  return new Date().toISOString().slice(0, 10)
}

export default function DateRangePicker({ fromParam = "from", toParam = "to", periodParam = "period" }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const currentPeriod = searchParams.get(periodParam) ?? "30d"
  const currentFrom   = searchParams.get(fromParam) ?? ""
  const currentTo     = searchParams.get(toParam)   ?? ""

  const isCustom = !!currentFrom || !!currentTo

  const setParams = useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString())
      for (const [k, v] of Object.entries(updates)) {
        if (v == null) params.delete(k)
        else params.set(k, v)
      }
      router.push(`${pathname}?${params.toString()}`)
    },
    [router, pathname, searchParams]
  )

  function selectPreset(key: string) {
    setParams({ [periodParam]: key, [fromParam]: null, [toParam]: null })
  }

  function applyCustom(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const from = fd.get("from") as string
    const to   = fd.get("to")   as string
    if (from && to) {
      setParams({ [fromParam]: from, [toParam]: to, [periodParam]: null })
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Preset buttons */}
      <div className="flex gap-1">
        {PRESETS.map((p) => (
          <button
            key={p.key}
            onClick={() => selectPreset(p.key)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              !isCustom && currentPeriod === p.key
                ? "bg-sky-600 text-white"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Custom date range */}
      <form onSubmit={applyCustom} className="flex items-center gap-1.5">
        <Calendar className="w-3.5 h-3.5 text-gray-400 ml-1" />
        <input
          type="date"
          name="from"
          defaultValue={currentFrom || ""}
          max={todayStr()}
          className={`rounded-lg border px-2 py-1.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-sky-500 ${
            isCustom ? "border-sky-400 bg-sky-50" : "border-gray-300"
          }`}
        />
        <span className="text-gray-400 text-xs">–</span>
        <input
          type="date"
          name="to"
          defaultValue={currentTo || ""}
          max={todayStr()}
          className={`rounded-lg border px-2 py-1.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-sky-500 ${
            isCustom ? "border-sky-400 bg-sky-50" : "border-gray-300"
          }`}
        />
        <button
          type="submit"
          className="px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-sm font-medium text-gray-700 transition-colors"
        >
          Apply
        </button>
      </form>
    </div>
  )
}
