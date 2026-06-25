import { notFound } from "next/navigation"
import Link from "next/link"
import { db } from "@/lib/db"
import { updateTicketStatus } from "@/lib/actions/support"
import { ArrowLeft, Building2 } from "lucide-react"
import Card, { CardHeader, CardBody } from "@/components/ui/Card"
import AdminTicketActions from "./AdminTicketActions"

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

export default async function AdminTicketDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const ticket = await db.supportTicket.findUnique({
    where: { id },
    include: {
      company:     { select: { id: true, name: true, plan: true } },
      submittedBy: { select: { firstName: true, lastName: true, email: true } },
      messages:    { orderBy: { createdAt: "asc" } },
    },
  })
  if (!ticket) notFound()

  const quickStatusUpdate = updateTicketStatus.bind(null, ticket.id)

  return (
    <div className="max-w-2xl space-y-4">
      {/* Header */}
      <div className="flex items-start gap-3">
        <Link href="/admin/support" className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 mt-0.5 shrink-0">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-bold text-gray-900 leading-tight">{ticket.subject}</h1>
          <div className="flex items-center gap-2 mt-1 flex-wrap text-xs text-gray-400">
            <span className={`font-semibold px-2 py-0.5 rounded-full text-[11px] ${STATUS_STYLES[ticket.status]}`}>
              {STATUS_LABELS[ticket.status]}
            </span>
            <span>{CATEGORY_LABELS[ticket.category] ?? ticket.category}</span>
            <span className="text-gray-300">·</span>
            <span>#{ticket.id.slice(-6).toUpperCase()}</span>
            <span className="text-gray-300">·</span>
            <span>{fmtTime(ticket.createdAt)}</span>
          </div>
        </div>
      </div>

      {/* Company info */}
      <div className="bg-white rounded-xl border border-gray-200 px-4 py-3 flex items-center gap-3">
        <span className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600 shrink-0">
          <Building2 className="w-4 h-4" />
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900">{ticket.company.name}</p>
          {ticket.submittedBy && (
            <p className="text-xs text-gray-400">
              {ticket.submittedBy.firstName} {ticket.submittedBy.lastName} · {ticket.submittedBy.email}
            </p>
          )}
        </div>
        <Link href={`/admin/companies/${ticket.company.id}`} className="text-xs text-sky-600 hover:underline shrink-0">
          View company
        </Link>
      </div>

      {/* Quick status change (without reply) */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs text-gray-500 font-medium">Quick status:</span>
        {["open", "in_progress", "resolved", "closed"].map((s) => (
          <form key={s} action={quickStatusUpdate.bind(null, s)}>
            <button
              type="submit"
              className={`text-xs px-2.5 py-1 rounded-lg border transition-colors ${
                ticket.status === s
                  ? "bg-gray-900 text-white border-gray-900"
                  : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
              }`}
            >
              {STATUS_LABELS[s]}
            </button>
          </form>
        ))}
      </div>

      {/* Thread */}
      <Card>
        <CardBody className="divide-y divide-gray-50 !p-0">
          {ticket.messages.map((msg) => (
            <div key={msg.id} className={`px-5 py-4 ${msg.fromAdmin ? "bg-sky-50/40" : ""}`}>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold text-gray-700">
                  {msg.fromAdmin ? (msg.authorName ?? "PoolOS Support") : (msg.authorName ?? ticket.company.name)}
                </p>
                <p className="text-xs text-gray-400">{fmtTime(msg.createdAt)}</p>
              </div>
              <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">{msg.body}</p>
            </div>
          ))}
        </CardBody>
      </Card>

      {/* Reply + status */}
      {ticket.status !== "closed" && (
        <Card>
          <CardHeader>
            <h2 className="text-sm font-semibold text-gray-900">Reply to {ticket.company.name}</h2>
          </CardHeader>
          <CardBody>
            <AdminTicketActions ticketId={ticket.id} currentStatus={ticket.status} />
          </CardBody>
        </Card>
      )}
    </div>
  )
}
