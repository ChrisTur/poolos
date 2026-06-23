import Link from "next/link"
import { db } from "@/lib/db"
import { Mail, MailOpen, CornerDownRight } from "lucide-react"

export const metadata = { title: "Contact Inbox — PoolOS Admin" }

function statusBadge(status: string) {
  if (status === "new")     return <span className="inline-flex items-center gap-1 text-xs font-semibold bg-sky-100 text-sky-700 px-2 py-0.5 rounded-full"><Mail className="w-3 h-3" />New</span>
  if (status === "replied") return <span className="inline-flex items-center gap-1 text-xs font-semibold bg-green-100 text-green-700 px-2 py-0.5 rounded-full"><CornerDownRight className="w-3 h-3" />Replied</span>
  return <span className="inline-flex items-center gap-1 text-xs font-semibold bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full"><MailOpen className="w-3 h-3" />Read</span>
}

export default async function ContactInboxPage() {
  const messages = await db.contactMessage.findMany({
    orderBy: { createdAt: "desc" },
  })

  const unread = messages.filter((m) => m.status === "new").length

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Contact Inbox</h1>
          {unread > 0 && (
            <p className="text-sm text-sky-600 font-medium mt-0.5">{unread} unread</p>
          )}
        </div>
      </div>

      {messages.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-400">
          <Mail className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="font-medium">No messages yet</p>
          <p className="text-sm mt-1">Contact form submissions will appear here.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100 overflow-hidden">
          {messages.map((msg) => (
            <Link
              key={msg.id}
              href={`/admin/contact/${msg.id}`}
              className={`flex items-start gap-4 px-5 py-4 hover:bg-gray-50 transition-colors ${msg.status === "new" ? "bg-sky-50/40" : ""}`}
            >
              <div className="shrink-0 mt-0.5">
                {msg.status === "new"
                  ? <Mail className="w-5 h-5 text-sky-500" />
                  : <MailOpen className="w-5 h-5 text-gray-300" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className={`text-sm font-semibold text-gray-900 truncate ${msg.status === "new" ? "font-bold" : ""}`}>
                    {msg.name}
                  </span>
                  <span className="text-xs text-gray-400 shrink-0">{msg.email}</span>
                </div>
                {msg.subject && (
                  <p className="text-sm text-gray-700 truncate">{msg.subject}</p>
                )}
                <p className="text-sm text-gray-400 truncate">{msg.body}</p>
              </div>
              <div className="shrink-0 flex flex-col items-end gap-1.5">
                {statusBadge(msg.status)}
                <span className="text-xs text-gray-400">
                  {new Date(msg.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
