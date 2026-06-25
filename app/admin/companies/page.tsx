import { db } from "@/lib/db"
import Card, { CardHeader, CardBody } from "@/components/ui/Card"
import { formatDate, formatCurrency } from "@/lib/utils"
import { toggleCompany, adminCreateCompany, deleteCompany } from "@/lib/actions/admin"
import Button from "@/components/ui/Button"
import { Building2, Plus, ChevronRight, Users, TrendingUp, CreditCard, DollarSign } from "lucide-react"
import Link from "next/link"
import ConfirmButton from "@/components/ui/ConfirmButton"
import { getPlan, PLANS } from "@/lib/plans"

export const dynamic = "force-dynamic"

const inputCls = "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-500"

export default async function AdminCompaniesPage({
  searchParams,
}: {
  searchParams: Promise<{ created?: string; error?: string }>
}) {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

  const [companies, recentStripePayments, sp] = await Promise.all([
    db.company.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { users: true, customers: true } },
        customers: {
          where: { status: "active" },
          select: { monthlyRate: true },
        },
      },
    }),
    // Card payments processed through each company in the last 30 days
    db.payment.findMany({
      where: { method: "card", createdAt: { gte: thirtyDaysAgo } },
      select: {
        amount: true,
        invoice: { select: { companyId: true } },
      },
    }),
    searchParams,
  ])

  // Build per-company Stripe 30d volume map
  const stripe30dByCompany = new Map<string, number>()
  for (const p of recentStripePayments) {
    const cid = p.invoice.companyId
    stripe30dByCompany.set(cid, (stripe30dByCompany.get(cid) ?? 0) + p.amount)
  }

  // Annotate each company with computed metrics
  const rows = companies.map((c) => {
    const mrr       = c.customers.reduce((sum, cu) => sum + (cu.monthlyRate ?? 0), 0)
    const stripe30d = stripe30dByCompany.get(c.id) ?? 0
    return { ...c, mrr, stripe30d }
  })

  // Summary KPIs
  const activeCompanies = rows.filter((c) => c.isActive)
  const totalCustomers  = rows.reduce((s, c) => s + c._count.customers, 0)
  const totalMrr        = rows.reduce((s, c) => s + c.mrr, 0)
  // Platform MRR = what PoolOS earns from plan subscriptions (active, paying companies)
  const platformMrr = activeCompanies.reduce((s, c) => {
    const price = getPlan(c.plan).priceMonthly
    return s + (price ?? 0)
  }, 0)
  const totalStripe30d = rows.reduce((s, c) => s + c.stripe30d, 0)

  return (
    <div className="space-y-5 sm:space-y-6">
      <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Companies ({companies.length})</h1>

      {sp.created && (
        <div className="rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-800">
          Company created successfully. The owner can now log in.
        </div>
      )}
      {sp.error === "email_exists" && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-800">
          A user with that email already exists.
        </div>
      )}

      {/* KPI summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          {
            label: "Total customers",
            value: totalCustomers.toLocaleString(),
            icon: Users,
            color: "text-sky-600 bg-sky-50",
          },
          {
            label: "Customer MRR",
            value: formatCurrency(totalMrr),
            sub: "sum of all monthly rates",
            icon: TrendingUp,
            color: "text-green-600 bg-green-50",
          },
          {
            label: "Platform MRR",
            value: formatCurrency(platformMrr),
            sub: "PoolOS subscription revenue",
            icon: DollarSign,
            color: "text-purple-600 bg-purple-50",
          },
          {
            label: "Stripe volume (30d)",
            value: formatCurrency(totalStripe30d),
            sub: "card payments processed",
            icon: CreditCard,
            color: "text-amber-600 bg-amber-50",
          },
        ].map((kpi) => (
          <div key={kpi.label} className="bg-white rounded-xl border border-gray-200 px-4 py-3">
            <div className="flex items-center gap-2 mb-1">
              <span className={`p-1.5 rounded-lg ${kpi.color}`}>
                <kpi.icon className="w-3.5 h-3.5" />
              </span>
              <p className="text-xs text-gray-500">{kpi.label}</p>
            </div>
            <p className="text-xl font-bold text-gray-900">{kpi.value}</p>
            {kpi.sub && <p className="text-xs text-gray-400 mt-0.5">{kpi.sub}</p>}
          </div>
        ))}
      </div>

      {/* Plan breakdown */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {(["trial", "starter", "pro", "unlimited"] as const).map((planId) => {
          const plan  = PLANS[planId]
          const count = rows.filter((c) => c.plan === planId && c.isActive).length
          return (
            <div key={planId} className="bg-white rounded-xl border border-gray-200 px-4 py-3 flex items-center gap-3">
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${plan.badge}`}>
                {plan.label}
              </span>
              <div>
                <p className="text-lg font-bold text-gray-900">{count}</p>
                <p className="text-xs text-gray-400">
                  {plan.priceMonthly ? formatCurrency(plan.priceMonthly * count) + "/mo" : "Free"}
                </p>
              </div>
            </div>
          )
        })}
      </div>

      {/* Companies table */}
      {/* Mobile */}
      <div className="sm:hidden space-y-2">
        {rows.map((c) => {
          const toggleAction = toggleCompany.bind(null, c.id, !c.isActive)
          const deleteAction = deleteCompany.bind(null, c.id)
          return (
            <Card key={c.id} className="p-4">
              <div className="flex items-start justify-between mb-2">
                <div className="min-w-0">
                  <Link href={`/admin/companies/${c.id}`} className="font-medium text-gray-900 hover:text-sky-600 truncate block">
                    {c.name}
                  </Link>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {c._count.customers} customers · {c._count.users} users · Joined {formatDate(c.createdAt)}
                  </p>
                </div>
                <Link href={`/admin/companies/${c.id}`} className="shrink-0 ml-3">
                  <ChevronRight className="w-4 h-4 text-gray-300" />
                </Link>
              </div>
              <div className="grid grid-cols-3 gap-2 py-2 border-t border-b border-gray-100 mb-2 text-center">
                <div>
                  <p className="text-xs text-gray-400">MRR</p>
                  <p className="text-sm font-semibold text-gray-900">{c.mrr > 0 ? formatCurrency(c.mrr) : "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Stripe 30d</p>
                  <p className="text-sm font-semibold text-gray-900">{c.stripe30d > 0 ? formatCurrency(c.stripe30d) : "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Plan</p>
                  <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium ${getPlan(c.plan).badge}`}>
                    {getPlan(c.plan).label}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  c.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"
                }`}>{c.isActive ? "Active" : "Inactive"}</span>
                <div className="ml-auto flex gap-2">
                  <form action={toggleAction}>
                    <Button type="submit" size="sm" variant="secondary">
                      {c.isActive ? "Deactivate" : "Activate"}
                    </Button>
                  </form>
                  <ConfirmButton
                    action={deleteAction}
                    confirm={`Delete ${c.name} and all its data? This cannot be undone.`}
                    variant="danger"
                    size="sm"
                  >
                    Delete
                  </ConfirmButton>
                </div>
              </div>
            </Card>
          )
        })}
      </div>

      {/* Desktop table */}
      <Card className="hidden sm:block">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-xs text-gray-500 uppercase tracking-wide">
                <th className="px-5 py-3 text-left font-medium">Company</th>
                <th className="px-5 py-3 text-left font-medium">Plan</th>
                <th className="px-5 py-3 text-right font-medium">Customers</th>
                <th className="px-5 py-3 text-right font-medium">Customer MRR</th>
                <th className="px-5 py-3 text-right font-medium">Stripe 30d</th>
                <th className="px-5 py-3 text-left font-medium">Status</th>
                <th className="px-5 py-3 text-left font-medium hidden lg:table-cell">Joined</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {rows.map((c) => {
                const toggleAction = toggleCompany.bind(null, c.id, !c.isActive)
                const deleteAction = deleteCompany.bind(null, c.id)
                return (
                  <tr key={c.id} className="hover:bg-gray-50">
                    <td className="px-5 py-3">
                      <p className="font-medium text-gray-900">{c.name}</p>
                      <p className="text-xs text-gray-400">{c._count.users} users</p>
                    </td>
                    <td className="px-5 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getPlan(c.plan).badge}`}>
                        {getPlan(c.plan).label}
                      </span>
                      {c.stripeSubStatus && (
                        <p className={`text-xs mt-0.5 ${
                          c.stripeSubStatus === "active" ? "text-green-600" :
                          c.stripeSubStatus === "trialing" ? "text-blue-600" : "text-red-500"
                        }`}>{c.stripeSubStatus}</p>
                      )}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <span className="font-semibold text-gray-900">{c._count.customers}</span>
                      <p className="text-xs text-gray-400">active: {c.customers.length}</p>
                    </td>
                    <td className="px-5 py-3 text-right">
                      {c.mrr > 0
                        ? <span className="font-semibold text-gray-900">{formatCurrency(c.mrr)}</span>
                        : <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-5 py-3 text-right">
                      {c.stripe30d > 0
                        ? <span className="font-semibold text-gray-900">{formatCurrency(c.stripe30d)}</span>
                        : <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-5 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        c.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"
                      }`}>{c.isActive ? "Active" : "Inactive"}</span>
                    </td>
                    <td className="px-5 py-3 text-gray-500 text-xs hidden lg:table-cell">{formatDate(c.createdAt)}</td>
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <form action={toggleAction}>
                          <Button type="submit" size="sm" variant="secondary">
                            {c.isActive ? "Deactivate" : "Activate"}
                          </Button>
                        </form>
                        <ConfirmButton
                          action={deleteAction}
                          confirm={`Delete ${c.name} and all its data? This cannot be undone.`}
                          variant="danger"
                          size="sm"
                        >
                          Delete
                        </ConfirmButton>
                        <Link href={`/admin/companies/${c.id}`} className="text-gray-400 hover:text-sky-600">
                          <ChevronRight className="w-4 h-4" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
            {/* Totals footer */}
            <tfoot>
              <tr className="border-t-2 border-gray-200 bg-gray-50 text-xs font-semibold text-gray-600">
                <td className="px-5 py-3 text-gray-500">Totals</td>
                <td className="px-5 py-3" />
                <td className="px-5 py-3 text-right text-gray-900">{totalCustomers.toLocaleString()}</td>
                <td className="px-5 py-3 text-right text-gray-900">{formatCurrency(totalMrr)}</td>
                <td className="px-5 py-3 text-right text-gray-900">{formatCurrency(totalStripe30d)}</td>
                <td colSpan={3} />
              </tr>
            </tfoot>
          </table>
        </div>
      </Card>

      {/* Create company form */}
      <Card>
        <CardHeader>
          <h2 className="font-semibold text-gray-900 text-sm flex items-center gap-2">
            <Plus className="w-4 h-4 text-sky-500" /> Create New Company
          </h2>
        </CardHeader>
        <CardBody>
          <form action={adminCreateCompany} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
              <input name="companyName" required placeholder="Sunshine Pool Service" className={inputCls} />
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Owner First Name</label>
                <input name="firstName" required placeholder="Jane" className={inputCls} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Owner Last Name</label>
                <input name="lastName" required placeholder="Smith" className={inputCls} />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Owner Email</label>
              <input name="email" type="email" required placeholder="owner@company.com" className={inputCls} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Temporary Password</label>
              <input name="password" type="text" required placeholder="Set a temporary password for the owner" className={inputCls} />
            </div>
            <Button type="submit">
              <Building2 className="w-4 h-4" /> Create Company
            </Button>
          </form>
        </CardBody>
      </Card>
    </div>
  )
}
