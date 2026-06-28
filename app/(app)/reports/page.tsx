import { db } from "@/lib/db"
import { requireSession } from "@/lib/session"
import Link from "next/link"
import { formatCurrency, formatDate } from "@/lib/utils"
import Card, { CardHeader, CardBody } from "@/components/ui/Card"
import { statusBadge } from "@/components/ui/Badge"
import { DollarSign, Users, CalendarDays, TrendingUp, AlertTriangle, Clock, MapPin, Users2, ChevronRight } from "lucide-react"
import { visitNeedsAttention } from "@/lib/chemistry"
import PaymentDonut, { type PaymentSlice } from "@/components/reports/PaymentDonut"
import ChemicalHealthTable from "@/components/reports/ChemicalHealthTable"

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

function monthKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
}
function monthLabel(key: string) {
  const [y, m] = key.split("-")
  return new Date(parseInt(y), parseInt(m) - 1).toLocaleDateString("en-US", { month: "short", year: "2-digit" })
}

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>
}) {
  const { companyId } = await requireSession()
  const { period = "30d" } = await searchParams
  const periodStart = getPeriodStart(period)

  const [
    periodPayments,
    openInvoices,
    allPeriodInvoices,
    activeCustomers,
    newCustomers,
    visitsInPeriod,
    mrrResult,
    monthlyPaymentsRaw,
    periodExpenses,
    customersWithChemistry,
    chemicalByProduct,
    chemicalTotalAgg,
  ] = await Promise.all([
    // Payments received in period (revenue collected)
    db.payment.findMany({
      where: { invoice: { companyId }, createdAt: { gte: periodStart } },
    }),
    // All open invoices for outstanding/overdue balance
    db.invoice.findMany({
      where: { companyId, status: { in: ["sent", "overdue"] } },
      include: { items: true, payments: true },
    }),
    // Invoices created in period for breakdown table
    db.invoice.findMany({
      where: { companyId, createdAt: { gte: periodStart } },
      include: { items: true, payments: true },
    }),
    db.customer.count({ where: { companyId, status: "active" } }),
    db.customer.count({ where: { companyId, createdAt: { gte: periodStart } } }),
    db.serviceVisit.findMany({
      where: { customer: { companyId }, visitedAt: { gte: periodStart } },
      select: { status: true },
    }),
    db.customer.aggregate({
      where: { companyId, status: "active", monthlyRate: { not: null, gt: 0 } },
      _sum: { monthlyRate: true },
    }),
    // Payments from last 7 months for the chart
    db.payment.findMany({
      where: {
        invoice: { companyId },
        createdAt: { gte: new Date(new Date().setMonth(new Date().getMonth() - 6)) },
      },
    }),
    // Expenses in period
    db.expense.findMany({
      where: { companyId, date: { gte: periodStart } },
      select: { category: true, amount: true },
    }),
    // Customers with their latest chemical reading
    db.customer.findMany({
      where: { companyId, status: "active" },
      include: {
        serviceVisits: {
          where: {
            OR: [
              { chlorine: { not: null } },
              { ph: { not: null } },
              { alkalinity: { not: null } },
              { calcium: { not: null } },
            ],
          },
          orderBy: { visitedAt: "desc" },
          take: 1,
        },
      },
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    }),
    // Chemical usage cost by product in period
    db.chemicalUsage.groupBy({
      by: ["productName"],
      where: { companyId, createdAt: { gte: periodStart } },
      _sum: { totalCost: true, quantity: true },
      orderBy: { _sum: { totalCost: "desc" } },
      take: 10,
    }),
    // Total chemical spend in period
    db.chemicalUsage.aggregate({
      where: { companyId, createdAt: { gte: periodStart } },
      _sum: { totalCost: true },
    }),
  ])

  // ── Business metrics ────────────────────────────────────────────────────────
  const collected          = periodPayments.reduce((s, p) => s + p.amount, 0)
  const totalExpenses      = periodExpenses.reduce((s, e) => s + e.amount, 0)
  const netProfit          = collected - totalExpenses
  const totalChemicalSpend = chemicalTotalAgg._sum.totalCost ?? 0
  const chemMaxCost        = Math.max(...chemicalByProduct.map((r) => r._sum.totalCost ?? 0), 1)

  const expenseByCategory = new Map<string, number>()
  for (const e of periodExpenses) {
    expenseByCategory.set(e.category, (expenseByCategory.get(e.category) ?? 0) + e.amount)
  }
  const EXPENSE_CAT_LABELS: Record<string, string> = {
    chemicals: "Chemicals", equipment: "Equipment", labor: "Labor",
    fuel: "Fuel", supplies: "Supplies", office: "Office", other: "Other",
  }
  const mrr = mrrResult._sum.monthlyRate ?? 0

  const outstanding = openInvoices
    .filter((i) => i.status === "sent")
    .reduce((s, inv) => {
      const t = inv.items.reduce((x, item) => x + item.quantity * item.unitPrice, 0)
      const p = inv.payments.reduce((x, p) => x + p.amount, 0)
      return s + Math.max(0, t - p)
    }, 0)

  const overdue = openInvoices
    .filter((i) => i.status === "overdue")
    .reduce((s, inv) => {
      const t = inv.items.reduce((x, item) => x + item.quantity * item.unitPrice, 0)
      const p = inv.payments.reduce((x, p) => x + p.amount, 0)
      return s + Math.max(0, t - p)
    }, 0)

  const completedVisits = visitsInPeriod.filter((v) => v.status === "completed").length

  // ── Service type breakdown ──────────────────────────────────────────────────
  const SERVICE_TYPE_LABELS: Record<string, string> = {
    monthly:      "Monthly Pool Service",
    repair:       "Repair / Service Work",
    equipment:    "Equipment / Parts",
    chemical:     "Chemical Treatment",
    installation: "Installation",
    other:        "Other",
    untagged:     "Untagged",
  }
  const serviceTypeTotals = new Map<string, number>()
  for (const inv of allPeriodInvoices) {
    const key = inv.serviceType ?? "untagged"
    const amount = inv.items.reduce((s, i) => s + i.quantity * i.unitPrice, 0)
    serviceTypeTotals.set(key, (serviceTypeTotals.get(key) ?? 0) + amount)
  }
  const serviceTypeData = [...serviceTypeTotals.entries()]
    .map(([type, amount]) => ({ type, amount, label: SERVICE_TYPE_LABELS[type] ?? type }))
    .sort((a, b) => b.amount - a.amount)
  const serviceTypeMax = Math.max(...serviceTypeData.map((d) => d.amount), 1)

  // ── Invoice breakdown ───────────────────────────────────────────────────────
  const breakdown = ["draft", "sent", "overdue", "paid", "cancelled"].map((status) => {
    const group = allPeriodInvoices.filter((i) => i.status === status)
    const amount = group.reduce((s, inv) => {
      return s + inv.items.reduce((x, item) => x + item.quantity * item.unitPrice, 0)
    }, 0)
    return { status, count: group.length, amount }
  })

  // ── Payment method breakdown ────────────────────────────────────────────────
  const methodTotals = new Map<string, number>()
  for (const p of periodPayments) {
    const key = p.method ?? "unknown"
    methodTotals.set(key, (methodTotals.get(key) ?? 0) + p.amount)
  }
  const paymentSlices: PaymentSlice[] = [...methodTotals.entries()]
    .map(([method, amount]) => ({
      method,
      amount,
      percent: collected > 0 ? (amount / collected) * 100 : 0,
    }))
    .sort((a, b) => b.amount - a.amount)

  // ── Monthly revenue chart (last 6 months) ──────────────────────────────────
  const now = new Date()
  const chartMonths = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1)
    return monthKey(d)
  })
  const monthlyRevenue = new Map<string, number>()
  for (const p of monthlyPaymentsRaw) {
    const k = monthKey(new Date(p.createdAt))
    monthlyRevenue.set(k, (monthlyRevenue.get(k) ?? 0) + p.amount)
  }
  const chartData = chartMonths.map((k) => ({ key: k, label: monthLabel(k), amount: monthlyRevenue.get(k) ?? 0 }))
  const chartMax = Math.max(...chartData.map((d) => d.amount), 1)

  // ── Chemical health ─────────────────────────────────────────────────────────
  const chemKeys = ["chlorine", "ph", "alkalinity", "calcium"] as const
  const chemCustomers = customersWithChemistry.map((c) => {
    const v = c.serviceVisits[0] ?? null
    return { customer: c, visit: v }
  })
  const withReadings  = chemCustomers.filter((x) => x.visit)
  const noReadings    = chemCustomers.filter((x) => !x.visit)
  const needsAttention = withReadings.filter(({ visit: v }) =>
    v && visitNeedsAttention({ chlorine: v.chlorine, ph: v.ph, alkalinity: v.alkalinity, calcium: v.calcium })
  )

  return (
    <div className="space-y-6">
      {/* Header + period tabs */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Reports</h1>
        <div className="flex gap-1 mt-3 flex-wrap">
          {PERIODS.map((p) => (
            <Link
              key={p.key}
              href={`/reports?period=${p.key}`}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                period === p.key ? "bg-sky-600 text-white" : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              {p.label}
            </Link>
          ))}
        </div>
      </div>

      {/* ── Business overview ── */}
      <section>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Business Overview</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: "Collected", value: formatCurrency(collected), icon: DollarSign, color: "text-green-600", bg: "bg-green-50", sub: PERIODS.find(p => p.key === period)?.label },
            { label: "Outstanding", value: formatCurrency(outstanding), icon: TrendingUp, color: "text-sky-600", bg: "bg-sky-50", sub: "sent invoices" },
            { label: "Overdue", value: formatCurrency(overdue), icon: AlertTriangle, color: "text-red-600", bg: "bg-red-50", sub: "past due" },
            { label: "MRR", value: formatCurrency(mrr), icon: DollarSign, color: "text-indigo-600", bg: "bg-indigo-50", sub: "monthly recurring" },
          ].map(({ label, value, icon: Icon, color, bg, sub }) => (
            <Card key={label} className="p-3 sm:p-4">
              <div className="flex items-start justify-between">
                <div className="min-w-0">
                  <p className="text-xs text-gray-500 font-medium">{label}</p>
                  <p className="text-xl sm:text-2xl font-bold text-gray-900 mt-1">{value}</p>
                  {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
                </div>
                <span className={`${bg} ${color} p-1.5 sm:p-2 rounded-lg shrink-0 ml-2`}>
                  <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                </span>
              </div>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-3">
          {[
            { label: "Active Customers", value: activeCustomers, icon: Users, color: "text-sky-600", bg: "bg-sky-50" },
            { label: "New Customers", value: newCustomers, icon: Users, color: "text-green-600", bg: "bg-green-50" },
            { label: "Visits", value: visitsInPeriod.length, icon: CalendarDays, color: "text-indigo-600", bg: "bg-indigo-50" },
            { label: "Completed", value: completedVisits, icon: CalendarDays, color: "text-green-600", bg: "bg-green-50" },
          ].map(({ label, value, icon: Icon, color, bg }) => (
            <Card key={label} className="p-3 sm:p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-gray-500 font-medium">{label}</p>
                  <p className="text-xl sm:text-2xl font-bold text-gray-900 mt-1">{value}</p>
                </div>
                <span className={`${bg} ${color} p-1.5 sm:p-2 rounded-lg shrink-0 ml-2`}>
                  <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                </span>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* ── P&L Summary ── */}
      <Card>
        <CardHeader>
          <h2 className="font-semibold text-gray-900 text-sm">
            Profit & Loss — {PERIODS.find((p) => p.key === period)?.label}
          </h2>
        </CardHeader>
        <CardBody>
          <div className="grid sm:grid-cols-3 gap-4 mb-4">
            <div>
              <p className="text-xs text-gray-500 font-medium">Revenue Collected</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(collected)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium">Total Expenses</p>
              <p className="text-2xl font-bold text-red-600 mt-1">{formatCurrency(totalExpenses)}</p>
              <Link href="/expenses" className="text-xs text-sky-600 hover:underline mt-0.5 inline-block">View expenses →</Link>
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium">Net Profit</p>
              <p className={`text-2xl font-bold mt-1 ${netProfit >= 0 ? "text-green-600" : "text-red-600"}`}>
                {formatCurrency(netProfit)}
              </p>
              {collected > 0 && (
                <p className="text-xs text-gray-400 mt-0.5">
                  {Math.round((netProfit / collected) * 100)}% margin
                </p>
              )}
            </div>
          </div>
          {expenseByCategory.size > 0 && (
            <div className="border-t border-gray-100 pt-3 grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[...expenseByCategory.entries()].sort((a, b) => b[1] - a[1]).map(([cat, amt]) => (
                <div key={cat} className="text-sm">
                  <p className="text-xs text-gray-400">{EXPENSE_CAT_LABELS[cat] ?? cat}</p>
                  <p className="font-semibold text-gray-700 mt-0.5">{formatCurrency(amt)}</p>
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>

      {/* ── Revenue chart + Invoice breakdown ── */}
      <div className="grid lg:grid-cols-2 gap-5">
        <Card>
          <CardHeader><h2 className="font-semibold text-gray-900 text-sm">Monthly Revenue (last 6 months)</h2></CardHeader>
          <CardBody>
            <div className="space-y-2">
              {chartData.map((d) => {
                const [y, m] = d.key.split("-").map(Number)
                const from = `${d.key}-01`
                const lastDay = new Date(y, m, 0).getDate()
                const to = `${d.key}-${String(lastDay).padStart(2, "0")}`
                return (
                  <Link
                    key={d.key}
                    href={d.amount > 0 ? `/invoices?from=${from}&to=${to}` : "#"}
                    className="flex items-center gap-3 rounded-lg hover:bg-gray-50 transition-colors -mx-1 px-1 py-0.5 group"
                  >
                    <span className="text-xs text-gray-500 w-12 shrink-0 text-right">{d.label}</span>
                    <div className="flex-1 bg-gray-100 rounded-full h-5 overflow-hidden">
                      <div
                        className="h-full bg-sky-500 group-hover:bg-sky-600 rounded-full transition-all"
                        style={{ width: `${(d.amount / chartMax) * 100}%` }}
                      />
                    </div>
                    <span className="text-xs font-medium text-gray-700 w-16 shrink-0">{formatCurrency(d.amount)}</span>
                  </Link>
                )
              })}
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader><h2 className="font-semibold text-gray-900 text-sm">Invoice Breakdown ({PERIODS.find(p => p.key === period)?.label})</h2></CardHeader>
          <div className="divide-y divide-gray-50">
            {breakdown.filter((b) => b.count > 0).map((b) => (
              <Link key={b.status} href={`/invoices?status=${b.status}`} className="px-5 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-3">
                  {statusBadge(b.status)}
                  <span className="text-sm text-gray-500">{b.count} invoice{b.count !== 1 ? "s" : ""}</span>
                </div>
                <span className="text-sm font-semibold text-gray-900">{formatCurrency(b.amount)}</span>
              </Link>
            ))}
            {breakdown.every((b) => b.count === 0) && (
              <div className="px-5 py-8 text-center text-sm text-gray-400">No invoices in this period.</div>
            )}
          </div>
        </Card>
      </div>

      {/* ── Revenue by service type ── */}
      <Card>
        <CardHeader>
          <h2 className="font-semibold text-gray-900 text-sm">
            Revenue by Service Type — {PERIODS.find((p) => p.key === period)?.label}
          </h2>
        </CardHeader>
        <CardBody>
          {serviceTypeData.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">No invoices in this period.</p>
          ) : (
            <div className="space-y-3">
              {serviceTypeData.map((d) => (
                <Link
                  key={d.type}
                  href={`/invoices?serviceType=${encodeURIComponent(d.type)}`}
                  className="flex items-center gap-3 rounded-lg hover:bg-gray-50 transition-colors -mx-1 px-1 py-0.5 group"
                >
                  <span className="text-xs text-gray-500 w-40 shrink-0 truncate">{d.label}</span>
                  <div className="flex-1 bg-gray-100 rounded-full h-5 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-sky-500 group-hover:bg-sky-600 transition-colors"
                      style={{ width: `${(d.amount / serviceTypeMax) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs font-medium text-gray-700 w-20 shrink-0 text-right">
                    {formatCurrency(d.amount)}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </CardBody>
      </Card>

      {/* ── Payment method breakdown ── */}
      <Card>
        <CardHeader>
          <h2 className="font-semibold text-gray-900 text-sm">
            Payment Methods — {PERIODS.find((p) => p.key === period)?.label}
          </h2>
        </CardHeader>
        <CardBody>
          <PaymentDonut slices={paymentSlices} total={collected} />
        </CardBody>
      </Card>

      {/* ── Quick links ── */}
      <section>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Detailed Reports</h2>
        <div className="grid sm:grid-cols-2 gap-3">
          <Link href="/reports/aging">
            <Card className="p-4 flex items-center gap-4 hover:bg-gray-50 transition-colors cursor-pointer">
              <span className="bg-red-50 text-red-600 p-2.5 rounded-lg shrink-0">
                <Clock className="w-5 h-5" />
              </span>
              <div>
                <p className="font-semibold text-gray-900 text-sm">AR Aging</p>
                <p className="text-xs text-gray-500 mt-0.5">Open balances by 30 / 60 / 90 days past due</p>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-300 ml-auto shrink-0" />
            </Card>
          </Link>
          <Link href="/reports/routes">
            <Card className="p-4 flex items-center gap-4 hover:bg-gray-50 transition-colors cursor-pointer">
              <span className="bg-sky-50 text-sky-600 p-2.5 rounded-lg shrink-0">
                <MapPin className="w-5 h-5" />
              </span>
              <div>
                <p className="font-semibold text-gray-900 text-sm">Revenue by Route</p>
                <p className="text-xs text-gray-500 mt-0.5">Invoiced and collected per service route</p>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-300 ml-auto shrink-0" />
            </Card>
          </Link>
          <Link href="/reports/technicians">
            <Card className="p-4 flex items-center gap-4 hover:bg-gray-50 transition-colors cursor-pointer">
              <span className="bg-purple-50 text-purple-600 p-2.5 rounded-lg shrink-0">
                <Users2 className="w-5 h-5" />
              </span>
              <div>
                <p className="font-semibold text-gray-900 text-sm">Technician Scorecards</p>
                <p className="text-xs text-gray-500 mt-0.5">Visits, ratings, chem spend per tech</p>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-300 ml-auto shrink-0" />
            </Card>
          </Link>
        </div>
      </section>

      {/* ── Chemical Costs ── */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-gray-900 text-sm">
              Chemical Costs — {PERIODS.find((p) => p.key === period)?.label}
            </h2>
            <span className="text-lg font-bold text-gray-900">{formatCurrency(totalChemicalSpend)}</span>
          </div>
        </CardHeader>
        <CardBody>
          {chemicalByProduct.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">No chemical usage recorded in this period.</p>
          ) : (
            <div className="space-y-3">
              {chemicalByProduct.map((row) => {
                const cost = row._sum.totalCost ?? 0
                const qty  = row._sum.quantity ?? 0
                return (
                  <div key={row.productName} className="flex items-center gap-3">
                    <span className="text-xs text-gray-500 w-40 shrink-0 truncate">{row.productName}</span>
                    <div className="flex-1 bg-gray-100 rounded-full h-4 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-purple-500"
                        style={{ width: `${(cost / chemMaxCost) * 100}%` }}
                      />
                    </div>
                    <span className="text-xs font-medium text-gray-700 w-20 shrink-0 text-right">
                      {formatCurrency(cost)}
                    </span>
                    <span className="text-xs text-gray-400 w-20 shrink-0 text-right hidden sm:block">
                      {qty % 1 === 0 ? qty : qty.toFixed(2)} units
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </CardBody>
      </Card>

      {/* ── Chemical health ── */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Chemical Health</h2>
          {needsAttention.length > 0 && (
            <span className="text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-2.5 py-1">
              {needsAttention.length} need{needsAttention.length === 1 ? "s" : ""} attention
            </span>
          )}
        </div>
        <ChemicalHealthTable
          withReadings={withReadings}
          noReadings={noReadings}
          needsAttention={needsAttention}
        />
      </section>
    </div>
  )
}
