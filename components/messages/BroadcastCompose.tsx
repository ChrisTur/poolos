"use client"

import { useTransition, useState, useMemo } from "react"
import { Send, CheckCircle2, AlertCircle, Users } from "lucide-react"
import Button from "@/components/ui/Button"
import { broadcastMessage } from "@/lib/actions/customers"

type Customer = {
  id: string
  firstName: string
  lastName: string
  email: string | null
  status: string
  tags: { tag: { id: string } }[]
}

type Tag = { id: string; name: string; color: string }

interface Props {
  customers: Customer[]
  tags: Tag[]
}

export default function BroadcastCompose({ customers, tags }: Props) {
  const [isPending, startTransition] = useTransition()
  const [scope, setScope] = useState<"all" | "status" | "tag">("all")
  const [scopeValue, setScopeValue] = useState("")
  const [subject, setSubject] = useState("")
  const [body, setBody] = useState("")
  const [result, setResult] = useState<{ sent: number; skipped: number; error?: string } | null>(null)

  const recipients = useMemo(() => {
    let list = customers
    if (scope === "status" && scopeValue) {
      list = list.filter((c) => c.status === scopeValue)
    } else if (scope === "tag" && scopeValue) {
      list = list.filter((c) => c.tags.some((t) => t.tag.id === scopeValue))
    }
    return list
  }, [customers, scope, scopeValue])

  const withEmail = useMemo(() => recipients.filter((c) => c.email), [recipients])
  const noEmail = recipients.length - withEmail.length

  function handleSend() {
    if (!subject.trim() || !body.trim() || withEmail.length === 0) return
    startTransition(async () => {
      const res = await broadcastMessage(recipients.map((c) => c.id), subject.trim(), body.trim())
      setResult(res)
    })
  }

  function handleReset() {
    setResult(null)
    setSubject("")
    setBody("")
    setScope("all")
    setScopeValue("")
  }

  return (
    <div className="max-w-2xl space-y-5">
      {/* Recipient scope */}
      <div className="rounded-xl border border-gray-200 bg-white divide-y divide-gray-100">
        <div className="px-5 py-4">
          <h2 className="text-sm font-semibold text-gray-900 mb-3">Recipients</h2>
          <div className="flex flex-wrap gap-2">
            {(["all", "status", "tag"] as const).map((s) => (
              <button
                key={s}
                onClick={() => { setScope(s); setScopeValue("") }}
                className={`px-3.5 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  scope === s
                    ? "bg-sky-600 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {s === "all" ? "All customers" : s === "status" ? "By status" : "By tag"}
              </button>
            ))}
          </div>

          {scope === "status" && (
            <select
              value={scopeValue}
              onChange={(e) => setScopeValue(e.target.value)}
              className="mt-3 text-sm text-gray-900 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500"
            >
              <option value="">Pick a status…</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="suspended">Suspended</option>
            </select>
          )}

          {scope === "tag" && (
            <select
              value={scopeValue}
              onChange={(e) => setScopeValue(e.target.value)}
              className="mt-3 text-sm text-gray-900 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500"
            >
              <option value="">Pick a tag…</option>
              {tags.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          )}
        </div>

        {/* Preview count */}
        <div className="px-5 py-3 flex items-center gap-2 text-sm">
          <Users className="w-4 h-4 text-sky-500 shrink-0" />
          {withEmail.length === 0 ? (
            <span className="text-gray-400">
              {recipients.length === 0 ? "No customers match this filter." : "None of the matching customers have email addresses."}
            </span>
          ) : (
            <span className="text-gray-700">
              <strong>{withEmail.length}</strong> customer{withEmail.length !== 1 ? "s" : ""} will receive this email
              {noEmail > 0 && <span className="text-gray-400"> · {noEmail} skipped (no email)</span>}
            </span>
          )}
        </div>
      </div>

      {result ? (
        <div className={`rounded-xl border px-5 py-4 ${result.error && result.sent === 0 ? "bg-red-50 border-red-200" : "bg-green-50 border-green-200"}`}>
          {result.error && result.sent === 0 ? (
            <div className="flex items-start gap-3 text-red-800">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Failed to send</p>
                <p className="text-sm text-red-600 mt-0.5">{result.error}</p>
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-3 text-green-800">
              <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5 text-green-600" />
              <div>
                <p className="font-semibold">Broadcast sent!</p>
                <p className="text-sm text-green-700 mt-0.5">
                  Delivered to {result.sent} customer{result.sent !== 1 ? "s" : ""}
                  {result.skipped > 0 && ` · ${result.skipped} skipped (no email or send error)`}
                </p>
              </div>
            </div>
          )}
          <button onClick={handleReset} className="mt-3 text-sm text-gray-500 hover:text-gray-700 underline underline-offset-2">
            Send another
          </button>
        </div>
      ) : (
        <div className="rounded-xl border border-gray-200 bg-white divide-y divide-gray-100">
          <div className="px-5 py-4 space-y-4">
            <h2 className="text-sm font-semibold text-gray-900">Compose</h2>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-700">Subject</label>
              <input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g. Important service update"
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-700">Message</label>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={8}
                placeholder="Write your message here…"
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-500 resize-none"
              />
            </div>
          </div>
          <div className="px-5 py-4 flex justify-end">
            <Button
              onClick={handleSend}
              disabled={isPending || !subject.trim() || !body.trim() || withEmail.length === 0}
            >
              <Send className="w-4 h-4" />
              {isPending ? "Sending…" : `Send to ${withEmail.length} customer${withEmail.length !== 1 ? "s" : ""}`}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
