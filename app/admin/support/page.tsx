import { db } from "@/lib/db"
import Link from "next/link"
import { LifeBuoy, ChevronRight } from "lucide-react"
import Card from "@/components/ui/Card"

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

const PRIORITY_STYLES: Record<string, string> = {
  low:    "bg-gray-100  text-gray-500",
  normal: "bg-blue-100  text-blue-600",
  high:   "bg-red-100   text-red-600",
}

function fmt(d: Date) {
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" })
}

export default async function AdminSupportPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
}) {
  const sp = await searchParams
  const statusFilter = sp.status ?? "open"

  const [tickets, counts] = await Promise.all([
    db.supportTicket.findMany({
      where: statusFilter === "all" ? {} : { status: statusFilter },
      orderBy: { updatedAt: "desc" },
      include: {
        company: { select: { id: true, name: true } },
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: { body: true, fromAdmin: true },
        },
        _count: { select: { messages: true } },
      },
    }),
    db.supportTicket.groupBy({
      by: ["status"],
      _count: true,
    }),
  ])

  const countMap = Object.fromEntries(counts.map((c) => [c.status, c._count]))
  const totalOpen = (countMap.open ?? 0) + (countMap.in_progress ?? 0)

  const tabs = [
    { key: "open",        label: "Open",        count: countMap.open ?? 0 },
    { key: "in_progress", label: "In Progress",  count: countMap.in_progress ?? 0 },
    { key: "resolved",    label: "Resolved",     count: countMap.resolved ?? 0 },
    { key: "closed",      label: "Closed",       count: countMap.closed ?? 0 },
    { key: "all",         label: "All",          count: Object.values(countMap).reduce((s, n) => s + n, 0) },
  ]

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Support Tickets</h1>
          {totalOpen > 0 && (
            <p className="text-sm text-amber-600 font-medium mt-0.5">{totalOpen} ticket{totalOpen !== 1 ? "s" : ""} need attention</p>
          )}
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 flex-wrap">
        {tabs.map((tab) => (
          <Link
            key={tab.key}
            href={`/admin/support?status=${tab.key}`}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              statusFilter === tab.key
                ? "bg-sky-600 text-white"
                : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
            }`}
          >
            {tab.label}
            {tab.count > 0 && (
              <span className={`ml-1.5 text-xs ${statusFilter === tab.key ? "text-sky-200" : "text-gray-400"}`}>
                {tab.count}
              </span>
            )}
          </Link>
        ))}
      </div>

      {tickets.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <LifeBuoy className="w-10 h-10 text-gray-200 mx-auto mb-3" />
          <p className="text-sm text-gray-400">No tickets in this category</p>
        </div>
      ) : (
        <Card>
          <div className="divide-y divide-gray-50">
            {tickets.map((t) => {
              const latest = t.messages[0]
              const needsReply = latest && !latest.fromAdmin
              return (
                <Link
                  key={t.id}
                  href={`/admin/support/${t.id}`}
                  className="flex items-start gap-4 px-5 py-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                      <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${STATUS_STYLES[t.status]}`}>
                        {STATUS_LABELS[t.status]}
                      </span>
                      {needsReply && (
                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-red-100 text-red-600">
                          Needs Reply
                        </span>
                      )}
                      <span className={`text-[11px] px-2 py-0.5 rounded-full ${PRIORITY_STYLES[t.priority]}`}>
                        {t.priority}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-gray-900 truncate">{t.subject}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {t.company.name} · {CATEGORY_LABELS[t.category] ?? t.category}
                    </p>
                    {latest && (
                      <p className="text-xs text-gray-400 truncate mt-0.5">
                        {latest.fromAdmin ? "You: " : `${t.company.name}: `}{latest.body}
                      </p>
                    )}
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-xs text-gray-400">{fmt(t.updatedAt)}</p>
                    <p className="text-xs text-gray-300 mt-0.5">{t._count.messages} msg</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-300 shrink-0 mt-1" />
                </Link>
              )
            })}
          </div>
        </Card>
      )}
    </div>
  )
}
