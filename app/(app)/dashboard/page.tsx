import { db } from "@/lib/db"
import { requireSession } from "@/lib/session"
import { formatCurrency, DAY_NAMES } from "@/lib/utils"
import Card from "@/components/ui/Card"
import Link from "next/link"
import { Users, MapPin, DollarSign, AlertCircle, CheckCircle, Droplets } from "lucide-react"
import { statusBadge } from "@/components/ui/Badge"
import { visitNeedsAttention, chemStatus, CHEM_RANGES, STATUS_BG } from "@/lib/chemistry"
import { cookies } from "next/headers"
import SetupChecklist, { type SetupStep } from "@/components/dashboard/SetupChecklist"

export const dynamic = "force-dynamic"

export default async function DashboardPage() {
  const { companyId, companyName } = await requireSession()
  const today = new Date().getDay()

  const cookieStore = await cookies()
  const onboardingDismissed = cookieStore.get("poolos_onboarding_dismissed")?.value === "1"

  const [customerCount, routeCount, recentVisits, overdueInvoices, unpaidInvoices, todayRoutes, recentChemVisits, company, invoiceCount] =
    await Promise.all([
      db.customer.count({ where: { companyId, status: "active" } }),
      db.route.count({ where: { companyId, isActive: true } }),
      db.serviceVisit.findMany({
        take: 5,
        orderBy: { visitedAt: "desc" },
        include: { customer: true },
        where: { customer: { companyId } },
      }),
      db.invoice.count({ where: { companyId, status: "overdue" } }),
      db.invoice.findMany({
        where: { companyId, status: { in: ["sent", "overdue"] } },
        include: { items: true, customer: true },
        orderBy: { dueDate: "asc" },
        take: 5,
      }),
      db.route.findMany({
        where: { companyId, dayOfWeek: today, isActive: true },
        include: { stops: { include: { customer: true }, orderBy: { position: "asc" } } },
      }),
      // Latest visit per customer (last 30 days) with chemical readings
      db.serviceVisit.findMany({
        where: {
          customer: { companyId },
          visitedAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
          OR: [
            { chlorine: { not: null } },
            { ph: { not: null } },
            { alkalinity: { not: null } },
            { calcium: { not: null } },
          ],
        },
        orderBy: { visitedAt: "desc" },
        include: { customer: { select: { id: true, firstName: true, lastName: true } } },
        take: 100,
      }),
      db.company.findUnique({ where: { id: companyId }, select: { phone: true, stripeAccountId: true } }),
      db.invoice.count({ where: { companyId } }),
    ])

  const unpaidTotal = unpaidInvoices.reduce(
    (sum, inv) => sum + inv.items.reduce((s, i) => s + i.quantity * i.unitPrice, 0),
    0
  )

  // Deduplicate: keep only the most recent visit per customer
  const latestByCustomer = new Map<string, typeof recentChemVisits[0]>()
  for (const v of recentChemVisits) {
    if (!latestByCustomer.has(v.customerId)) latestByCustomer.set(v.customerId, v)
  }
  const poolsNeedingAttention = [...latestByCustomer.values()].filter((v) =>
    visitNeedsAttention({ chlorine: v.chlorine, ph: v.ph, alkalinity: v.alkalinity, calcium: v.calcium })
  )

  const setupSteps: SetupStep[] = [
    {
      label: "Add your first customer",
      description: "Create a customer profile to start tracking their pool and sending invoices.",
      href: "/customers/new",
      done: customerCount > 0,
    },
    {
      label: "Create a service route",
      description: "Group customers into a route to organize your weekly schedule.",
      href: "/routes",
      done: routeCount > 0,
    },
    {
      label: "Complete your company profile",
      description: "Add your phone number so it appears on invoices and customer emails.",
      href: "/settings/company",
      done: company?.phone != null,
    },
    {
      label: "Set up online payments",
      description: "Connect Stripe so customers can pay invoices with a credit card.",
      href: "/settings/payments",
      done: company?.stripeAccountId != null,
    },
    {
      label: "Send your first invoice",
      description: "Generate and send an invoice to collect payment from a customer.",
      href: "/invoices/new",
      done: invoiceCount > 0,
    },
  ]

  const stats = [
    { label: "Active Customers", value: customerCount, icon: Users, color: "text-sky-600", bg: "bg-sky-50" },
    { label: "Active Routes", value: routeCount, icon: MapPin, color: "text-indigo-600", bg: "bg-indigo-50" },
    { label: "Overdue Invoices", value: overdueInvoices, icon: AlertCircle, color: "text-red-600", bg: "bg-red-50" },
    { label: "Outstanding", value: formatCurrency(unpaidTotal), icon: DollarSign, color: "text-green-600", bg: "bg-green-50" },
  ]

  return (
    <div className="space-y-5 sm:space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">{companyName} · {DAY_NAMES[today]}</p>
      </div>

      {!onboardingDismissed && <SetupChecklist steps={setupSteps} />}

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {stats.map(({ label, value, icon: Icon, color, bg }) => (
          <Card key={label} className="p-3 sm:p-4">
            <div className="flex items-start justify-between">
              <div className="min-w-0">
                <p className="text-xs text-gray-500 font-medium leading-tight">{label}</p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900 mt-1">{value}</p>
              </div>
              <span className={`${bg} ${color} p-1.5 sm:p-2 rounded-lg shrink-0 ml-2`}>
                <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
              </span>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6">
        {/* Today's Routes */}
        <Card>
          <div className="px-4 sm:px-5 py-3 sm:py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900 text-sm sm:text-base">Today&rsquo;s Routes</h2>
            <Link href="/routes" className="text-xs text-sky-600 hover:underline shrink-0 ml-2">All routes</Link>
          </div>
          <div className="divide-y divide-gray-50">
            {todayRoutes.length === 0 ? (
              <p className="px-5 py-8 text-center text-sm text-gray-400">No routes scheduled for today.</p>
            ) : (
              todayRoutes.map((route) => (
                <div key={route.id} className="px-4 sm:px-5 py-3">
                  <div className="flex items-center justify-between mb-2">
                    <Link href={`/routes/${route.id}`} className="font-medium text-sm text-gray-900 hover:text-sky-600 truncate">
                      {route.name}
                    </Link>
                    <span className="text-xs text-gray-400 shrink-0 ml-2">{route.stops.length} stops</span>
                  </div>
                  <div className="space-y-1.5">
                    {route.stops.slice(0, 3).map((stop, i) => (
                      <div key={stop.id} className="flex items-center gap-2 text-xs text-gray-500">
                        <span className="w-5 h-5 rounded-full bg-sky-100 text-sky-700 flex items-center justify-center font-medium shrink-0">
                          {i + 1}
                        </span>
                        <span className="font-medium text-gray-700 truncate">
                          {stop.customer.firstName} {stop.customer.lastName}
                        </span>
                        <span className="text-gray-400 truncate hidden sm:inline">— {stop.customer.address}</span>
                      </div>
                    ))}
                    {route.stops.length > 3 && (
                      <p className="text-xs text-gray-400 pl-7">+{route.stops.length - 3} more</p>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Unpaid Invoices */}
        <Card>
          <div className="px-4 sm:px-5 py-3 sm:py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900 text-sm sm:text-base">Unpaid Invoices</h2>
            <Link href="/invoices" className="text-xs text-sky-600 hover:underline shrink-0 ml-2">All invoices</Link>
          </div>
          <div className="divide-y divide-gray-50">
            {unpaidInvoices.length === 0 ? (
              <div className="px-5 py-8 text-center">
                <CheckCircle className="w-8 h-8 text-green-400 mx-auto mb-2" />
                <p className="text-sm text-gray-400">All invoices are paid!</p>
              </div>
            ) : (
              unpaidInvoices.map((inv) => {
                const total = inv.items.reduce((s, i) => s + i.quantity * i.unitPrice, 0)
                return (
                  <Link key={inv.id} href={`/invoices/${inv.id}`}
                    className="flex items-center justify-between px-4 sm:px-5 py-3 hover:bg-gray-50 transition-colors">
                    <div className="min-w-0 mr-3">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {inv.customer.firstName} {inv.customer.lastName}
                      </p>
                      <p className="text-xs text-gray-400">#{inv.invoiceNumber}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-semibold text-gray-900">{formatCurrency(total)}</p>
                      <div className="mt-0.5">{statusBadge(inv.status)}</div>
                    </div>
                  </Link>
                )
              })
            )}
          </div>
        </Card>
      </div>

      {/* Recent Visits */}
      <Card>
        <div className="px-4 sm:px-5 py-3 sm:py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900 text-sm sm:text-base">Recent Visits</h2>
          <Link href="/schedule" className="text-xs text-sky-600 hover:underline shrink-0 ml-2">View schedule</Link>
        </div>
        <div className="divide-y divide-gray-50">
          {recentVisits.length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-gray-400">No visits logged yet.</p>
          ) : (
            recentVisits.map((visit) => (
              <div key={visit.id} className="flex items-center justify-between px-4 sm:px-5 py-3">
                <div className="min-w-0 mr-3">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {visit.customer.firstName} {visit.customer.lastName}
                  </p>
                  {visit.notes && <p className="text-xs text-gray-400 truncate">{visit.notes}</p>}
                </div>
                <div className="text-right shrink-0">
                  <div>{statusBadge(visit.status)}</div>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {new Date(visit.visitedAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>

      {/* Pools Needing Attention */}
      {poolsNeedingAttention.length > 0 && (
        <Card>
          <div className="px-4 sm:px-5 py-3 sm:py-4 border-b border-gray-100 flex items-center gap-2">
            <Droplets className="w-4 h-4 text-amber-500" />
            <h2 className="font-semibold text-gray-900 text-sm sm:text-base">Pools Needing Attention</h2>
            <span className="ml-auto text-xs text-gray-400">based on last 30 days</span>
          </div>
          <div className="divide-y divide-gray-50">
            {poolsNeedingAttention.map((v) => {
              const readings = [
                { key: "chlorine" as const, label: "Cl", value: v.chlorine },
                { key: "ph" as const,       label: "pH", value: v.ph },
                { key: "alkalinity" as const, label: "Alk", value: v.alkalinity },
                { key: "calcium" as const,  label: "Ca",  value: v.calcium },
              ].filter((r) => {
                if (r.value == null) return false
                const s = chemStatus(r.key, r.value)
                return s === "low" || s === "high"
              })
              return (
                <Link
                  key={v.id}
                  href={`/customers/${v.customerId}`}
                  className="flex items-center justify-between px-4 sm:px-5 py-3 hover:bg-gray-50 transition-colors"
                >
                  <p className="text-sm font-medium text-gray-900">
                    {v.customer.firstName} {v.customer.lastName}
                  </p>
                  <div className="flex flex-wrap gap-1.5 justify-end">
                    {readings.map((r) => {
                      const s = chemStatus(r.key, r.value)
                      const range = CHEM_RANGES[r.key]
                      return (
                        <span
                          key={r.key}
                          title={`${range.label}: ${r.value}${range.unit ? " " + range.unit : ""} (normal ${range.low}–${range.high})`}
                          className={`inline-flex items-center gap-0.5 rounded-full border px-2 py-0.5 text-xs font-medium ${s ? STATUS_BG[s] : ""}`}
                        >
                          {r.label}: {r.value}
                          {s === "low" && " ▼"}
                          {s === "high" && " ▲"}
                        </span>
                      )
                    })}
                  </div>
                </Link>
              )
            })}
          </div>
        </Card>
      )}
    </div>
  )
}
