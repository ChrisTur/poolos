import { db } from "@/lib/db"
import { requireSession } from "@/lib/session"
import Link from "next/link"
import { AlertTriangle, Plus } from "lucide-react"
import Card, { CardHeader, CardBody } from "@/components/ui/Card"
import { updateIssueStatus } from "@/lib/actions/issues"
import NewIssueForm from "./NewIssueForm"

export const dynamic = "force-dynamic"

const CATEGORY_LABELS: Record<string, string> = {
  leak:              "Leak",
  equipment_failure: "Equipment Failure",
  safety_hazard:     "Safety Hazard",
  water_quality:     "Water Quality",
  other:             "Other",
}

const STATUS_STYLES: Record<string, string> = {
  open:        "bg-red-100    text-red-700",
  in_progress: "bg-amber-100  text-amber-700",
  resolved:    "bg-green-100  text-green-700",
}
const STATUS_LABELS: Record<string, string> = {
  open: "Open", in_progress: "In Progress", resolved: "Resolved",
}

const PRIORITY_STYLES: Record<string, string> = {
  low:    "bg-gray-100  text-gray-500",
  normal: "bg-blue-100  text-blue-600",
  high:   "bg-red-100   text-red-600",
}

function fmt(d: Date) {
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
}

export default async function IssuesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
}) {
  const user = await requireSession()
  const companyId = user.companyId as string
  const sp = await searchParams
  const statusFilter = sp.status ?? "open"

  const [issues, counts, customers] = await Promise.all([
    db.issueReport.findMany({
      where: statusFilter === "all" ? { companyId } : { companyId, status: statusFilter },
      orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
      include: {
        customer:    { select: { id: true, firstName: true, lastName: true } },
        reportedBy:  { select: { firstName: true, lastName: true } },
      },
    }),
    db.issueReport.groupBy({ by: ["status"], where: { companyId }, _count: true }),
    db.customer.findMany({
      where: { companyId, status: "active" },
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
      select: { id: true, firstName: true, lastName: true },
    }),
  ])

  const countMap = Object.fromEntries(counts.map((c) => [c.status, c._count]))
  const openCount = (countMap.open ?? 0) + (countMap.in_progress ?? 0)

  const tabs = [
    { key: "open",        label: "Open",       count: countMap.open ?? 0 },
    { key: "in_progress", label: "In Progress", count: countMap.in_progress ?? 0 },
    { key: "resolved",    label: "Resolved",    count: countMap.resolved ?? 0 },
    { key: "all",         label: "All",         count: Object.values(countMap).reduce((s, n) => s + n, 0) },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Issue Reports</h1>
          {openCount > 0 && (
            <p className="text-sm text-red-600 font-medium mt-0.5">{openCount} open issue{openCount !== 1 ? "s" : ""}</p>
          )}
        </div>
      </div>

      {/* New issue form */}
      <Card>
        <CardHeader>
          <h2 className="font-semibold text-gray-900 text-sm flex items-center gap-2">
            <Plus className="w-4 h-4 text-sky-500" /> Report an Issue
          </h2>
        </CardHeader>
        <CardBody>
          <NewIssueForm customers={customers} />
        </CardBody>
      </Card>

      {/* Filter tabs */}
      <div className="flex gap-1 flex-wrap">
        {tabs.map((tab) => (
          <Link
            key={tab.key}
            href={`/issues?status=${tab.key}`}
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

      {/* Issue list */}
      {issues.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <AlertTriangle className="w-10 h-10 text-gray-200 mx-auto mb-3" />
          <p className="text-sm text-gray-400">No issues in this category</p>
        </div>
      ) : (
        <Card>
          <div className="divide-y divide-gray-50">
            {issues.map((issue) => {
              const resolveAction = updateIssueStatus.bind(null, issue.id, "resolved")
              const reopenAction  = updateIssueStatus.bind(null, issue.id, "open")
              return (
                <div key={issue.id} className="flex items-start gap-4 px-5 py-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                      <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${STATUS_STYLES[issue.status] ?? STATUS_STYLES.open}`}>
                        {STATUS_LABELS[issue.status] ?? issue.status}
                      </span>
                      <span className={`text-[11px] px-2 py-0.5 rounded-full ${PRIORITY_STYLES[issue.priority]}`}>
                        {issue.priority}
                      </span>
                      <span className="text-xs text-gray-400">{CATEGORY_LABELS[issue.category] ?? issue.category}</span>
                    </div>
                    <p className="text-sm font-medium text-gray-900 truncate">{issue.notes}</p>
                    <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-400 flex-wrap">
                      <Link href={`/customers/${issue.customer.id}`} className="hover:text-sky-600 hover:underline">
                        {issue.customer.firstName} {issue.customer.lastName}
                      </Link>
                      {issue.reportedBy && (
                        <>
                          <span className="text-gray-200">·</span>
                          <span>{issue.reportedBy.firstName} {issue.reportedBy.lastName}</span>
                        </>
                      )}
                      <span className="text-gray-200">·</span>
                      <span>{fmt(issue.createdAt)}</span>
                    </div>
                  </div>
                  <div className="shrink-0">
                    {issue.status !== "resolved" ? (
                      <form action={resolveAction}>
                        <button
                          type="submit"
                          className="text-xs px-2.5 py-1 rounded-lg border border-green-200 text-green-700 bg-green-50 hover:bg-green-100 transition-colors"
                        >
                          Resolve
                        </button>
                      </form>
                    ) : (
                      <form action={reopenAction}>
                        <button
                          type="submit"
                          className="text-xs px-2.5 py-1 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors"
                        >
                          Reopen
                        </button>
                      </form>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </Card>
      )}
    </div>
  )
}
