"use client"

import { useActionState } from "react"
import { logVisit } from "@/lib/actions/routes"
import Button from "@/components/ui/Button"
import type { Customer, Route } from "@/app/generated/prisma/client"

export default function LogVisitForm({
  customers,
  routes,
  alerts = [],
}: {
  customers: Customer[]
  routes: Route[]
  alerts?: { id: string; body: string }[]
}) {
  const [, action, pending] = useActionState(async (_: unknown, formData: FormData) => {
    await logVisit(formData)
    return null
  }, null)

  return (
    <div className="space-y-4">
    {alerts.length > 0 && (
      <div className="rounded-lg bg-yellow-50 border border-yellow-200 px-4 py-3 space-y-1">
        <p className="text-xs font-semibold text-yellow-800 uppercase tracking-wide">Customer Alerts</p>
        {alerts.map((a) => (
          <p key={a.id} className="text-sm text-yellow-800">⚑ {a.body}</p>
        ))}
      </div>
    )}
    <form action={action} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Customer *</label>
        <select
          name="customerId"
          required
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
        >
          <option value="">Select customer…</option>
          {customers.map((c) => (
            <option key={c.id} value={c.id}>
              {c.firstName} {c.lastName}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Route</label>
        <select
          name="routeId"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
        >
          <option value="">None</option>
          {routes.map((r) => (
            <option key={r.id} value={r.id}>{r.name}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
        <select
          name="status"
          defaultValue="completed"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
        >
          <option value="completed">Completed</option>
          <option value="skipped">Skipped</option>
          <option value="issue">Issue</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
        <textarea
          name="notes"
          rows={2}
          placeholder="What was done, any issues…"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-sky-500 resize-y"
        />
      </div>

      <fieldset className="space-y-3">
        <legend className="text-sm font-medium text-gray-700">Chemical Readings</legend>
        <div className="grid grid-cols-2 gap-3">
          {[
            { name: "chlorine",   label: "Chlorine",   step: "0.1", hint: "Normal: 1.0–3.0 ppm" },
            { name: "ph",         label: "pH",         step: "0.1", hint: "Normal: 7.2–7.8" },
            { name: "alkalinity", label: "Alkalinity", step: "1",   hint: "Normal: 80–120 ppm" },
            { name: "calcium",    label: "Calcium",    step: "1",   hint: "Normal: 200–400 ppm" },
          ].map((f) => (
            <div key={f.name}>
              <label className="block text-xs font-medium text-gray-600 mb-1">{f.label}</label>
              <input
                name={f.name}
                type="number"
                step={f.step}
                min="0"
                placeholder="—"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
              <p className="text-xs text-gray-400 mt-0.5">{f.hint}</p>
            </div>
          ))}
        </div>
      </fieldset>

      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Logging…" : "Log Visit"}
      </Button>
    </form>
    </div>
  )
}
