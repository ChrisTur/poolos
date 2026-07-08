import { db } from "@/lib/db"
import { requireSession } from "@/lib/session"
import { formatCurrency } from "@/lib/utils"
import Card, { CardHeader, CardBody } from "@/components/ui/Card"
import { Truck, User, Gauge, DollarSign } from "lucide-react"
import DateRangePicker from "@/components/ui/DateRangePicker"
import { Suspense } from "react"

export const dynamic = "force-dynamic"

function parseDateRange(searchParams: { from?: string; to?: string; period?: string }) {
  if (searchParams.from && searchParams.to) {
    const from = new Date(searchParams.from)
    from.setHours(0, 0, 0, 0)
    const to = new Date(searchParams.to)
    to.setHours(23, 59, 59, 999)
    return { from, to }
  }
  const period = searchParams.period ?? "30d"
  const now = new Date()
  let from: Date
  if (period === "7d")  from = new Date(now.getTime() - 7  * 86400000)
  else if (period === "90d") from = new Date(now.getTime() - 90 * 86400000)
  else if (period === "ytd") from = new Date(now.getFullYear(), 0, 1)
  else if (period === "all") from = new Date(0)
  else                       from = new Date(now.getTime() - 30 * 86400000)
  const to = new Date()
  to.setHours(23, 59, 59, 999)
  return { from, to }
}

