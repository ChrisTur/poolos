import { AlertTriangle } from "lucide-react"
import Link from "next/link"
import { formatDate } from "@/lib/utils"
import { createIssueReport, updateIssueStatus } from "@/lib/actions/issues"
import type { IssueReport, User } from "@/app/generated/prisma/client"

type IssueWithReporter = IssueReport & {
  reportedBy: Pick<User, "firstName" | "lastName"> | null
}

const STATUS_STYLES: Record<string, string> = {
  open:        "bg-red-100 text-red-700",
  in_progress: "bg-amber-100 text-amber-700",
  resolved:    "bg-green-100 text-green-700",
}
const STATUS_LABELS: Record<string, string> = {
  open: "Open", in_progress: "In Progress", resolved: "Resolved",
}
const CAT_LABELS: Record<string, string> = {
  leak:              "Leak",
  equipment_failure: "Equipment Failure",
  safety_hazard:     "Safety Hazard",
  water_quality:     "Water Quality",
  other:             "Other",
}

export default function CustomerIssueSection({
  customerId,
  issues,
}: {
  customerId: string
  issues: IssueWithReporter[]
}) {
  const openCount = issues.filter((i) => i.status !== "resolved").length

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-4">
        <h2 className="font-semibold text-gray-900 text-sm flex items-center gap-1.5">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-500" /> Issue Reports
          {openCount > 0 && (
            <span className="ml-1 text-xs font-semibold px-1.5 py-0.5 rounded-full bg-red-100 text-red-700">
              {openCount} open
            </span>
          )}
        </h2>
        <Link href="/issues" className="text-xs text-sky-600 hover:underline">View all</Link>
      </div>

      <div className="px-5 space-y-4">
        {/* Existing issues */}
        {issues.length > 0 && (
          <div className="space-y-2">
            {issues.map((issue) => {
              const resolveAction = updateIssueStatus.bind(null, issue.id, "resolved")
              const reopenAction  = updateIssueStatus.bind(null, issue.id, "open")
              return (
                <div key={issue.id} className="flex items-start gap-3 bg-gray-50 rounded-lg px-3 py-2.5">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                      <span className={`text-[11px] font-semibold px-1.5 py-0.5 rounded-full ${STATUS_STYLES[issue.status] ?? STATUS_STYLES.open}`}>
                        {STATUS_LABELS[issue.status] ?? issue.status}
                      </span>
                      <span className="text-[11px] text-gray-500">{CAT_LABELS[issue.category] ?? issue.category}</span>
                    </div>
                    <p className="text-sm text-gray-700 leading-snug">{issue.notes}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {issue.reportedBy ? `${issue.reportedBy.firstName} ${issue.reportedBy.lastName} · ` : ""}
                      {formatDate(issue.createdAt)}
                    </p>
                  </div>
                  {issue.status !== "resolved" ? (
                    <form action={resolveAction}>
                      <button type="submit" className="shrink-0 text-xs text-green-700 hover:text-green-800 font-medium mt-0.5">Resolve</button>
                    </form>
                  ) : (
                    <form action={reopenAction}>
                      <button type="submit" className="shrink-0 text-xs text-gray-400 hover:text-gray-600 mt-0.5">Reopen</button>
                    </form>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* Report new issue */}
        <form action={createIssueReport} className="space-y-2.5 border-t border-gray-100 pt-3">
          <input type="hidden" name="customerId" value={customerId} />
          <div className="grid grid-cols-2 gap-2">
            <select
              name="category"
              required
              className="rounded-lg border border-gray-300 px-2.5 py-1.5 text-xs bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
            >
              <option value="">Category…</option>
              <option value="leak">Leak</option>
              <option value="equipment_failure">Equipment Failure</option>
              <option value="safety_hazard">Safety Hazard</option>
              <option value="water_quality">Water Quality</option>
              <option value="other">Other</option>
            </select>
            <select
              name="priority"
              defaultValue="normal"
              className="rounded-lg border border-gray-300 px-2.5 py-1.5 text-xs bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
            >
              <option value="low">Low priority</option>
              <option value="normal">Normal priority</option>
              <option value="high">High priority</option>
            </select>
          </div>
          <div className="flex gap-2">
            <textarea
              name="notes"
              required
              rows={2}
              placeholder="Describe the issue…"
              className="flex-1 rounded-lg border border-gray-300 px-2.5 py-1.5 text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-500 resize-none"
            />
            <button
              type="submit"
              className="shrink-0 self-end px-3 py-1.5 rounded-lg bg-amber-500 text-white text-xs font-medium hover:bg-amber-600 transition-colors"
            >
              Report
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

