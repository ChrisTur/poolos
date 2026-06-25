import { db } from "@/lib/db"
import { requireSession } from "@/lib/session"
import Card, { CardHeader, CardBody } from "@/components/ui/Card"
import { DAY_NAMES, formatDate } from "@/lib/utils"
import { statusBadge } from "@/components/ui/Badge"
import LogVisitForm from "@/components/schedule/LogVisitForm"
import ScheduleCalendar from "@/components/schedule/ScheduleCalendar"
import Link from "next/link"

export const dynamic = "force-dynamic"

const FREQUENCY_DAYS: Record<string, number> = {
  weekly:    7,
  biweekly:  14,
  monthly:   30,
  quarterly: 90,
  as_needed: Infinity,
}

const FREQUENCY_LABELS: Record<string, string> = {
  weekly:    "Weekly",
  biweekly:  "Bi-weekly",
  monthly:   "Monthly",
  quarterly: "Quarterly",
  as_needed: "As needed",
}

export default async function SchedulePage() {
  const { companyId } = await requireSession()
  // eslint-disable-next-line react-hooks/purity
  const today = new Date()
  const thisYear  = today.getFullYear()
  const thisMonth = today.getMonth()
  const monthStart = new Date(thisYear, thisMonth, 1)
  const monthEnd   = new Date(thisYear, thisMonth + 1, 0, 23, 59, 59, 999)

  const [routes, recentVisits, customers, scheduledCustomers, checklistItems, monthVisits, companyUsers] = await Promise.all([
    db.route.findMany({
      where: { companyId, isActive: true },
      orderBy: { dayOfWeek: "asc" },
      include: {
        stops: {
          orderBy: { position: "asc" },
          include: { customer: true },
        },
        assignedUser: { select: { id: true, firstName: true, lastName: true } },
      },
    }),
    db.serviceVisit.findMany({
      take: 20,
      orderBy: { visitedAt: "desc" },
      include: { customer: true, route: true },
      where: { customer: { companyId } },
    }),
    db.customer.findMany({
      where: { companyId, status: "active" },
      orderBy: [{ lastName: "asc" }],
    }),
    db.customer.findMany({
      where: { companyId, status: "active", serviceFrequency: { not: null } },
      include: {
        serviceVisits: { orderBy: { visitedAt: "desc" }, take: 1 },
      },
      orderBy: [{ lastName: "asc" }],
    }),
    db.visitChecklistItem.findMany({
      where: { companyId, isActive: true },
      orderBy: { position: "asc" },
    }),
    db.serviceVisit.findMany({
      where: { customer: { companyId }, visitedAt: { gte: monthStart, lte: monthEnd } },
      select: {
        id: true, visitedAt: true, status: true,
        customer:   { select: { id: true, firstName: true, lastName: true } },
        route:      { select: { id: true, name: true } },
        technician: { select: { id: true, firstName: true, lastName: true } },
      },
      orderBy: { visitedAt: "asc" },
    }),
    db.user.findMany({
      where: { companyId, isActive: true },
      orderBy: [{ firstName: "asc" }],
      select: { id: true, firstName: true, lastName: true },
    }),
  ])

  const byDay = DAY_NAMES.reduce<Record<number, typeof routes>>((acc, _, i) => {
    acc[i] = routes.filter((r) => r.dayOfWeek === i)
    return acc
  }, {})

  const unscheduled = routes.filter((r) => r.dayOfWeek == null)

  // Build due/overdue list for customers with serviceFrequency set
  const now = today.getTime()
  const dueCustomers = scheduledCustomers
    .filter((c) => c.serviceFrequency && c.serviceFrequency !== "as_needed")
    .map((c) => {
      const lastVisit = c.serviceVisits[0]
      const daysSince = lastVisit
        ? Math.floor((now - new Date(lastVisit.visitedAt).getTime()) / (1000 * 60 * 60 * 24))
        : null
      const freqDays  = FREQUENCY_DAYS[c.serviceFrequency!] ?? Infinity
      const isOverdue = daysSince == null || daysSince > freqDays
      const isDueSoon = !isOverdue && daysSince != null && daysSince >= freqDays - 3

      return { customer: c, daysSince, freqDays, isOverdue, isDueSoon }
    })
    .filter((e) => e.isOverdue || e.isDueSoon)
    .sort((a, b) => {
      // Overdue first, then by days since (most overdue at top)
      if (a.isOverdue && !b.isOverdue) return -1
      if (!a.isOverdue && b.isOverdue) return 1
      if (a.daysSince == null) return -1
      if (b.daysSince == null) return 1
      return b.daysSince - a.daysSince
    })

  return (
    <div className="space-y-4 sm:space-y-6">
      <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Schedule</h1>

      {/* Calendar */}
      <Card>
        <CardBody>
          <ScheduleCalendar
            initialVisits={monthVisits}
            routes={routes.map((r) => ({ id: r.id, name: r.name, dayOfWeek: r.dayOfWeek, stops: r.stops }))}
            initialYear={thisYear}
            initialMonth={thisMonth}
          />
        </CardBody>
      </Card>

      {/* Overdue / Due Soon section */}
      {dueCustomers.length > 0 && (
        <Card>
          <CardHeader>
            <h2 className="font-semibold text-gray-900 text-sm sm:text-base">Overdue / Due Soon</h2>
          </CardHeader>
          <div className="divide-y divide-gray-50">
            {dueCustomers.map(({ customer: c, daysSince, freqDays, isOverdue, isDueSoon }) => (
              <div key={c.id} className="flex items-center justify-between px-4 sm:px-5 py-3 gap-3">
                <div className="min-w-0">
                  <Link href={`/customers/${c.id}`} className="text-sm font-medium text-gray-900 hover:text-sky-600">
                    {c.firstName} {c.lastName}
                  </Link>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {FREQUENCY_LABELS[c.serviceFrequency!] ?? c.serviceFrequency}
                    {" · "}
                    {daysSince == null
                      ? "No visits yet"
                      : `${daysSince} day${daysSince !== 1 ? "s" : ""} since last visit`}
                  </p>
                </div>
                <span
                  className={`shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full ${
                    isOverdue
                      ? "bg-red-100 text-red-700"
                      : isDueSoon
                      ? "bg-yellow-100 text-yellow-700"
                      : "bg-green-100 text-green-700"
                  }`}
                >
                  {isOverdue ? "Overdue" : "Due soon"}
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Mobile: log-visit form first */}
      <div className="lg:hidden">
        <Card>
          <CardHeader><h2 className="font-semibold text-gray-900 text-sm">Log a Visit</h2></CardHeader>
          <CardBody>
            <LogVisitForm customers={customers} routes={routes} checklistItems={checklistItems} users={companyUsers} />
          </CardBody>
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-4 sm:gap-6">
        <div className="lg:col-span-2 space-y-4 sm:space-y-5">
          {/* Weekly grid */}
          <div className="space-y-3">
            {DAY_NAMES.map((day, i) => {
              const dayRoutes = byDay[i]
              if (dayRoutes.length === 0) return null
              return (
                <Card key={i}>
                  <CardHeader>
                    <h2 className="font-semibold text-gray-900 text-sm sm:text-base">{day}</h2>
                  </CardHeader>
                  <div className="divide-y divide-gray-50">
                    {dayRoutes.map((route) => (
                      <div key={route.id} className="px-4 sm:px-5 py-3">
                        <div className="flex items-center justify-between gap-2">
                          <Link href={`/routes/${route.id}`} className="text-sm font-medium text-sky-700 hover:underline">
                            {route.name}
                          </Link>
                          {route.assignedUser && (
                            <span className="text-xs text-gray-400 shrink-0">
                              {route.assignedUser.firstName} {route.assignedUser.lastName}
                            </span>
                          )}
                        </div>
                        <div className="mt-2 space-y-1.5">
                          {route.stops.map((stop, idx) => (
                            <div key={stop.id} className="flex items-center gap-2 text-xs text-gray-500">
                              <span className="w-5 h-5 rounded-full bg-sky-100 text-sky-700 flex items-center justify-center font-medium shrink-0">
                                {idx + 1}
                              </span>
                              <span className="font-medium text-gray-700 shrink-0">
                                {stop.customer.firstName} {stop.customer.lastName}
                              </span>
                              <span className="text-gray-400 truncate hidden sm:inline">
                                — {stop.customer.address}, {stop.customer.city}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              )
            })}

            {unscheduled.length > 0 && (
              <Card>
                <CardHeader><h2 className="font-semibold text-gray-900 text-sm sm:text-base">Unscheduled Routes</h2></CardHeader>
                {unscheduled.map((route) => (
                  <div key={route.id} className="px-4 sm:px-5 py-3 border-b border-gray-50 last:border-0">
                    <Link href={`/routes/${route.id}`} className="text-sm font-medium text-sky-700 hover:underline">
                      {route.name}
                    </Link>
                    <p className="text-xs text-gray-400">{route.stops.length} stops</p>
                  </div>
                ))}
              </Card>
            )}

            {routes.length === 0 && (
              <Card>
                <CardBody>
                  <p className="text-sm text-gray-400 text-center py-8">
                    No active routes.{" "}
                    <Link href="/routes" className="text-sky-600 hover:underline">Create one</Link>.
                  </p>
                </CardBody>
              </Card>
            )}
          </div>

          {/* Recent visits */}
          <Card>
            <CardHeader><h2 className="font-semibold text-gray-900 text-sm sm:text-base">Recent Visits</h2></CardHeader>
            {recentVisits.length === 0 ? (
              <CardBody><p className="text-sm text-gray-400">No visits logged yet.</p></CardBody>
            ) : (
              <div className="divide-y divide-gray-50">
                {recentVisits.map((v) => (
                  <div key={v.id} className="flex items-start justify-between px-4 sm:px-5 py-3">
                    <div className="min-w-0 mr-3">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        <Link href={`/customers/${v.customerId}`} className="hover:text-sky-600">
                          {v.customer.firstName} {v.customer.lastName}
                        </Link>
                      </p>
                      {v.route && <p className="text-xs text-gray-400 truncate">{v.route.name}</p>}
                      {v.notes && <p className="text-xs text-gray-500 mt-0.5 italic truncate">{v.notes}</p>}
                      {(v.chlorine != null || v.ph != null) && (
                        <p className="text-xs text-gray-400 mt-0.5">
                          {v.chlorine != null && `Cl: ${v.chlorine}`}
                          {v.ph != null && ` · pH: ${v.ph}`}
                          {v.alkalinity != null && ` · Alk: ${v.alkalinity}`}
                          {v.calcium != null && ` · Ca: ${v.calcium}`}
                        </p>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      {statusBadge(v.status)}
                      <p className="text-xs text-gray-400 mt-1">{formatDate(v.visitedAt)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Log a visit — desktop sidebar only */}
        <div className="hidden lg:block">
          <Card>
            <CardHeader><h2 className="font-semibold text-gray-900 text-sm">Log a Visit</h2></CardHeader>
            <CardBody>
              <LogVisitForm customers={customers} routes={routes} checklistItems={checklistItems} users={companyUsers} />
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  )
}
