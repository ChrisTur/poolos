import { notFound } from "next/navigation"
import Link from "next/link"
import { db } from "@/lib/db"
import { requireSession } from "@/lib/session"
import { ArrowLeft } from "lucide-react"
import Card, { CardBody } from "@/components/ui/Card"
import TicketReplyForm from "./TicketReplyForm"

export const dynamic = "force-dynamic"

const STATUS_STYLES: Record<string, string> = {
  open:        "bg-sky-100   text-sky-700",
  in_progress: "bg-amber-100 text-amber-700",
  resolved:    "bg-green-100 text-green-700",
  closed:      "bg-gray-100  text-gray-500",
}

const STATUS_LABELS: Record<string, string> = {
  open: "Open", in_progress: "In Progress", resolved: "Resolved", closed: "Closed",
}

const CATEGORY_LABELS: Record<string, string> = {
  billing: "Billing & Payments", technical: "Technical Issue",
  feature_request: "Feature Request", account: "Account & Settings", other: "Other",
}

function fmtTime(d: Date) {
  return new Date(d).toLocaleString("en-US", {
    month: "short", day: "numeric", year: "numeric",
    hour: "numeric", minute: "2-digit",
  })
}

export default async function SupportTicketPage({ params }: { params: Promise<{ id: string }> }) {
  const [{ id }, user] = await Promise.all([params, requireSession()])

  const ticket = await db.supportTicket.findFirst({
    where: { id, companyId: user.companyId as string },
    include: {
      messages: { orderBy: { createdAt: "asc" } },
    },
  })
  if (!ticket) notFound()

  const canReply = ticket.status !== "closed"

  return (
    <div className="max-w-2xl space-y-4">
      {/* Header */}
      <div className="flex items-start gap-3">
        <Link href="/support" className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 mt-0.5 shrink-0">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-bold text-gray-900 leading-tight">{ticket.subject}</h1>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${STATUS_STYLES[ticket.status] ?? STATUS_STYLES.open}`}>
              {STATUS_LABELS[ticket.status] ?? ticket.status}
            </span>
            <span className="text-xs text-gray-400">{CATEGORY_LABELS[ticket.category] ?? ticket.category}</span>
            <span className="text-xs text-gray-300">·</span>
            <span className="text-xs text-gray-400">#{ticket.id.slice(-6).toUpperCase()}</span>
          </div>
        </div>
      </div>

      {/* Message thread */}
      <Card>
        <CardBody className="divide-y divide-gray-50 !p-0">
          {ticket.messages.map((msg) => (
            <div key={msg.id} className={`px-5 py-4 ${msg.fromAdmin ? "bg-sky-50/40" : ""}`}>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold text-gray-700">
                  {msg.fromAdmin ? "PoolOS Support" : (msg.authorName ?? "You")}
                </p>
                <p className="text-xs text-gray-400">{fmtTime(msg.createdAt)}</p>
              </div>
              <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">{msg.body}</p>
            </div>
          ))}
        </CardBody>
      </Card>

      {/* Reply form */}
      {canReply ? (
        <Card>
          <div className="px-5 py-3 border-b border-gray-100 bg-gray-50">
            <p className="text-sm font-medium text-gray-700">Add a reply</p>
          </div>
          <CardBody>
            <TicketReplyForm ticketId={ticket.id} />
          </CardBody>
        </Card>
      ) : (
        <div className="rounded-xl border border-gray-200 bg-gray-50 px-5 py-4 text-sm text-gray-500 text-center">
          This ticket is closed. <Link href="/support" className="text-sky-600 hover:underline">Open a new ticket</Link> if you need further help.
        </div>
      )}
    </div>
  )
}
