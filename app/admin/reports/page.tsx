import { db } from "@/lib/db"
import Card from "@/components/ui/Card"
import { formatCurrency } from "@/lib/utils"

export const dynamic = "force-dynamic"

function getStartDate(period: string | undefined): Date | undefined {
  const now = new Date()
  if (period === "30d") return new Date(now.getFullYear(), now.getMonth(), now.getDate() - 30)
  if (period === "90d") return new Date(now.getFullYear(), now.getMonth(), now.getDate() - 90)
  if (period === "ytd") return new Date(now.getFullYear(), 0, 1)
  return undefined
}

function itemTotal(items: { quantity: number; unitPrice: number }[]) {
  return items.reduce((s, i) => s + i.quantity * i.unitPrice, 0)
}
function pymtTotal(payments: { amount: number }[]) {
  return payments.reduce((s, p) => s + p.amount, 0)
}

function getMonthlyRevenue(invoices: { status: string; paidAt: Date | null; createdAt: Date; items: { quantity: number; unitPrice: number }[] }[]) {
  const now = new Date()
  const months: { key: string; label: string; value: number }[] = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    months.push({
      key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
      label: d.toLocaleString("default", { month: "short", year: "2-digit" }),
      value: 0,
    })
  }
  for (const inv of invoices) {
    if (inv.status !== "paid") continue
    const d = new Date(inv.paidAt ?? inv.createdAt)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
    const bucket = months.find((m) => m.key === key)
    if (bucket) bucket.value += itemTotal(inv.items)
  }
  return months
}

const PERIOD_LABELS: Record<string, string> = {
  "30d": "Last 30 days",
  "90d": "Last 90 days",
  ytd: "Year to date",
  all: "All time",
}

