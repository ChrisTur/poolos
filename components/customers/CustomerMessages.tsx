"use client"

import { useActionState, useRef, useEffect } from "react"
import { sendMessage } from "@/lib/actions/customers"
import Button from "@/components/ui/Button"
import { Send, Mail } from "lucide-react"

type Message = {
  id: string
  createdAt: Date
  body: string
  fromCompany: boolean
  sentViaEmail: boolean
  serviceVisitId: string | null
}

function formatTime(d: Date) {
  return new Date(d).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  })
}

export default function CustomerMessages({
  customerId,
  messages,
  hasEmail,
}: {
  customerId: string
  messages: Message[]
  hasEmail: boolean
}) {
  const [state, action, pending] = useActionState(
    async (_: unknown, formData: FormData) => sendMessage(_, formData),
    null
  )
  const formRef = useRef<HTMLFormElement>(null)
  const threadRef = useRef<HTMLDivElement>(null)

  // Clear form on success
  useEffect(() => {
    if (state?.success) formRef.current?.reset()
  }, [state?.success])

  // Scroll thread to bottom when messages change
  useEffect(() => {
    if (threadRef.current) {
      threadRef.current.scrollTop = threadRef.current.scrollHeight
    }
  }, [messages.length])

  return (
    <div className="flex flex-col">
      {/* Thread */}
      <div
        ref={threadRef}
        className="px-4 py-3 space-y-3 overflow-y-auto"
        style={{ maxHeight: "360px", minHeight: messages.length ? "120px" : undefined }}
      >
        {messages.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-6">No messages yet. Send one below.</p>
        ) : (
          messages.map((m) => (
            <div key={m.id} className={`flex ${m.fromCompany ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${m.fromCompany ? "bg-sky-500 text-white rounded-tr-sm" : "bg-gray-100 text-gray-900 rounded-tl-sm"}`}>
                {m.serviceVisitId && (
                  <p className={`text-[10px] font-semibold uppercase tracking-wide mb-1 ${m.fromCompany ? "text-sky-200" : "text-gray-400"}`}>
                    Visit summary
                  </p>
                )}
                <p className="text-sm whitespace-pre-wrap leading-relaxed">{m.body}</p>
                <div className={`flex items-center gap-1.5 mt-1 ${m.fromCompany ? "justify-end" : "justify-start"}`}>
                  <span className={`text-[11px] ${m.fromCompany ? "text-sky-200" : "text-gray-400"}`}>
                    {formatTime(m.createdAt)}
                  </span>
                  {m.fromCompany && m.sentViaEmail && (
                    <span title="Emailed to customer">
                      <Mail className="w-3 h-3 text-sky-200" />
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Compose */}
      <div className="border-t border-gray-100 p-4">
        <form ref={formRef} action={action} className="space-y-2">
          <input type="hidden" name="customerId" value={customerId} />
          <textarea
            name="body"
            rows={2}
            required
            placeholder="Type a message…"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-500 resize-none"
          />
          <div className="flex items-center justify-between gap-3 flex-wrap">
            {hasEmail ? (
              <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer select-none">
                <input
                  type="checkbox"
                  name="sendEmail"
                  value="true"
                  className="w-4 h-4 rounded border-gray-300 text-sky-500 focus:ring-sky-500"
                />
                Also email to customer
              </label>
            ) : (
              <p className="text-xs text-gray-400">No email on file — message stored in-app only.</p>
            )}
            <Button type="submit" size="sm" disabled={pending}>
              <Send className="w-3.5 h-3.5" />
              {pending ? "Sending…" : "Send"}
            </Button>
          </div>
          {state?.error && (
            <p className="text-xs text-red-600">{state.error}</p>
          )}
        </form>
      </div>
    </div>
  )
}
