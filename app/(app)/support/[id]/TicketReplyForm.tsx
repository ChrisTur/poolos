"use client"

import { useActionState, useRef, useEffect } from "react"
import { replyToTicket } from "@/lib/actions/support"
import Button from "@/components/ui/Button"

export default function TicketReplyForm({ ticketId }: { ticketId: string }) {
  const [state, action, pending] = useActionState(replyToTicket, undefined)
  const ref = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (state?.success && ref.current) ref.current.value = ""
  }, [state])

  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="ticketId" value={ticketId} />
      {state?.error && (
        <p className="text-sm text-red-600">{state.error}</p>
      )}
      {state?.success && (
        <p className="text-sm text-green-600">Reply sent.</p>
      )}
      <textarea
        ref={ref}
        name="body"
        required
        rows={4}
        placeholder="Write your reply…"
        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-500"
      />
      <Button type="submit" disabled={pending}>
        {pending ? "Sending…" : "Send Reply"}
      </Button>
    </form>
  )
}
