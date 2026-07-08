import { db } from "@/lib/db"
import { requireSession } from "@/lib/session"
import Card, { CardBody, CardHeader } from "@/components/ui/Card"
import { createVehicle, updateVehicle, toggleVehicleActive } from "@/lib/actions/vehicles"
import { Truck, PlusCircle, ToggleLeft, ToggleRight } from "lucide-react"
import Button from "@/components/ui/Button"

export const dynamic = "force-dynamic"

export default async function VehiclesPage() {
  const { companyId } = await requireSession()

  const vehicles = await db.vehicle.findMany({
    where: { companyId },
    orderBy: [{ isActive: "desc" }, { name: "asc" }],
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Fleet / Vehicles</h1>
        <p className="text-sm text-gray-500 mt-0.5">Track vehicles for mileage reporting and fuel expense allocation</p>
      </div>

      {/* Existing vehicles */}
      {vehicles.length > 0 && (
        <div className="space-y-3">
          {vehicles.map((v) => {
            const toggleAction = toggleVehicleActive.bind(null, v.id)
            const updateAction = updateVehicle.bind(null, v.id)
            return (
              <Card key={v.id} className={v.isActive ? "" : "opacity-60"}>
                <CardHeader className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Truck className="w-4 h-4 text-gray-400 shrink-0" />
                    <span className="font-semibold text-gray-900 text-sm">{v.name}</span>
                    {!v.isActive && (
                      <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">Inactive</span>
                    )}
                  </div>
                  <form action={toggleAction}>
                    <button type="submit" className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-800 transition-colors">
                      {v.isActive
                        ? <ToggleRight className="w-4 h-4 text-sky-500" />
                        : <ToggleLeft className="w-4 h-4 text-gray-400" />
                      }
                      {v.isActive ? "Active" : "Inactive"}
                    </button>
                  </form>
                </CardHeader>
                <CardBody>
                  <form action={updateAction} className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <div className="col-span-2 sm:col-span-3">
                      <label className="block text-xs font-medium text-gray-600 mb-1">Name / Label *</label>
                      <input name="name" required defaultValue={v.name}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Make</label>
                      <input name="make" defaultValue={v.make ?? ""}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Model</label>
                      <input name="model" defaultValue={v.model ?? ""}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Year</label>
                      <input name="year" type="number" min="1990" max="2030" defaultValue={v.year ?? ""}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">License Plate</label>
                      <input name="licensePlate" defaultValue={v.licensePlate ?? ""}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500" />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-xs font-medium text-gray-600 mb-1">Notes</label>
                      <input name="notes" defaultValue={v.notes ?? ""}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500" />
                    </div>
                    <div className="col-span-2 sm:col-span-3 flex justify-end">
                      <Button type="submit" size="sm">Save</Button>
                    </div>
                  </form>
                </CardBody>
              </Card>
            )
          })}
        </div>
      )}

      {/* Add vehicle */}
      <Card>
        <CardHeader>
          <h2 className="font-semibold text-gray-900 text-sm flex items-center gap-2">
            <PlusCircle className="w-4 h-4 text-sky-500" />
            Add Vehicle
          </h2>
        </CardHeader>
        <CardBody>
          <form action={createVehicle} className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="col-span-2 sm:col-span-3">
              <label className="block text-xs font-medium text-gray-600 mb-1">Name / Label *</label>
              <input name="name" required placeholder="e.g. Truck 1 - F-150"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Make</label>
              <input name="make" placeholder="Ford"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Model</label>
              <input name="model" placeholder="F-150"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Year</label>
              <input name="year" type="number" min="1990" max="2030" placeholder={String(new Date().getFullYear())}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">License Plate</label>
              <input name="licensePlate" placeholder="ABC-1234"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500" />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-600 mb-1">Notes</label>
              <input name="notes" placeholder="Optional notes"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500" />
            </div>
            <div className="col-span-2 sm:col-span-3 flex justify-end">
              <Button type="submit" size="sm">Add Vehicle</Button>
            </div>
          </form>
        </CardBody>
      </Card>
    </div>
  )
}
