"use client"

import { useActionState } from "react"
import { adminReplyToTicket } from "@/lib/actions/support"
import Button from "@/components/ui/Button"

interface Props {
  ticketId:      string
  currentStatus: string
}

const STATUS_OPTIONS = [
  { value: "open",        label: "Open" },
  { value: "in_progress", label: "In Progress" },
  { value: "resolved",    label: "Resolved" },
  { value: "closed",      label: "Closed" },
]

export default function AdminTicketActions({ ticketId, currentStatus }: Props) {
  const [state, action, pending] = useActionState(adminReplyToTicket, undefined)

  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="ticketId" value={ticketId} />

      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      {state?.success && <p className="text-sm text-green-600">Reply sent and company notified.</p>}

      <textarea
        name="body"
        required
        rows={5}
        placeholder="Write your reply to the company…"
        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-500"
      />

      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex-1 min-w-[160px]">
          <label className="block text-xs font-medium text-gray-600 mb-1">Set status after reply</label>
          <select
            name="status"
            defaultValue={currentStatus === "open" ? "in_progress" : currentStatus}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
          >
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
        <Button type="submit" disabled={pending} className="self-end">
          {pending ? "Sending…" : "Send Reply"}
        </Button>
      </div>
    </form>
  )
}
