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

export const dynamic = "force-dynamic"

export default async function RouteDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { companyId } = await requireSession()
  const { id } = await params

  const [route, allCustomers, companyUsers, company] = await Promise.all([
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
  ])

  if (!route) notFound()

  const defaultStart =
    route.assignedUser?.defaultStartAddress ||
    (company?.address ? `${company.address}, ${company.city}, ${company.state} ${company.zip}` : "")

  const deleteAction = deleteRoute.bind(null, id)
  const updateAction = updateRoute.bind(null, id)

  const stopCustomerIds = new Set(route.stops.map((s) => s.customerId))
  const availableCustomers = allCustomers.filter((c) => !stopCustomerIds.has(c.id))

  // Geocode all stops server-side so the map component just places markers
  const markers = await Promise.all(
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
  )

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

          <RouteMap markers={markers} />
        </div>

        {/* Sidebar */}
        <div className="space-y-5">
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
        </div>
      </div>
    </div>
  )
}
