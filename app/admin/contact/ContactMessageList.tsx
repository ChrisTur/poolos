"use client"

import Link from "next/link"
import { useState, useTransition } from "react"
import { Mail, MailOpen, CornerDownRight, ShieldAlert, Trash2, ShieldCheck } from "lucide-react"
import { markAsSpam, unmarkSpam } from "@/lib/actions/contact"
import { bulkDeleteContactMessages, bulkMarkAsSpam } from "@/lib/actions/contact-bulk"

type Message = {
  id: string
  name: string
  email: string
  subject: string | null
  body: string
  status: string
  createdAt: Date
}

function statusBadge(status: string) {
  if (status === "new")     return <span className="inline-flex items-center gap-1 text-xs font-semibold bg-sky-100 text-sky-700 px-2 py-0.5 rounded-full"><Mail className="w-3 h-3" />New</span>
  if (status === "replied") return <span className="inline-flex items-center gap-1 text-xs font-semibold bg-green-100 text-green-700 px-2 py-0.5 rounded-full"><CornerDownRight className="w-3 h-3" />Replied</span>
  if (status === "spam")    return <span className="inline-flex items-center gap-1 text-xs font-semibold bg-red-100 text-red-600 px-2 py-0.5 rounded-full"><ShieldAlert className="w-3 h-3" />Spam</span>
  return <span className="inline-flex items-center gap-1 text-xs font-semibold bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full"><MailOpen className="w-3 h-3" />Read</span>
}

export default function ContactMessageList({ messages, showSpam }: { messages: Message[]; showSpam: boolean }) {
  const [selected, setSelected]   = useState<Set<string>>(new Set())
  const [pending, startTransition] = useTransition()

  const allSelected = messages.length > 0 && selected.size === messages.length

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function toggleAll() {
    setSelected(allSelected ? new Set() : new Set(messages.map((m) => m.id)))
  }

  function handleBulkDelete() {
    const ids = [...selected]
    startTransition(async () => {
      await bulkDeleteContactMessages(ids)
      setSelected(new Set())
    })
  }

  function handleBulkSpam() {
    const ids = [...selected]
    startTransition(async () => {
      await bulkMarkAsSpam(ids)
      setSelected(new Set())
    })
  }

  function handleSpamToggle(e: React.MouseEvent, id: string, isSpam: boolean) {
    e.preventDefault()
    startTransition(async () => {
      if (isSpam) await unmarkSpam(id)
      else await markAsSpam(id)
    })
  }

  if (messages.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-400">
        {showSpam
          ? <><ShieldAlert className="w-10 h-10 mx-auto mb-3 opacity-30" /><p className="font-medium">No spam</p><p className="text-sm mt-1">Automatically detected spam will appear here.</p></>
          : <><Mail className="w-10 h-10 mx-auto mb-3 opacity-30" /><p className="font-medium">No messages yet</p><p className="text-sm mt-1">Contact form submissions will appear here.</p></>
        }
      </div>
    )
  }

  return (
    <div>
      {/* Bulk action bar */}
      {selected.size > 0 && (
        <div className="flex items-center gap-3 mb-3 px-4 py-2.5 bg-sky-50 border border-sky-200 rounded-xl">
          <span className="text-sm font-medium text-sky-800">{selected.size} selected</span>
          <div className="flex gap-2 ml-auto">
            {!showSpam && (
              <button
                onClick={handleBulkSpam}
                disabled={pending}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-600 hover:text-red-700 hover:bg-red-50 border border-gray-200 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
              >
                <ShieldAlert className="w-3.5 h-3.5" />
                Mark spam
              </button>
            )}
            <button
              onClick={handleBulkDelete}
              disabled={pending}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-red-600 hover:text-red-800 hover:bg-red-50 border border-red-200 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Delete {selected.size}
            </button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100 overflow-hidden">
        {/* Select-all header */}
        <div className="flex items-center gap-3 px-5 py-2.5 bg-gray-50 border-b border-gray-100">
          <input
            type="checkbox"
            checked={allSelected}
            onChange={toggleAll}
            className="rounded border-gray-300 text-sky-600 cursor-pointer"
          />
          <span className="text-xs text-gray-500 font-medium">
            {allSelected ? "Deselect all" : `Select all (${messages.length})`}
          </span>
        </div>

        {messages.map((msg) => {
          const isSpam = msg.status === "spam"
          const isSelected = selected.has(msg.id)
          return (
            <div
              key={msg.id}
              className={`flex items-start gap-3 px-5 py-4 ${isSelected ? "bg-sky-50" : msg.status === "new" ? "bg-sky-50/40" : ""}`}
            >
              <div className="flex items-start gap-2 shrink-0 mt-0.5">
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => toggle(msg.id)}
                  className="rounded border-gray-300 text-sky-600 cursor-pointer mt-0.5"
                />
                {isSpam
                  ? <ShieldAlert className="w-5 h-5 text-red-400" />
                  : msg.status === "new"
                    ? <Mail className="w-5 h-5 text-sky-500" />
                    : <MailOpen className="w-5 h-5 text-gray-300" />}
              </div>

              <Link href={`/admin/contact/${msg.id}`} className="flex-1 min-w-0 hover:opacity-80 transition-opacity">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className={`text-sm text-gray-900 truncate ${msg.status === "new" ? "font-bold" : "font-semibold"}`}>
                    {msg.name}
                  </span>
                  <span className="text-xs text-gray-400 shrink-0 hidden sm:inline">{msg.email}</span>
                </div>
                {msg.subject && <p className="text-sm text-gray-700 truncate">{msg.subject}</p>}
                <p className="text-sm text-gray-400 truncate">{msg.body}</p>
              </Link>

              <div className="shrink-0 flex flex-col items-end gap-1.5">
                {statusBadge(msg.status)}
                <span className="text-xs text-gray-400">
                  {new Date(msg.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                </span>
                <button
                  onClick={(e) => handleSpamToggle(e, msg.id, isSpam)}
                  disabled={pending}
                  className={`text-xs px-2 py-0.5 rounded transition-colors disabled:opacity-50 flex items-center gap-1 ${
                    isSpam
                      ? "text-gray-400 hover:text-green-600 hover:bg-green-50"
                      : "text-gray-400 hover:text-red-600 hover:bg-red-50"
                  }`}
                >
                  {isSpam
                    ? <><ShieldCheck className="w-3 h-3" />Not spam</>
                    : <><ShieldAlert className="w-3 h-3" />Spam</>
                  }
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
