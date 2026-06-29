"use client"

import { useState, useTransition } from "react"
import { Zap, X, Navigation } from "lucide-react"
import { optimizeRoute } from "@/lib/actions/routes"

export default function OptimizeButton({
  routeId,
  stopCount,
  defaultStart = "",
}: {
  routeId: string
  stopCount: number
  defaultStart?: string
}) {
  const [pending, startTransition] = useTransition()
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null)
  const [expanded, setExpanded] = useState(false)
  const [startAddress, setStartAddress] = useState(defaultStart)

  if (stopCount < 3) return null

  function handleExpand() {
    setMessage(null)
    setStartAddress(defaultStart)
    setExpanded(true)
  }

  function handleOptimize() {
    startTransition(async () => {
      const result = await optimizeRoute(routeId, startAddress)
      setMessage({ text: result.message, ok: result.optimized })
      setExpanded(false)
    })
  }

  if (expanded) {
    return (
      <div className="flex flex-col gap-1.5">
        <label className="text-xs text-gray-500 font-medium flex items-center gap-1">
          <Navigation className="w-3 h-3" /> Starting from
        </label>
        <div className="flex items-center gap-1.5">
          <input
            type="text"
            value={startAddress}
            onChange={(e) => setStartAddress(e.target.value)}
            placeholder="e.g. 123 Main St, City, ST"
            className="w-48 text-xs text-gray-900 placeholder:text-gray-400 rounded-lg border border-gray-300 px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
          <button
            type="button"
            onClick={handleOptimize}
            disabled={pending}
            className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-lg border border-sky-200 text-sky-700 bg-sky-50 hover:bg-sky-100 disabled:opacity-50 transition-colors"
          >
            <Zap className="w-3 h-3" />
            {pending ? "…" : "Go"}
          </button>
          <button
            type="button"
            onClick={() => setExpanded(false)}
            className="text-gray-400 hover:text-gray-600 p-1"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2">
      {message && (
        <span className={`text-xs ${message.ok ? "text-green-600" : "text-red-500"}`}>
          {message.text}
        </span>
      )}
      <button
        onClick={handleExpand}
        disabled={pending}
        className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-lg border border-sky-200 text-sky-700 bg-sky-50 hover:bg-sky-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        <Zap className="w-3.5 h-3.5" />
        Optimize Route
      </button>
    </div>
  )
}
