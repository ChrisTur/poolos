import { db } from "@/lib/db"
import { requireSession } from "@/lib/session"
import Link from "next/link"
import Card from "@/components/ui/Card"
import { statusBadge } from "@/components/ui/Badge"
import { DAY_NAMES } from "@/lib/utils"
import NewRouteForm from "@/components/routes/NewRouteForm"
import RouteBoard from "@/components/routes/RouteBoard"
import RouteBoardMobile from "@/components/routes/RouteBoardMobile"
import { ChevronRight } from "lucide-react"

export const dynamic = "force-dynamic"

export default async function RoutesPage() {
  const { companyId } = await requireSession()

  const [routes, allActiveCustomers] = await Promise.all([
    db.route.findMany({
      where: { companyId },
      orderBy: [{ dayOfWeek: "asc" }, { name: "asc" }],
      include: {
        _count: { select: { stops: true } },
        stops: {
          orderBy: { position: "asc" },
          include: { customer: true },
        },
      },
    }),
    db.customer.findMany({
      where: { companyId, status: "active" },
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    }),
  ])

  // Customers that appear on at least one route stop
  const scheduledCustomerIds = new Set(
    routes.flatMap((r) => r.stops.map((s) => s.customerId))
  )
  const unscheduledCustomers = allActiveCustomers.filter(
    (c) => !scheduledCustomerIds.has(c.id)
  )

  return (
    <div className="space-y-4 sm:space-y-5">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Routes</h1>
        <p className="text-sm text-gray-500 mt-0.5">{routes.length} routes</p>
      </div>

      {/* Mobile: new route form + board */}
      <div className="lg:hidden space-y-4">
        <Card>
          <div className="px-4 py-3 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900 text-sm">New Route</h2>
          </div>
          <div className="px-4 py-4">
            <NewRouteForm />
          </div>
        </Card>

        {routes.length === 0 ? (
          <Card>
            <div className="py-12 text-center">
              <p className="text-gray-400 text-sm">No routes yet. Create your first route above.</p>
            </div>
          </Card>
        ) : (
          <RouteBoardMobile routes={routes} unscheduledCustomers={unscheduledCustomers} />
        )}
      </div>

      {/* Desktop: board view + new route form */}
      <div className="hidden lg:grid lg:grid-cols-4 gap-6 items-start">
        <div className="lg:col-span-3">
          <Card>
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900 text-sm">Route Board</h2>
              <p className="text-xs text-gray-400 mt-0.5">Drag stops between routes or to/from the unscheduled queue</p>
            </div>
            <div className="px-5 py-4">
              {routes.length === 0 ? (
                <div className="py-10 text-center">
                  <p className="text-gray-400 text-sm">No routes yet. Create your first route to the right.</p>
                </div>
              ) : (
                <RouteBoard routes={routes} unscheduledCustomers={unscheduledCustomers} />
              )}
            </div>
          </Card>
        </div>

        <div>
          <Card>
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900 text-sm">New Route</h2>
            </div>
            <div className="px-5 py-4">
              <NewRouteForm />
            </div>
          </Card>

          {/* Route list for quick nav */}
          {routes.length > 0 && (
            <Card className="mt-4">
              <div className="divide-y divide-gray-50">
                {routes.map((route) => (
                  <Link
                    key={route.id}
                    href={`/routes/${route.id}`}
                    className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{route.name}</p>
                      <p className="text-xs text-gray-400">
                        {route.dayOfWeek != null ? DAY_NAMES[route.dayOfWeek] : "No day"} · {route._count.stops} stops
                      </p>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-gray-300 shrink-0" />
                  </Link>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
