import { db } from "@/lib/db"
import { requireSession } from "@/lib/session"
import Link from "next/link"
import Card from "@/components/ui/Card"
import { statusBadge } from "@/components/ui/Badge"
import { DAY_NAMES } from "@/lib/utils"
import NewRouteForm from "@/components/routes/NewRouteForm"

export const dynamic = "force-dynamic"

export default async function RoutesPage() {
  const { companyId } = await requireSession()
  const routes = await db.route.findMany({
    where: { companyId },
    orderBy: [{ dayOfWeek: "asc" }, { name: "asc" }],
    include: { _count: { select: { stops: true } } },
  })

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Routes</h1>
          <p className="text-sm text-gray-500 mt-0.5">{routes.length} routes</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Route list */}
        <div className="lg:col-span-2">
          <Card>
            {routes.length === 0 ? (
              <div className="py-16 text-center">
                <p className="text-gray-400 text-sm">No routes yet. Create your first route.</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {routes.map((route) => (
                  <Link
                    key={route.id}
                    href={`/routes/${route.id}`}
                    className="flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors"
                  >
                    <div>
                      <p className="font-medium text-gray-900">{route.name}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {route.dayOfWeek != null ? DAY_NAMES[route.dayOfWeek] : "No schedule"}
                        {" · "}{route._count.stops} stops
                      </p>
                    </div>
                    {statusBadge(route.isActive ? "active" : "inactive")}
                  </Link>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* New route form */}
        <div>
          <Card>
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900 text-sm">New Route</h2>
            </div>
            <div className="px-5 py-4">
              <NewRouteForm />
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
