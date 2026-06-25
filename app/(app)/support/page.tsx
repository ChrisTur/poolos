import { db } from "@/lib/db"
import { requireSession } from "@/lib/session"
import Link from "next/link"
import { LifeBuoy, ChevronRight, Plus } from "lucide-react"
import Card, { CardHeader, CardBody } from "@/components/ui/Card"
import NewTicketForm from "./NewTicketForm"

export const dynamic = "force-dynamic"

const CATEGORY_LABELS: Record<string, string> = {
  billing:         "Billing & Payments",
  technical:       "Technical Issue",
  feature_request: "Feature Request",
  account:         "Account & Settings",
  other:           "Other",
}

const STATUS_STYLES: Record<string, string> = {
  open:        "bg-sky-100   text-sky-700",
  in_progress: "bg-amber-100 text-amber-700",
  resolved:    "bg-green-100 text-green-700",
  closed:      "bg-gray-100  text-gray-500",
}

const STATUS_LABELS: Record<string, string> = {
  open:        "Open",
  in_progress: "In Progress",
  resolved:    "Resolved",
  closed:      "Closed",
}

function fmt(d: Date) {
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
}

export default async function SupportPage() {
  const user = await requireSession()

  const tickets = await db.supportTicket.findMany({
    where: { companyId: user.companyId as string },
    orderBy: { updatedAt: "desc" },
    include: {
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { body: true, fromAdmin: true, createdAt: true },
      },
      _count: { select: { messages: true } },
    },
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Support</h1>
          <p className="text-sm text-gray-500 mt-0.5">Get help from the PoolOS team</p>
        </div>
      </div>

      {/* New ticket form */}
      <Card>
        <CardHeader>
          <h2 className="font-semibold text-gray-900 text-sm flex items-center gap-2">
            <Plus className="w-4 h-4 text-sky-500" /> New Support Ticket
          </h2>
        </CardHeader>
        <CardBody>
          <NewTicketForm />
        </CardBody>
      </Card>

      {/* Ticket list */}
      {tickets.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <LifeBuoy className="w-10 h-10 text-gray-200 mx-auto mb-3" />
          <p className="text-sm font-medium text-gray-500">No tickets yet</p>
          <p className="text-xs text-gray-400 mt-1">Submit a ticket above and we'll get back to you quickly.</p>
        </div>
      ) : (
        <Card>
          <div className="divide-y divide-gray-50">
            {tickets.map((t) => {
              const latest = t.messages[0]
              return (
                <Link
                  key={t.id}
                  href={`/support/${t.id}`}
                  className="flex items-start gap-4 px-5 py-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                      <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${STATUS_STYLES[t.status] ?? STATUS_STYLES.open}`}>
                        {STATUS_LABELS[t.status] ?? t.status}
                      </span>
                      <span className="text-xs text-gray-400">{CATEGORY_LABELS[t.category] ?? t.category}</span>
                    </div>
                    <p className="text-sm font-medium text-gray-900 truncate">{t.subject}</p>
                    {latest && (
                      <p className="text-xs text-gray-400 truncate mt-0.5">
                        {latest.fromAdmin ? "PoolOS: " : "You: "}{latest.body}
                      </p>
                    )}
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-xs text-gray-400">{fmt(t.updatedAt)}</p>
                    <p className="text-xs text-gray-300 mt-0.5">{t._count.messages} message{t._count.messages !== 1 ? "s" : ""}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-300 shrink-0 mt-0.5" />
                </Link>
              )
            })}
          </div>
        </Card>
      )}
    </div>
  )
}
