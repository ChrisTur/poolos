"use client"

import { useActionState } from "react"
import { submitTicket } from "@/lib/actions/support"
import Button from "@/components/ui/Button"

const inputCls  = "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-500"
const selectCls = "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"

export default function NewTicketForm() {
  const [state, action, pending] = useActionState(submitTicket, undefined)

  return (
    <form action={action} className="space-y-4">
      {state?.error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {state.error}
        </div>
      )}

      <div className="grid sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
          <select name="category" required className={selectCls}>
            <option value="">Select a category…</option>
            <option value="technical">Technical Issue</option>
            <option value="billing">Billing & Payments</option>
            <option value="account">Account & Settings</option>
            <option value="feature_request">Feature Request</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
          <input name="subject" required placeholder="Brief summary of your issue" className={inputCls} />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
        <textarea
          name="body"
          required
          rows={5}
          placeholder="Describe the issue in detail. Include steps to reproduce if it's a bug."
          className={inputCls}
        />
      </div>

      <Button type="submit" disabled={pending}>
        {pending ? "Submitting…" : "Submit Ticket"}
      </Button>
    </form>
  )
}
