import { db } from "@/lib/db"
import { requireSession } from "@/lib/session"
import { notFound } from "next/navigation"
import Link from "next/link"
import { ChevronLeft } from "lucide-react"
import Card, { CardHeader, CardBody } from "@/components/ui/Card"
import { DAY_NAMES } from "@/lib/utils"
import RouteStopList from "@/components/routes/RouteStopList"
import AddStopForm from "@/components/routes/AddStopForm"
import { deleteRoute, updateRoute } from "@/lib/actions/routes"
import Button from "@/components/ui/Button"
import RouteMap from "@/components/routes/RouteMap"
import DeleteRouteButton from "@/components/routes/DeleteRouteButton"
import OptimizeButton from "@/components/routes/OptimizeButton"
import { geocodeAddress } from "@/lib/geocode"
import RouteRunPanel from "./RouteRunPanel"

export const dynamic = "force-dynamic"

function todayWindow() {
  const start = new Date()
  start.setHours(0, 0, 0, 0)
  const end = new Date(start)
  end.setDate(end.getDate() + 1)
  return { start, end }
}

export default async function RouteDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { companyId } = await requireSession()
  const { id } = await params

  const [route, allCustomers, companyUsers, company, vehicles] = await Promise.all([
    db.route.findFirst({
      where: { id, companyId },
      include: {
        stops: {
          orderBy: { position: "asc" },
          include: { customer: true },
        },
        assignedUser: { select: { id: true, firstName: true, lastName: true, defaultStartAddress: true } },
      },
    }),
    db.customer.findMany({
      where: { companyId, status: "active" },
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    }),
    db.user.findMany({
      where: { companyId, isActive: true },
      orderBy: [{ firstName: "asc" }],
      select: { id: true, firstName: true, lastName: true },
    }),
    db.company.findUnique({
      where: { id: companyId },
      select: { address: true, city: true, state: true, zip: true },
    }),
    db.vehicle.findMany({
      where: { companyId, isActive: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true, make: true, model: true, year: true },
    }),
  ])

  if (!route) notFound()

  const { start: todayStart, end: todayEnd } = todayWindow()
  const routeCustomerIds = route.stops.map((s) => s.customerId)

  const [activeRun, todayVisits, pastRuns] = await Promise.all([
    db.routeRun.findFirst({
      where: { routeId: id, companyId, date: todayStart, completedAt: null },
      include: { extraStops: { orderBy: { createdAt: "asc" } } },
    }),
    db.serviceVisit.findMany({
      where: {
        customer: { companyId },
        customerId: { in: routeCustomerIds },
        visitedAt: { gte: todayStart, lt: todayEnd },
      },
      select: { customerId: true },
    }),
    db.routeRun.findMany({
      where: { routeId: id, companyId, completedAt: { not: null } },
      orderBy: { date: "desc" },
      take: 5,
      include: { technician: { select: { firstName: true, lastName: true } } },
    }),
  ])

  const completedVisitCustomerIds = todayVisits.map((v) => v.customerId)

  const defaultStart =
    route.assignedUser?.defaultStartAddress ||
    (company?.address ? `${company.address}, ${company.city}, ${company.state} ${company.zip}` : "")

  const deleteAction = deleteRoute.bind(null, id)
  const updateAction = updateRoute.bind(null, id)

  const stopCustomerIds = new Set(route.stops.map((s) => s.customerId))
  const availableCustomers = allCustomers.filter((c) => !stopCustomerIds.has(c.id))

  // Geocode all stops + start address server-side so the map component just places markers
  const [markers, startCoords] = await Promise.all([
    Promise.all(
      route.stops.map(async (stop, i) => {
        const addr = `${stop.customer.address}, ${stop.customer.city}, ${stop.customer.state} ${stop.customer.zip}`
        const coords = await geocodeAddress(addr)
        return {
          label: String(i + 1),
          name: `${stop.customer.firstName} ${stop.customer.lastName}`,
          address: addr,
          lat: coords?.lat ?? null,
          lng: coords?.lng ?? null,
        }
      })
    ),
    defaultStart ? geocodeAddress(defaultStart) : Promise.resolve(null),
  ])

  const startMarker = startCoords
    ? { lat: startCoords.lat, lng: startCoords.lng, address: defaultStart }
    : undefined

  return (
    <div className="space-y-6">
      <div>
        <Link href="/routes" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900 mb-3">
          <ChevronLeft className="w-4 h-4" /> Routes
        </Link>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{route.name}</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {route.dayOfWeek != null ? DAY_NAMES[route.dayOfWeek] : "No fixed day"} · {route.stops.length} stops
            </p>
          </div>
          <DeleteRouteButton action={deleteAction} />
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Stop list */}
        <div className="lg:col-span-2 space-y-5">
          <Card>
            <CardHeader className="flex items-center justify-between">
              <h2 className="font-semibold text-gray-900 text-sm">Stops</h2>
              <div className="flex items-center gap-3">
                <OptimizeButton routeId={id} stopCount={route.stops.length} defaultStart={defaultStart} />
                <p className="text-xs text-gray-400">Drag to reorder</p>
              </div>
            </CardHeader>
            <CardBody>
              <RouteStopList
                key={route.stops.map((s) => s.id).join(",")}
                stops={route.stops}
                routeId={id}
              />
            </CardBody>
          </Card>

          <RouteMap markers={markers} startMarker={startMarker} />
        </div>

        {/* Sidebar */}
        <div className="space-y-5">
          {/* Route run / progress */}
          <RouteRunPanel
            routeId={id}
            stops={route.stops}
            activeRun={activeRun}
            completedVisitCustomerIds={completedVisitCustomerIds}
            vehicles={vehicles}
          />

          {/* Add stop */}
          <Card>
            <CardHeader><h2 className="font-semibold text-gray-900 text-sm">Add Stop</h2></CardHeader>
            <CardBody>
              <AddStopForm routeId={id} customers={availableCustomers} />
            </CardBody>
          </Card>

          {/* Route settings */}
          <Card>
            <CardHeader><h2 className="font-semibold text-gray-900 text-sm">Route Settings</h2></CardHeader>
            <CardBody>
              <form action={updateAction} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <input
                    name="name"
                    defaultValue={route.name}
                    required
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Day of Week</label>
                  <select
                    name="dayOfWeek"
                    defaultValue={route.dayOfWeek?.toString() ?? ""}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  >
                    <option value="">No fixed day</option>
                    {["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"].map((d, i) => (
                      <option key={i} value={i}>{d}</option>
                    ))}
                  </select>
                </div>
                {companyUsers.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Assigned Technician</label>
                    <select
                      name="assignedUserId"
                      defaultValue={route.assignedUserId ?? ""}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
                    >
                      <option value="">Unassigned</option>
                      {companyUsers.map((u) => (
                        <option key={u.id} value={u.id}>{u.firstName} {u.lastName}</option>
                      ))}
                    </select>
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    name="isActive"
                    defaultValue={route.isActive ? "true" : "false"}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  >
                    <option value="true">Active</option>
                    <option value="false">Inactive</option>
                  </select>
                </div>
                <Button type="submit" size="sm" className="w-full">Save Settings</Button>
              </form>
            </CardBody>
          </Card>

          {/* Mileage / run history */}
          {pastRuns.length > 0 && (
            <Card>
              <CardHeader><h2 className="font-semibold text-gray-900 text-sm">Mileage Log</h2></CardHeader>
              <CardBody className="p-0">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-left px-4 py-2 font-medium text-gray-500">Date</th>
                      <th className="text-right px-4 py-2 font-medium text-gray-500">Miles</th>
                      <th className="text-right px-4 py-2 font-medium text-gray-500">Tech</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pastRuns.map((run) => {
                      const mi =
                        run.odometerStart != null && run.odometerEnd != null
                          ? (run.odometerEnd - run.odometerStart).toFixed(1)
                          : null
                      return (
                        <tr key={run.id} className="border-b border-gray-50 last:border-0">
                          <td className="px-4 py-2 text-gray-700">
                            {new Date(run.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                          </td>
                          <td className="px-4 py-2 text-right text-gray-700 font-medium">
                            {mi != null ? `${mi} mi` : "—"}
                          </td>
                          <td className="px-4 py-2 text-right text-gray-400">
                            {run.technician ? `${run.technician.firstName} ${run.technician.lastName[0]}.` : "—"}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </CardBody>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
