"use client"

import { useState, useTransition } from "react"
import { Zap } from "lucide-react"
import { optimizeRoute } from "@/lib/actions/routes"

export default function OptimizeButton({ routeId, stopCount }: { routeId: string; stopCount: number }) {
  const [pending, startTransition] = useTransition()
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null)

  if (stopCount < 3) return null

  function handleClick() {
    setMessage(null)
    startTransition(async () => {
      const result = await optimizeRoute(routeId)
      setMessage({ text: result.message, ok: result.optimized })
    })
  }

  return (
    <div className="flex items-center gap-2">
      {message && (
        <span className={`text-xs ${message.ok ? "text-green-600" : "text-red-500"}`}>
          {message.text}
        </span>
      )}
      <button
        onClick={handleClick}
        disabled={pending}
        className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-lg border border-sky-200 text-sky-700 bg-sky-50 hover:bg-sky-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        <Zap className="w-3.5 h-3.5" />
        {pending ? "Optimizing…" : "Optimize Route"}
      </button>
    </div>
  )
}
