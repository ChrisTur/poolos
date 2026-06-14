import { db } from "@/lib/db"
import { requireSession } from "@/lib/session"
import Card, { CardHeader, CardBody } from "@/components/ui/Card"
import { DAY_NAMES, formatDate } from "@/lib/utils"
import { statusBadge } from "@/components/ui/Badge"
import LogVisitForm from "@/components/schedule/LogVisitForm"
import Link from "next/link"

export const dynamic = "force-dynamic"

export default async function SchedulePage() {
  const { companyId } = await requireSession()
  const [routes, recentVisits, customers] = await Promise.all([
    db.route.findMany({
      where: { companyId, isActive: true },
      orderBy: { dayOfWeek: "asc" },
      include: {
        stops: {
          orderBy: { position: "asc" },
          include: { customer: true },
        },
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
  ])

  const byDay = DAY_NAMES.reduce<Record<number, typeof routes>>((acc, _, i) => {
    acc[i] = routes.filter((r) => r.dayOfWeek === i)
    return acc
  }, {})

  const unscheduled = routes.filter((r) => r.dayOfWeek == null)

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Schedule</h1>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-5">
          {/* Weekly grid */}
          <div className="space-y-3">
            {DAY_NAMES.map((day, i) => {
              const dayRoutes = byDay[i]
              if (dayRoutes.length === 0) return null
              return (
                <Card key={i}>
                  <CardHeader>
                    <h2 className="font-semibold text-gray-900">{day}</h2>
                  </CardHeader>
                  <div className="divide-y divide-gray-50">
                    {dayRoutes.map((route) => (
                      <div key={route.id} className="px-5 py-3">
                        <Link href={`/routes/${route.id}`} className="text-sm font-medium text-sky-700 hover:underline">
                          {route.name}
                        </Link>
                        <div className="mt-2 space-y-1.5">
                          {route.stops.map((stop, idx) => (
                            <div key={stop.id} className="flex items-center gap-2 text-xs text-gray-500">
                              <span className="w-5 h-5 rounded-full bg-sky-100 text-sky-700 flex items-center justify-center font-medium shrink-0">
                                {idx + 1}
                              </span>
                              <span className="font-medium text-gray-700">
                                {stop.customer.firstName} {stop.customer.lastName}
                              </span>
                              <span className="text-gray-400">— {stop.customer.address}, {stop.customer.city}</span>
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
                <CardHeader><h2 className="font-semibold text-gray-900">Unscheduled Routes</h2></CardHeader>
                {unscheduled.map((route) => (
                  <div key={route.id} className="px-5 py-3 border-b border-gray-50 last:border-0">
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
            <CardHeader><h2 className="font-semibold text-gray-900">Recent Visits</h2></CardHeader>
            {recentVisits.length === 0 ? (
              <CardBody><p className="text-sm text-gray-400">No visits logged yet.</p></CardBody>
            ) : (
              <div className="divide-y divide-gray-50">
                {recentVisits.map((v) => (
                  <div key={v.id} className="flex items-start justify-between px-5 py-3">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        <Link href={`/customers/${v.customerId}`} className="hover:text-sky-600">
                          {v.customer.firstName} {v.customer.lastName}
                        </Link>
                      </p>
                      {v.route && <p className="text-xs text-gray-400">{v.route.name}</p>}
                      {v.notes && <p className="text-xs text-gray-500 mt-0.5 italic">{v.notes}</p>}
                      {(v.chlorine != null || v.ph != null) && (
                        <p className="text-xs text-gray-400 mt-0.5">
                          {v.chlorine != null && `Cl: ${v.chlorine}`}
                          {v.ph != null && ` · pH: ${v.ph}`}
                          {v.alkalinity != null && ` · Alk: ${v.alkalinity}`}
                          {v.calcium != null && ` · Ca: ${v.calcium}`}
                        </p>
                      )}
                    </div>
                    <div className="text-right shrink-0 ml-4">
                      {statusBadge(v.status)}
                      <p className="text-xs text-gray-400 mt-1">{formatDate(v.visitedAt)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Log a visit */}
        <div>
          <Card>
            <CardHeader><h2 className="font-semibold text-gray-900 text-sm">Log a Visit</h2></CardHeader>
            <CardBody>
              <LogVisitForm customers={customers} routes={routes} />
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  )
}
