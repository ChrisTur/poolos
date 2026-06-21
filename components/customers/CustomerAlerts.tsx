"use client"

import { addAlert, deleteAlert } from "@/lib/actions/alerts"
import type { CustomerAlert } from "@/app/generated/prisma/client"

interface CustomerAlertsProps {
  customerId: string
  alerts: CustomerAlert[]
}

export default function CustomerAlerts({ customerId, alerts }: CustomerAlertsProps) {
  const addAction = addAlert.bind(null, customerId)

  return (
    <div className="space-y-3">
      {alerts.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {alerts.map((alert) => {
            const deleteAction = deleteAlert.bind(null, alert.id, customerId)
            return (
              <div
                key={alert.id}
                className="inline-flex items-center gap-1.5 bg-amber-50 border border-amber-300 text-amber-800 text-sm font-medium rounded-full px-3 py-1"
              >
                <span>⚑ {alert.body}</span>
                <form action={deleteAction} className="inline">
                  <button
                    type="submit"
                    className="text-amber-500 hover:text-amber-800 transition-colors leading-none ml-0.5"
                    title="Remove flag"
                  >
                    ×
                  </button>
                </form>
              </div>
            )
          })}
        </div>
      )}

      <form action={addAction} className="flex gap-2">
        <input
          name="body"
          placeholder="e.g. Gate code 4821, aggressive dog…"
          required
          className="flex-1 rounded-lg border border-amber-300 bg-amber-50 px-3 py-1.5 text-sm text-gray-900 placeholder-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400"
        />
        <button
          type="submit"
          className="rounded-lg bg-amber-100 border border-amber-300 text-amber-800 text-sm font-medium px-3 py-1.5 hover:bg-amber-200 transition-colors"
        >
          Add flag
        </button>
      </form>
    </div>
  )
}
