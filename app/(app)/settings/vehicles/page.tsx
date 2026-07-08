import { db } from "@/lib/db"
import { requireSession } from "@/lib/session"
import Card, { CardBody, CardHeader } from "@/components/ui/Card"
import { createVehicle, updateVehicle, toggleVehicleActive } from "@/lib/actions/vehicles"
import { Truck, PlusCircle, ToggleLeft, ToggleRight } from "lucide-react"
import VehicleForm from "@/components/settings/VehicleForm"

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
                    {v.year || v.make || v.model
                      ? <span className="text-xs text-gray-500">{[v.year, v.make, v.model].filter(Boolean).join(" ")}</span>
                      : null
                    }
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
                  <VehicleForm
                    action={updateAction}
                    defaults={{
                      name: v.name,
                      make: v.make,
                      model: v.model,
                      year: v.year,
                      licensePlate: v.licensePlate,
                      initialMileage: v.initialMileage,
                      notes: v.notes,
                    }}
                    submitLabel="Save"
                  />
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
          <VehicleForm action={createVehicle} submitLabel="Add Vehicle" />
        </CardBody>
      </Card>
    </div>
  )
}
