"use client"

import { useState, useTransition } from "react"
import { CalendarPlus, CheckCircle2 } from "lucide-react"
import { createVisitRequest } from "@/lib/actions/visitRequests"

export default function PortalRequestForm({ token }: { token: string }) {
  const [open, setOpen] = useState(false)
  const [done, setDone] = useState(false)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    startTransition(async () => {
      const res = await createVisitRequest(token, fd)
      if (res?.success) setDone(true)
    })
  }

  if (done) {
    return (
      <div className="flex items-start gap-3 rounded-xl border border-green-200 bg-green-50 px-5 py-4">
        <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-green-800">Request submitted!</p>
          <p className="text-xs text-green-700 mt-0.5">We'll be in touch to confirm a date.</p>
        </div>
      </div>
    )
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full flex items-center justify-center gap-2 rounded-xl border border-dashed border-sky-300 bg-sky-50 px-5 py-4 text-sm font-medium text-sky-700 hover:bg-sky-100 transition-colors"
      >
        <CalendarPlus className="w-4 h-4" />
        Request a service visit
      </button>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border border-gray-200 bg-white divide-y divide-gray-100">
      <div className="px-5 py-4">
        <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
          <CalendarPlus className="w-4 h-4 text-sky-500" />
          Request a service visit
        </h2>
      </div>

      <div className="px-5 py-4 space-y-4">
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-gray-700">Preferred date <span className="text-gray-400">(optional)</span></label>
          <input
            type="date"
            name="preferredDate"
            min={new Date().toISOString().split("T")[0]}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-gray-700">What do you need? <span className="text-gray-400">(optional)</span></label>
          <input
            type="text"
            name="serviceType"
            placeholder="e.g. Pool opening, filter cleaning…"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-gray-700">Additional notes <span className="text-gray-400">(optional)</span></label>
          <textarea
            name="notes"
            rows={3}
            placeholder="Any details that would help us…"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-500 resize-none"
          />
        </div>
      </div>

      <div className="px-5 py-4 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isPending}
          className="bg-sky-600 hover:bg-sky-700 disabled:opacity-50 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
        >
          {isPending ? "Submitting…" : "Submit request"}
        </button>
      </div>
    </form>
  )
}
