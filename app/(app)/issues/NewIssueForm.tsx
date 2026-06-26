"use client"

import { useActionState } from "react"
import { createIssueFromList } from "@/lib/actions/issues"

interface Customer { id: string; firstName: string; lastName: string }

const inputCls  = "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-500"
const selectCls = "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"

export default function NewIssueForm({ customers }: { customers: Customer[] }) {
  const [state, action, pending] = useActionState(createIssueFromList, undefined)

  return (
    <form action={action} className="space-y-4">
      {state?.error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{state.error}</div>
      )}

      <div className="grid sm:grid-cols-3 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Customer</label>
          <select name="customerId" required className={selectCls}>
            <option value="">Select customer…</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>{c.firstName} {c.lastName}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Category</label>
          <select name="category" required className={selectCls}>
            <option value="">Select category…</option>
            <option value="leak">Leak</option>
            <option value="equipment_failure">Equipment Failure</option>
            <option value="safety_hazard">Safety Hazard</option>
            <option value="water_quality">Water Quality</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Priority</label>
          <select name="priority" defaultValue="normal" className={selectCls}>
            <option value="low">Low</option>
            <option value="normal">Normal</option>
            <option value="high">High</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
        <textarea
          name="notes"
          required
          rows={3}
          placeholder="Describe the issue in detail…"
          className={inputCls}
        />
      </div>

      <button
        type="submit"
        disabled={pending}
        className="px-4 py-2 rounded-lg bg-sky-600 text-white text-sm font-medium hover:bg-sky-700 disabled:opacity-50 transition-colors"
      >
        {pending ? "Submitting…" : "Report Issue"}
      </button>
    </form>
  )
}
