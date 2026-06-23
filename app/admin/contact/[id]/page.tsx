import { notFound, redirect } from "next/navigation"
import Link from "next/link"
import { db } from "@/lib/db"
import { markContactRead, deleteContactMessage } from "@/lib/actions/contact"
import { ArrowLeft, Clock, CornerDownRight, Trash2 } from "lucide-react"
import ContactReplyForm from "./ContactReplyForm"

export const metadata = { title: "Contact Message — PoolOS Admin" }

export default async function ContactDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const msg = await db.contactMessage.findUnique({ where: { id } })
  if (!msg) notFound()

  // Auto-mark as read when opened
  if (msg.status === "new") {
    await markContactRead(id)
  }

  const fmtDate = (d: Date) =>
    new Date(d).toLocaleString("en-US", {
      weekday: "short", month: "short", day: "numeric",
      hour: "numeric", minute: "2-digit",
    })

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/admin/contact"
          className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <h1 className="text-xl font-bold text-gray-900 truncate">
          {msg.subject || "Contact message"}
        </h1>
      </div>

      {/* Message */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-4">
        <div className="px-5 py-4 border-b border-gray-100 flex items-start justify-between gap-4">
          <div>
            <p className="font-semibold text-gray-900">{msg.name}</p>
            <p className="text-sm text-gray-500">{msg.email}</p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-xs text-gray-400 flex items-center gap-1 justify-end">
              <Clock className="w-3 h-3" />
              {fmtDate(msg.createdAt)}
            </p>
            <a
              href={`mailto:${msg.email}`}
              className="text-xs text-sky-600 hover:underline mt-1 block"
            >
              {msg.email}
            </a>
          </div>
        </div>
        <div className="px-5 py-5">
          <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{msg.body}</p>
        </div>
      </div>

      {/* Previous reply (if any) */}
      {msg.replyBody && (
        <div className="bg-green-50 border border-green-200 rounded-xl px-5 py-4 mb-4">
          <div className="flex items-center gap-1.5 mb-2">
            <CornerDownRight className="w-3.5 h-3.5 text-green-600" />
            <p className="text-xs font-semibold text-green-700">
              Replied by {msg.repliedBy} · {msg.repliedAt ? fmtDate(msg.repliedAt) : ""}
            </p>
          </div>
          <p className="text-sm text-green-800 whitespace-pre-wrap leading-relaxed">{msg.replyBody}</p>
        </div>
      )}

      {/* Reply form */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-4">
        <div className="px-5 py-3 border-b border-gray-100 bg-gray-50">
          <p className="text-sm font-medium text-gray-700">
            {msg.status === "replied" ? "Send another reply" : "Reply"} → <span className="text-gray-500 font-normal">{msg.email}</span>
          </p>
        </div>
        <div className="p-5">
          <ContactReplyForm id={msg.id} />
        </div>
      </div>

      {/* Danger zone */}
      <div className="flex justify-end">
        <form
          action={async () => {
            "use server"
            await deleteContactMessage(id)
            redirect("/admin/contact")
          }}
        >
          <button
            type="submit"
            className="inline-flex items-center gap-1.5 text-xs text-red-500 hover:text-red-700 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Delete message
          </button>
        </form>
      </div>
    </div>
  )
}