export default async function MileageReportPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string; period?: string }>
}) {
  const { companyId } = await requireSession()
  const params = await searchParams
  const { from, to } = parseDateRange(params)

  const [runs, fuelExpenses] = await Promise.all([
    db.routeRun.findMany({
      where: {
        companyId,
        completedAt: { not: null },
        date: { gte: from, lte: to },
      },
      include: {
        route:      { select: { name: true } },
        technician: { select: { firstName: true, lastName: true } },
        vehicle:    { select: { name: true, make: true, model: true, year: true } },
      },
      orderBy: { date: "desc" },
    }),
    db.expense.findMany({
      where: {
        companyId,
        category: "fuel",
        date: { gte: from, lte: to },
      },
      include: {
        routeRun: {
          include: {
            route:      { select: { name: true } },
            technician: { select: { firstName: true, lastName: true } },
            vehicle:    { select: { name: true } },
          },
        },
      },
      orderBy: { date: "desc" },
    }),
  ])

  // ── Summary calculations ────────────────────────────────────────────────────
  const runsWithMiles = runs.filter((r) => r.odometerStart != null && r.odometerEnd != null)
  const totalMiles    = runsWithMiles.reduce((s, r) => s + (r.odometerEnd! - r.odometerStart!), 0)
  const totalFuel     = fuelExpenses.reduce((s, e) => s + e.amount, 0)
  const costPerMile   = totalMiles > 0 && totalFuel > 0 ? totalFuel / totalMiles : null

  // By technician
  const byTech = new Map<string, { name: string; miles: number; runs: number; fuel: number }>()
  for (const run of runs) {
    const key  = run.technicianId ?? "unassigned"
    const name = run.technician ? `${run.technician.firstName} ${run.technician.lastName}` : "Unassigned"
    const mi   = run.odometerStart != null && run.odometerEnd != null ? run.odometerEnd - run.odometerStart : 0
    const prev = byTech.get(key) ?? { name, miles: 0, runs: 0, fuel: 0 }
    byTech.set(key, { ...prev, miles: prev.miles + mi, runs: prev.runs + 1 })
  }
  for (const exp of fuelExpenses) {
    if (!exp.routeRun?.technicianId) continue
    const key  = exp.routeRun.technicianId
    const prev = byTech.get(key)
    if (prev) byTech.set(key, { ...prev, fuel: prev.fuel + exp.amount })
  }
  const techRows = [...byTech.values()].sort((a, b) => b.miles - a.miles)

  // By vehicle
  const byVehicle = new Map<string, { name: string; miles: number; runs: number; fuel: number }>()
  for (const run of runs) {
    const key  = run.vehicleId ?? "none"
    const name = run.vehicle
      ? `${run.vehicle.year ? run.vehicle.year + " " : ""}${run.vehicle.make ? run.vehicle.make + " " : ""}${run.vehicle.name}`
      : "No vehicle"
    const mi   = run.odometerStart != null && run.odometerEnd != null ? run.odometerEnd - run.odometerStart : 0
    const prev = byVehicle.get(key) ?? { name, miles: 0, runs: 0, fuel: 0 }
    byVehicle.set(key, { ...prev, miles: prev.miles + mi, runs: prev.runs + 1 })
  }
  for (const exp of fuelExpenses) {
    if (!exp.routeRun?.vehicleId) continue
    const key  = exp.routeRun.vehicleId
    const prev = byVehicle.get(key)
    if (prev) byVehicle.set(key, { ...prev, fuel: prev.fuel + exp.amount })
  }
  const vehicleRows = [...byVehicle.values()].sort((a, b) => b.miles - a.miles)

  function fmtMi(n: number) { return n.toFixed(1) + " mi" }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Mileage Report</h1>
          <p className="text-sm text-gray-500 mt-0.5">Route runs by tech and vehicle with fuel costs</p>
        </div>
      </div>

      {/* Date picker */}
      <Suspense>
        <DateRangePicker />
      </Suspense>

      {/* Summary KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total Miles", value: fmtMi(totalMiles), icon: Gauge, color: "text-sky-600" },
          { label: "Route Runs",  value: String(runs.length), icon: Truck, color: "text-indigo-600" },
          { label: "Fuel Cost",   value: formatCurrency(totalFuel), icon: DollarSign, color: "text-amber-600" },
          { label: "Cost / Mile", value: costPerMile ? `$${costPerMile.toFixed(2)}` : "—", icon: DollarSign, color: "text-green-600" },
        ].map(({ label, value, icon: Icon, color }) => (
          <Card key={label}>
            <CardBody className="flex items-center gap-3 py-4">
              <div className={`${color} shrink-0`}><Icon className="w-5 h-5" /></div>
              <div>
                <p className="text-lg font-bold text-gray-900">{value}</p>
                <p className="text-xs text-gray-500">{label}</p>
              </div>
            </CardBody>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* By technician */}
        <Card>
          <CardHeader>
            <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
              <User className="w-4 h-4 text-gray-400" />
              By Technician
            </h2>
          </CardHeader>
          <CardBody className="p-0">
            {techRows.length === 0 ? (
              <p className="text-sm text-gray-400 px-4 py-4">No completed runs in this period</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 text-xs font-medium text-gray-500">
                    <th className="text-left px-4 py-2">Technician</th>
                    <th className="text-right px-4 py-2">Runs</th>
                    <th className="text-right px-4 py-2">Miles</th>
                    <th className="text-right px-4 py-2">Fuel</th>
                  </tr>
                </thead>
                <tbody>
                  {techRows.map((row) => (
                    <tr key={row.name} className="border-b border-gray-50 last:border-0">
                      <td className="px-4 py-2.5 font-medium text-gray-800">{row.name}</td>
                      <td className="px-4 py-2.5 text-right text-gray-500">{row.runs}</td>
                      <td className="px-4 py-2.5 text-right font-semibold text-gray-900">{fmtMi(row.miles)}</td>
                      <td className="px-4 py-2.5 text-right text-amber-700">{row.fuel > 0 ? formatCurrency(row.fuel) : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardBody>
        </Card>

        {/* By vehicle */}
        <Card>
          <CardHeader>
            <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
              <Truck className="w-4 h-4 text-gray-400" />
              By Vehicle
            </h2>
          </CardHeader>
          <CardBody className="p-0">
            {vehicleRows.length === 0 ? (
              <p className="text-sm text-gray-400 px-4 py-4">No completed runs in this period</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 text-xs font-medium text-gray-500">
                    <th className="text-left px-4 py-2">Vehicle</th>
                    <th className="text-right px-4 py-2">Runs</th>
                    <th className="text-right px-4 py-2">Miles</th>
                    <th className="text-right px-4 py-2">Fuel</th>
                  </tr>
                </thead>
                <tbody>
                  {vehicleRows.map((row) => (
                    <tr key={row.name} className="border-b border-gray-50 last:border-0">
                      <td className="px-4 py-2.5 font-medium text-gray-800">{row.name}</td>
                      <td className="px-4 py-2.5 text-right text-gray-500">{row.runs}</td>
                      <td className="px-4 py-2.5 text-right font-semibold text-gray-900">{fmtMi(row.miles)}</td>
                      <td className="px-4 py-2.5 text-right text-amber-700">{row.fuel > 0 ? formatCurrency(row.fuel) : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardBody>
        </Card>
      </div>

      {/* Run detail table */}
      <Card>
        <CardHeader>
          <h2 className="text-sm font-semibold text-gray-900">Run Details</h2>
        </CardHeader>
        <CardBody className="p-0 overflow-x-auto">
          {runs.length === 0 ? (
            <p className="text-sm text-gray-400 px-4 py-4">No completed runs in this period</p>
          ) : (
            <table className="w-full text-sm whitespace-nowrap">
              <thead>
                <tr className="border-b border-gray-100 text-xs font-medium text-gray-500">
                  <th className="text-left px-4 py-2">Date</th>
                  <th className="text-left px-4 py-2">Route</th>
                  <th className="text-left px-4 py-2">Tech</th>
                  <th className="text-left px-4 py-2">Vehicle</th>
                  <th className="text-right px-4 py-2">Start</th>
                  <th className="text-right px-4 py-2">End</th>
                  <th className="text-right px-4 py-2">Miles</th>
                  <th className="text-right px-4 py-2">Fuel $</th>
                </tr>
              </thead>
              <tbody>
                {runs.map((run) => {
                  const mi = run.odometerStart != null && run.odometerEnd != null
                    ? (run.odometerEnd - run.odometerStart).toFixed(1)
                    : null
                  const fuel = fuelExpenses
                    .filter((e) => e.routeRunId === run.id)
                    .reduce((s, e) => s + e.amount, 0)
                  return (
                    <tr key={run.id} className="border-b border-gray-50 last:border-0">
                      <td className="px-4 py-2.5 text-gray-700">
                        {new Date(run.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </td>
                      <td className="px-4 py-2.5 text-gray-800 font-medium">{run.route.name}</td>
                      <td className="px-4 py-2.5 text-gray-600">
                        {run.technician ? `${run.technician.firstName} ${run.technician.lastName}` : "—"}
                      </td>
                      <td className="px-4 py-2.5 text-gray-600">{run.vehicle?.name ?? "—"}</td>
                      <td className="px-4 py-2.5 text-right text-gray-500">
                        {run.odometerStart != null ? run.odometerStart.toLocaleString() : "—"}
                      </td>
                      <td className="px-4 py-2.5 text-right text-gray-500">
                        {run.odometerEnd != null ? run.odometerEnd.toLocaleString() : "—"}
                      </td>
                      <td className="px-4 py-2.5 text-right font-semibold text-gray-900">
                        {mi != null ? `${mi} mi` : "—"}
                      </td>
                      <td className="px-4 py-2.5 text-right text-amber-700">
                        {fuel > 0 ? formatCurrency(fuel) : "—"}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </CardBody>
      </Card>

      {/* Fuel expenses detail */}
      {fuelExpenses.length > 0 && (
        <Card>
          <CardHeader>
            <h2 className="text-sm font-semibold text-gray-900">Fuel Expenses</h2>
          </CardHeader>
          <CardBody className="p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-xs font-medium text-gray-500">
                  <th className="text-left px-4 py-2">Date</th>
                  <th className="text-left px-4 py-2">Description</th>
                  <th className="text-left px-4 py-2">Route / Tech</th>
                  <th className="text-left px-4 py-2">Vehicle</th>
                  <th className="text-left px-4 py-2">Vendor</th>
                  <th className="text-right px-4 py-2">Amount</th>
                </tr>
              </thead>
              <tbody>
                {fuelExpenses.map((e) => (
                  <tr key={e.id} className="border-b border-gray-50 last:border-0">
                    <td className="px-4 py-2.5 text-gray-700">
                      {new Date(e.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </td>
                    <td className="px-4 py-2.5 text-gray-800">{e.description}</td>
                    <td className="px-4 py-2.5 text-gray-600 text-xs">
                      {e.routeRun
                        ? `${e.routeRun.route.name}${e.routeRun.technician ? ` · ${e.routeRun.technician.firstName} ${e.routeRun.technician.lastName}` : ""}`
                        : "—"}
                    </td>
                    <td className="px-4 py-2.5 text-gray-600 text-xs">{e.routeRun?.vehicle?.name ?? "—"}</td>
                    <td className="px-4 py-2.5 text-gray-500">{e.vendor ?? "—"}</td>
                    <td className="px-4 py-2.5 text-right font-semibold text-amber-700">{formatCurrency(e.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardBody>
        </Card>
      )}
    </div>
  )
}
