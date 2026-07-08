import { db } from "@/lib/db"
import { requireSession } from "@/lib/session"
import Link from "next/link"
import { ChevronLeft, Star, CalendarDays, FlaskConical, AlertTriangle, User, MapPin } from "lucide-react"
import Card, { CardHeader, CardBody } from "@/components/ui/Card"
import { formatCurrency } from "@/lib/utils"

export const dynamic = "force-dynamic"

const PERIODS = [
  { key: "30d",  label: "Last 30 days" },
  { key: "90d",  label: "Last 90 days" },
  { key: "ytd",  label: "Year to date" },
  { key: "all",  label: "All time" },
]

function getPeriodStart(period: string): Date {
  const now = new Date()
  if (period === "30d") return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  if (period === "90d") return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
  if (period === "ytd") return new Date(now.getFullYear(), 0, 1)
  return new Date(0)
}

function stars(avg: number | null) {
  if (avg == null) return null
  return Math.round(avg * 10) / 10
}

export default async function TechnicianScorecardsPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>
}) {
  const { companyId } = await requireSession()
  const { period = "30d" } = await searchParams
  const periodStart = getPeriodStart(period)

  const [techs, company, visits, chemUsage, openIssues] = await Promise.all([
    db.user.findMany({
      where: { companyId, isActive: true },
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
      select: { id: true, firstName: true, lastName: true, email: true, role: true },
    }),
    db.company.findUnique({
      where: { id: companyId },
      select: { gpsVerificationEnabled: true, gpsVerificationRadiusM: true },
    }),
    db.serviceVisit.findMany({
      where: {
        customer: { companyId },
        technicianId: { not: null },
        status: "completed",
        visitedAt: { gte: periodStart },
      },
      select: {
        id: true,
        technicianId: true,
        visitedAt: true,
        rating: true,
        feedbackComment: true,
        distanceFromCustomerM: true,
      },
    }),
    db.chemicalUsage.findMany({
      where: {
        companyId,
        visit: {
          status: "completed",
          technicianId: { not: null },
          visitedAt: { gte: periodStart },
        },
      },
      include: { visit: { select: { technicianId: true } } },
    }),
    db.issueReport.findMany({
      where: { companyId, status: { in: ["open", "in_progress"] } },
      select: { reportedById: true, priority: true },
    }),
  ])

  // ── Aggregate per technician ──────────────────────────────────────────────

  const gpsEnabled = company?.gpsVerificationEnabled ?? false
  const gpsRadius  = company?.gpsVerificationRadiusM ?? 300

  const visitsByTech  = new Map<string, typeof visits>()
  const chemByTech    = new Map<string, number>()   // total chemical cost
  const issuesByTech  = new Map<string, number>()   // count of open issues reported by tech
  const gpsFlagsByTech = new Map<string, number>()  // count of visits outside GPS radius

  for (const v of visits) {
    const tid = v.technicianId!
    const list = visitsByTech.get(tid) ?? []
    list.push(v)
    visitsByTech.set(tid, list)
    if (gpsEnabled && v.distanceFromCustomerM != null && v.distanceFromCustomerM > gpsRadius) {
      gpsFlagsByTech.set(tid, (gpsFlagsByTech.get(tid) ?? 0) + 1)
    }
  }

  for (const c of chemUsage) {
    const tid = c.visit.technicianId!
    chemByTech.set(tid, (chemByTech.get(tid) ?? 0) + c.totalCost)
  }

  for (const i of openIssues) {
    if (!i.reportedById) continue
    issuesByTech.set(i.reportedById, (issuesByTech.get(i.reportedById) ?? 0) + 1)
  }

  const scorecards = techs.map((tech) => {
    const techVisits  = visitsByTech.get(tech.id) ?? []
    const totalVisits = techVisits.length
    const ratedVisits = techVisits.filter((v) => v.rating != null)
    const avgRating   = ratedVisits.length > 0
      ? ratedVisits.reduce((s, v) => s + v.rating!, 0) / ratedVisits.length
      : null
    const totalChem   = chemByTech.get(tech.id) ?? 0
    const avgChemCost = totalVisits > 0 ? totalChem / totalVisits : 0
    const openIssueCount = issuesByTech.get(tech.id) ?? 0
    const gpsFlagCount   = gpsFlagsByTech.get(tech.id) ?? 0

    return { tech, totalVisits, avgRating, avgChemCost, totalChem, openIssueCount, ratedCount: ratedVisits.length, gpsFlagCount }
  }).sort((a, b) => b.totalVisits - a.totalVisits)

  const totalVisitsAll = scorecards.reduce((s, c) => s + c.totalVisits, 0)

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <Link href="/reports" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 mb-2">
            <ChevronLeft className="w-4 h-4" />
            Reports
          </Link>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Technician Scorecards</h1>
          <p className="text-sm text-gray-500 mt-0.5">Performance summary per technician</p>
        </div>
        {/* Period selector */}
        <div className="flex items-center gap-1.5 bg-white border border-gray-200 rounded-xl p-1 self-start">
          {PERIODS.map((p) => (
            <Link
              key={p.key}
              href={`?period=${p.key}`}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                period === p.key
                  ? "bg-sky-600 text-white"
                  : "text-gray-500 hover:text-gray-900"
              }`}
            >
              {p.label}
            </Link>
          ))}
        </div>
      </div>

      {/* Summary strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Active Technicians", value: techs.length },
          { label: "Total Visits",       value: totalVisitsAll.toLocaleString() },
          { label: "Avg Visits / Tech",  value: techs.length > 0 ? Math.round(totalVisitsAll / techs.length) : 0 },
          {
            label: "Avg Rating",
            value: (() => {
              const rated = scorecards.filter((s) => s.avgRating != null)
              if (rated.length === 0) return "—"
              const avg = rated.reduce((s, c) => s + c.avgRating!, 0) / rated.length
              return (Math.round(avg * 10) / 10).toFixed(1) + " ★"
            })(),
          },
        ].map(({ label, value }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
            <p className="text-xl font-bold text-gray-900">{value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Scorecards */}
      {scorecards.length === 0 ? (
        <Card>
          <CardBody>
            <p className="text-sm text-gray-400 text-center py-10">No team members found.</p>
          </CardBody>
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {scorecards.map(({ tech, totalVisits, avgRating, avgChemCost, totalChem, openIssueCount, ratedCount, gpsFlagCount }) => (
            <Card key={tech.id}>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-sky-100 flex items-center justify-center shrink-0">
                    <User className="w-4 h-4 text-sky-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 text-sm truncate">
                      {tech.firstName} {tech.lastName}
                    </p>
                    <p className="text-xs text-gray-400 capitalize">{tech.role}</p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {gpsEnabled && gpsFlagCount > 0 && (
                      <span className="flex items-center gap-1 text-xs font-medium text-orange-600 bg-orange-50 border border-orange-100 rounded-full px-2 py-0.5">
                        <MapPin className="w-3 h-3" />
                        {gpsFlagCount} GPS
                      </span>
                    )}
                    {openIssueCount > 0 && (
                      <span className="flex items-center gap-1 text-xs font-medium text-red-600 bg-red-50 border border-red-100 rounded-full px-2 py-0.5">
                        <AlertTriangle className="w-3 h-3" />
                        {openIssueCount} open
                      </span>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardBody>
                <div className="grid grid-cols-2 gap-y-4">
                  {/* Visits */}
                  <div className="flex items-start gap-2">
                    <CalendarDays className="w-4 h-4 text-sky-500 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs text-gray-500">Visits</p>
                      <p className="text-lg font-bold text-gray-900">{totalVisits}</p>
                    </div>
                  </div>

                  {/* Rating */}
                  <div className="flex items-start gap-2">
                    <Star className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs text-gray-500">Avg Rating</p>
                      {avgRating != null ? (
                        <div>
                          <p className="text-lg font-bold text-gray-900">{stars(avgRating)?.toFixed(1)} <span className="text-sm font-normal text-gray-400">/ 5</span></p>
                          <p className="text-xs text-gray-400">{ratedCount} rated</p>
                        </div>
                      ) : (
                        <p className="text-sm text-gray-400">No ratings</p>
                      )}
                    </div>
                  </div>

                  {/* Chemical cost per visit */}
                  <div className="flex items-start gap-2">
                    <FlaskConical className="w-4 h-4 text-purple-500 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs text-gray-500">Avg Chem / Visit</p>
                      <p className="text-lg font-bold text-gray-900">
                        {totalVisits > 0 ? formatCurrency(avgChemCost) : "—"}
                      </p>
                    </div>
                  </div>

                  {/* Total chemical spend */}
                  <div className="flex items-start gap-2">
                    <FlaskConical className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs text-gray-500">Total Chem Spend</p>
                      <p className="text-lg font-bold text-gray-900">
                        {totalChem > 0 ? formatCurrency(totalChem) : "—"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Visit volume bar */}
                {totalVisitsAll > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
                        <div
                          className="h-full bg-sky-500 rounded-full transition-all"
                          style={{ width: `${(totalVisits / totalVisitsAll) * 100}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-400 shrink-0 w-10 text-right">
                        {Math.round((totalVisits / totalVisitsAll) * 100)}%
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">Share of total visits</p>
                  </div>
                )}
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
