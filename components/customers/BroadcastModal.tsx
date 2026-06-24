"use client"

import { useTransition, useState } from "react"
import { X, Send, CheckCircle2, AlertCircle } from "lucide-react"
import Button from "@/components/ui/Button"
import { broadcastMessage } from "@/lib/actions/customers"

type Customer = {
  id: string
  firstName: string
  lastName: string
  email: string | null
}

interface Props {
  customers: Customer[]
  onClose: () => void
}

export default function BroadcastModal({ customers, onClose }: Props) {
  const [isPending, startTransition] = useTransition()
  const [subject, setSubject] = useState("")
  const [body, setBody] = useState("")
  const [result, setResult] = useState<{ sent: number; skipped: number; error?: string } | null>(null)

  const withEmail = customers.filter((c) => c.email)
  const noEmail = customers.length - withEmail.length

  function handleSend() {
    if (!subject.trim() || !body.trim()) return
    startTransition(async () => {
      const res = await broadcastMessage(customers.map((c) => c.id), subject.trim(), body.trim())
      setResult(res)
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Message Customers</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Recipient summary */}
          <div className="rounded-xl bg-sky-50 border border-sky-200 px-4 py-3 text-sm text-sky-800">
            Sending to <strong>{withEmail.length}</strong> customer{withEmail.length !== 1 ? "s" : ""} with email
            {noEmail > 0 && <span className="text-sky-600"> · {noEmail} will be skipped (no email on file)</span>}
          </div>

          {result ? (
            result.error && result.sent === 0 ? (
              <div className="flex items-start gap-3 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-800">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <div>
                  <p className="font-medium">Failed to send</p>
                  <p className="text-red-600 mt-0.5">{result.error}</p>
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-3 rounded-xl bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-800">
                <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0 text-green-600" />
                <div>
                  <p className="font-medium">Message sent!</p>
                  <p className="text-green-700 mt-0.5">
                    Delivered to {result.sent} customer{result.sent !== 1 ? "s" : ""}
                    {result.skipped > 0 && ` · ${result.skipped} skipped`}
                  </p>
                </div>
              </div>
            )
          ) : (
            <>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-700">Subject</label>
                <input
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g. Upcoming price change"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-700">Message</label>
                <textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  rows={6}
                  placeholder="Write your message here…"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-500 resize-none"
                />
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-gray-100">
          <Button variant="secondary" size="sm" onClick={onClose}>
            {result ? "Close" : "Cancel"}
          </Button>
          {!result && (
            <Button
              size="sm"
              onClick={handleSend}
              disabled={isPending || !subject.trim() || !body.trim() || withEmail.length === 0}
            >
              <Send className="w-4 h-4" />
              {isPending ? "Sending…" : `Send to ${withEmail.length}`}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
