import { db } from "@/lib/db"
import { requireSession } from "@/lib/session"
import Link from "next/link"
import { ChevronLeft, MapPin } from "lucide-react"
import Card, { CardBody, CardHeader } from "@/components/ui/Card"
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

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

export default async function RouteRevenueReportPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>
}) {
  const { companyId } = await requireSession()
  const { period = "30d" } = await searchParams
  const periodStart = getPeriodStart(period)

  const [routes, allCustomerIds] = await Promise.all([
    db.route.findMany({
      where: { companyId },
      orderBy: { name: "asc" },
      include: {
        stops: {
          include: {
            customer: {
              include: {
                invoices: {
                  where: { issuedAt: { gte: periodStart } },
                  include: { items: true, payments: true },
                },
              },
            },
          },
        },
      },
    }),
    // Customer IDs on any route — to find unrouted customers
    db.routeStop.findMany({
      where: { route: { companyId } },
      select: { customerId: true },
    }),
  ])

  // Unrouted customers with invoices in period
  const routedIds = new Set(allCustomerIds.map((s) => s.customerId))
  const unroutedInvoices = await db.invoice.findMany({
    where: {
      companyId,
      issuedAt: { gte: periodStart },
      customer: { id: { notIn: [...routedIds] } },
    },
    include: { items: true, payments: true, customer: true },
  })

  function calcStats(invoices: { items: { quantity: number; unitPrice: number }[]; payments: { amount: number }[] }[]) {
    const invoiced  = invoices.reduce((s, inv) => s + inv.items.reduce((x, i) => x + i.quantity * i.unitPrice, 0), 0)
    const collected = invoices.reduce((s, inv) => s + inv.payments.reduce((x, p) => x + p.amount, 0), 0)
    return { invoiced, collected }
  }

  const routeStats = routes.map((route) => {
    const invoices = route.stops.flatMap((s) => s.customer.invoices)
    const { invoiced, collected } = calcStats(invoices)
    return {
      id:            route.id,
      name:          route.name,
      dayOfWeek:     route.dayOfWeek,
      customerCount: route.stops.length,
      invoiceCount:  invoices.length,
      invoiced,
      collected,
    }
  })

  const unrouted = calcStats(unroutedInvoices)
  const grandInvoiced  = routeStats.reduce((s, r) => s + r.invoiced,  0) + unrouted.invoiced
  const grandCollected = routeStats.reduce((s, r) => s + r.collected, 0) + unrouted.collected
  const barMax = Math.max(...routeStats.map((r) => r.invoiced), unrouted.invoiced, 1)

  return (
    <div className="max-w-3xl space-y-5">
      <div>
        <Link href="/reports" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900 mb-3">
          <ChevronLeft className="w-4 h-4" /> Reports
        </Link>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Revenue by Route</h1>
        <p className="text-sm text-gray-500 mt-0.5">Invoiced and collected amounts per service route.</p>
      </div>

      {/* Period tabs */}
      <div className="flex gap-1 flex-wrap">
        {PERIODS.map((p) => (
          <Link
            key={p.key}
            href={`/reports/routes?period=${p.key}`}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              period === p.key ? "bg-sky-600 text-white" : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            {p.label}
          </Link>
        ))}
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="p-4">
          <p className="text-xs text-gray-500 font-medium">Total Invoiced</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(grandInvoiced)}</p>
          <p className="text-xs text-gray-400 mt-0.5">{PERIODS.find((p) => p.key === period)?.label}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-gray-500 font-medium">Total Collected</p>
          <p className="text-2xl font-bold text-green-700 mt-1">{formatCurrency(grandCollected)}</p>
          <p className="text-xs text-gray-400 mt-0.5">
            {grandInvoiced > 0 ? Math.round((grandCollected / grandInvoiced) * 100) : 0}% collection rate
          </p>
        </Card>
      </div>

      {/* Bar chart */}
      <Card>
        <CardHeader><h2 className="font-semibold text-gray-900 text-sm">Revenue by Route</h2></CardHeader>
        <CardBody className="space-y-4">
          {routeStats.length === 0 && unrouted.invoiced === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">No invoices in this period.</p>
          ) : (
            <>
              {routeStats.map((r) => (
                <div key={r.id} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2 min-w-0">
                      <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                      <span className="font-medium text-gray-900 truncate">{r.name}</span>
                      {r.dayOfWeek !== null && (
                        <span className="text-xs text-gray-400 shrink-0">{DAY_LABELS[r.dayOfWeek]}</span>
                      )}
                    </div>
                    <div className="text-right shrink-0 ml-4">
                      <span className="font-semibold text-gray-900">{formatCurrency(r.invoiced)}</span>
                      {r.collected < r.invoiced && (
                        <span className="text-xs text-green-600 ml-2">{formatCurrency(r.collected)} collected</span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <div className="flex-1 bg-gray-100 rounded-full h-3 overflow-hidden">
                      <div
                        className="h-full bg-sky-500 rounded-full"
                        style={{ width: `${(r.invoiced / barMax) * 100}%` }}
                      />
                    </div>
                  </div>
                  <p className="text-xs text-gray-400">
                    {r.customerCount} customer{r.customerCount !== 1 ? "s" : ""} · {r.invoiceCount} invoice{r.invoiceCount !== 1 ? "s" : ""}
                  </p>
                </div>
              ))}

              {/* Unrouted */}
              {unrouted.invoiced > 0 && (
                <div className="space-y-1 pt-2 border-t border-gray-100">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-gray-500">Unrouted customers</span>
                    <div className="text-right">
                      <span className="font-semibold text-gray-700">{formatCurrency(unrouted.invoiced)}</span>
                      {unrouted.collected < unrouted.invoiced && (
                        <span className="text-xs text-green-600 ml-2">{formatCurrency(unrouted.collected)} collected</span>
                      )}
                    </div>
                  </div>
                  <div className="flex-1 bg-gray-100 rounded-full h-3 overflow-hidden">
                    <div
                      className="h-full bg-gray-300 rounded-full"
                      style={{ width: `${(unrouted.invoiced / barMax) * 100}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-400">{unroutedInvoices.length} invoice{unroutedInvoices.length !== 1 ? "s" : ""}</p>
                </div>
              )}
            </>
          )}
        </CardBody>
      </Card>

      {/* Detail table */}
      {routeStats.some((r) => r.invoiceCount > 0) && (
        <Card>
          <CardHeader><h2 className="font-semibold text-gray-900 text-sm">Route Summary</h2></CardHeader>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-xs text-gray-500 uppercase tracking-wide">
                  <th className="px-5 py-3 text-left font-medium">Route</th>
                  <th className="px-5 py-3 text-right font-medium">Customers</th>
                  <th className="px-5 py-3 text-right font-medium">Invoices</th>
                  <th className="px-5 py-3 text-right font-medium">Invoiced</th>
                  <th className="px-5 py-3 text-right font-medium">Collected</th>
                  <th className="px-5 py-3 text-right font-medium">Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {routeStats.filter((r) => r.invoiceCount > 0).map((r) => (
                  <tr key={r.id} className="hover:bg-gray-50">
                    <td className="px-5 py-3 font-medium text-gray-900">
                      {r.name}
                      {r.dayOfWeek !== null && (
                        <span className="ml-2 text-xs text-gray-400">{DAY_LABELS[r.dayOfWeek]}</span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-right text-gray-500">{r.customerCount}</td>
                    <td className="px-5 py-3 text-right text-gray-500">{r.invoiceCount}</td>
                    <td className="px-5 py-3 text-right font-medium text-gray-900">{formatCurrency(r.invoiced)}</td>
                    <td className="px-5 py-3 text-right text-green-700">{formatCurrency(r.collected)}</td>
                    <td className="px-5 py-3 text-right text-gray-500">
                      {r.invoiced > 0 ? `${Math.round((r.collected / r.invoiced) * 100)}%` : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-gray-200 font-semibold">
                  <td className="px-5 py-3 text-gray-700">Total</td>
                  <td className="px-5 py-3 text-right text-gray-700">
                    {routeStats.reduce((s, r) => s + r.customerCount, 0)}
                  </td>
                  <td className="px-5 py-3 text-right text-gray-700">
                    {routeStats.reduce((s, r) => s + r.invoiceCount, 0)}
                  </td>
                  <td className="px-5 py-3 text-right text-gray-900">{formatCurrency(grandInvoiced)}</td>
                  <td className="px-5 py-3 text-right text-green-700">{formatCurrency(grandCollected)}</td>
                  <td className="px-5 py-3 text-right text-gray-500">
                    {grandInvoiced > 0 ? `${Math.round((grandCollected / grandInvoiced) * 100)}%` : "—"}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </Card>
      )}
    </div>
  )
}
