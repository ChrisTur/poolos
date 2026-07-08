"use client"

import { useTransition, useState } from "react"
import { CalendarPlus, Check, X } from "lucide-react"
import { confirmVisitRequest, declineVisitRequest } from "@/lib/actions/visitRequests"

type VisitRequest = {
  id: string
  createdAt: Date
  preferredDate: Date | null
  serviceType: string | null
  notes: string | null
  customer: { id: string; firstName: string; lastName: string }
}

export default function VisitRequestCard({ request }: { request: VisitRequest }) {
  const [isPending, startTransition] = useTransition()
  const [declining, setDeclining] = useState(false)

  function handleConfirm() {
    startTransition(() => confirmVisitRequest(request.id))
  }

  function handleDecline(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    startTransition(() => declineVisitRequest(request.id, fd))
  }

  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 overflow-hidden">
      <div className="px-5 py-4 flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center shrink-0 mt-0.5">
            <CalendarPlus className="w-4 h-4 text-amber-700" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">
              {request.customer.firstName} {request.customer.lastName}
            </p>
            {request.serviceType && (
              <p className="text-xs text-amber-800 font-medium mt-0.5">{request.serviceType}</p>
            )}
            {request.preferredDate && (
              <p className="text-xs text-gray-500 mt-0.5">
                Preferred: {new Date(request.preferredDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
              </p>
            )}
            {request.notes && (
              <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{request.notes}</p>
            )}
            <p className="text-xs text-gray-400 mt-1">
              Requested {new Date(request.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
            </p>
          </div>
        </div>

        {!declining && (
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setDeclining(true)}
              disabled={isPending}
              className="flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-red-600 px-2.5 py-1.5 rounded-lg hover:bg-red-50 transition-colors"
            >
              <X className="w-3.5 h-3.5" /> Decline
            </button>
            <button
              onClick={handleConfirm}
              disabled={isPending}
              className="flex items-center gap-1 text-xs font-semibold text-white bg-green-600 hover:bg-green-700 disabled:opacity-50 px-3 py-1.5 rounded-lg transition-colors"
            >
              <Check className="w-3.5 h-3.5" /> Confirm
            </button>
          </div>
        )}
      </div>

      {declining && (
        <form onSubmit={handleDecline} className="border-t border-amber-200 px-5 py-3 flex items-center gap-3 bg-white">
          <input
            name="declineReason"
            placeholder="Reason (optional)"
            className="flex-1 rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
          <button
            type="button"
            onClick={() => setDeclining(false)}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isPending}
            className="text-sm font-semibold text-white bg-red-500 hover:bg-red-600 disabled:opacity-50 px-3 py-1.5 rounded-lg transition-colors"
          >
            {isPending ? "Declining…" : "Decline"}
          </button>
        </form>
      )}
    </div>
  )
}