export default async function AdminReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ company?: string; period?: string }>
}) {
  const { company: selectedId, period = "30d" } = await searchParams
  const startDate = getStartDate(period)

  const allCompanies = await db.company.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  })

  const companyWhere = selectedId && selectedId !== "all" ? { companyId: selectedId } : {}
  const dateWhere = startDate ? { createdAt: { gte: startDate } } : {}
  const visitDateWhere = startDate ? { visitedAt: { gte: startDate } } : {}
  const visitCompanyWhere = selectedId && selectedId !== "all" ? { customer: { companyId: selectedId } } : {}

  const [
    activeCustomers,
    totalCustomers,
    invoices,
    completedVisits,
    skippedVisits,
    totalVisits,
  ] = await Promise.all([
    db.customer.count({ where: { ...companyWhere, status: "active" } }),
    db.customer.count({ where: { ...companyWhere } }),
    db.invoice.findMany({
      where: { ...companyWhere, ...dateWhere },
      include: { items: true, payments: true },
    }),
    db.serviceVisit.count({ where: { ...visitCompanyWhere, ...visitDateWhere, status: "completed" } }),
    db.serviceVisit.count({ where: { ...visitCompanyWhere, ...visitDateWhere, status: "skipped" } }),
    db.serviceVisit.count({ where: { ...visitCompanyWhere, ...visitDateWhere } }),
  ])

  const byStatus = {
    draft: invoices.filter((i) => i.status === "draft"),
    sent: invoices.filter((i) => i.status === "sent"),
    overdue: invoices.filter((i) => i.status === "overdue"),
    paid: invoices.filter((i) => i.status === "paid"),
    cancelled: invoices.filter((i) => i.status === "cancelled"),
  }

  const revenue = byStatus.paid.reduce((s, inv) => s + itemTotal(inv.items), 0)
  const outstanding = byStatus.sent.reduce((s, inv) => s + Math.max(0, itemTotal(inv.items) - pymtTotal(inv.payments)), 0)
  const overdueAmt = byStatus.overdue.reduce((s, inv) => s + Math.max(0, itemTotal(inv.items) - pymtTotal(inv.payments)), 0)
  const collected = invoices.reduce((s, inv) => s + pymtTotal(inv.payments), 0)

  const monthly = getMonthlyRevenue(invoices)
  const maxMonthly = Math.max(...monthly.map((m) => m.value), 1)

  const selectedName = selectedId && selectedId !== "all"
    ? allCompanies.find((c) => c.id === selectedId)?.name ?? "Unknown"
    : "All Companies"

  const selectCls = "text-sm text-gray-900 border border-gray-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white"

  return (
    <div className="space-y-5 sm:space-y-6">
      <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Reports</h1>

      {/* Filters */}
      <form method="GET" className="flex flex-col sm:flex-row gap-2 sm:gap-3">
        <select name="company" defaultValue={selectedId || "all"} className={`${selectCls} flex-1 sm:flex-none sm:w-56`}>
          <option value="all">All Companies</option>
          {allCompanies.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <select name="period" defaultValue={period} className={`${selectCls} flex-1 sm:flex-none`}>
          <option value="30d">Last 30 days</option>
          <option value="90d">Last 90 days</option>
          <option value="ytd">Year to date</option>
          <option value="all">All time</option>
        </select>
        <button
          type="submit"
          className="px-5 py-2.5 text-sm font-medium text-white bg-sky-600 rounded-lg hover:bg-sky-700 transition-colors"
        >
          Apply
        </button>
      </form>

      <p className="text-sm text-gray-500">
        <span className="font-medium text-gray-700">{selectedName}</span>
        {" · "}
        {PERIOD_LABELS[period] ?? "All time"}
      </p>

      {/* Revenue metric cards */}
      <div>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Revenue</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {[
            { label: "Collected", value: formatCurrency(revenue), sub: `${byStatus.paid.length} paid invoices`, color: "text-green-600", bg: "bg-green-50" },
            { label: "Outstanding", value: formatCurrency(outstanding), sub: `${byStatus.sent.length} sent invoices`, color: "text-sky-600", bg: "bg-sky-50" },
            { label: "Overdue", value: formatCurrency(overdueAmt), sub: `${byStatus.overdue.length} overdue invoices`, color: "text-red-600", bg: "bg-red-50" },
            { label: "Total Billed", value: formatCurrency(revenue + outstanding + overdueAmt), sub: `${invoices.length} invoices total`, color: "text-indigo-600", bg: "bg-indigo-50" },
          ].map(({ label, value, sub, color, bg }) => (
            <Card key={label} className="p-3 sm:p-4">
              <p className="text-xs text-gray-500 font-medium">{label}</p>
              <p className={`text-lg sm:text-2xl font-bold mt-1 ${color}`}>{value}</p>
              <p className="text-xs text-gray-400 mt-1">{sub}</p>
            </Card>
          ))}
        </div>
      </div>

      {/* Customers + Visits */}
      <div className="grid sm:grid-cols-2 gap-4 sm:gap-6">
        <div>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Customers</h2>
          <Card className="divide-y divide-gray-50">
            {[
              { label: "Active", value: activeCustomers, color: "text-green-600" },
              { label: "Total", value: totalCustomers, color: "text-gray-900" },
              { label: "Inactive", value: totalCustomers - activeCustomers, color: "text-gray-400" },
            ].map(({ label, value, color }) => (
              <div key={label} className="flex items-center justify-between px-4 sm:px-5 py-3">
                <span className="text-sm text-gray-600">{label}</span>
                <span className={`text-sm font-semibold ${color}`}>{value}</span>
              </div>
            ))}
          </Card>
        </div>

        <div>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Service Visits</h2>
          <Card className="divide-y divide-gray-50">
            {[
              { label: "Completed", value: completedVisits, color: "text-green-600" },
              { label: "Skipped", value: skippedVisits, color: "text-red-500" },
              { label: "Total", value: totalVisits, color: "text-gray-900" },
            ].map(({ label, value, color }) => (
              <div key={label} className="flex items-center justify-between px-4 sm:px-5 py-3">
                <span className="text-sm text-gray-600">{label}</span>
                <span className={`text-sm font-semibold ${color}`}>{value}</span>
              </div>
            ))}
          </Card>
        </div>
      </div>

      {/* Invoice breakdown */}
      <div>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Invoice Breakdown</h2>
        <Card className="divide-y divide-gray-50">
          {(["paid", "sent", "overdue", "draft", "cancelled"] as const).map((status) => {
            const group = byStatus[status]
            const total = group.reduce((s, inv) => s + itemTotal(inv.items), 0)
            const statusColors: Record<string, string> = {
              paid: "bg-green-100 text-green-800",
              sent: "bg-sky-100 text-sky-800",
              overdue: "bg-red-100 text-red-800",
              draft: "bg-gray-100 text-gray-700",
              cancelled: "bg-gray-100 text-gray-400",
            }
            return (
              <div key={status} className="flex items-center justify-between px-4 sm:px-5 py-3">
                <div className="flex items-center gap-3">
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium capitalize ${statusColors[status]}`}>
                    {status}
                  </span>
                  <span className="text-sm text-gray-500">{group.length} invoices</span>
                </div>
                <span className="text-sm font-semibold text-gray-900">{formatCurrency(total)}</span>
              </div>
            )
          })}
        </Card>
      </div>

      {/* Monthly revenue bar chart */}
      <div>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Monthly Revenue (Paid)</h2>
        <Card className="p-4 sm:p-5">
          {monthly.every((m) => m.value === 0) ? (
            <p className="text-sm text-gray-400 text-center py-6">No paid invoices in this period.</p>
          ) : (
            <div className="space-y-3">
              {monthly.map((m) => (
                <div key={m.key} className="flex items-center gap-3">
                  <span className="text-xs text-gray-500 w-12 shrink-0">{m.label}</span>
                  <div className="flex-1 bg-gray-100 rounded-full h-5 overflow-hidden">
                    <div
                      className="bg-sky-500 h-full rounded-full transition-all"
                      style={{ width: `${Math.round((m.value / maxMonthly) * 100)}%` }}
                    />
                  </div>
                  <span className="text-xs font-medium text-gray-700 w-20 text-right shrink-0">
                    {m.value > 0 ? formatCurrency(m.value) : "—"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
