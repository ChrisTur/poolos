import { db } from "@/lib/db"
import Card from "@/components/ui/Card"
import Link from "next/link"
import { formatCurrency, formatDate } from "@/lib/utils"
import { PLANS, type PlanId } from "@/lib/plans"
import { DollarSign, TrendingUp, Users, BarChart3, AlertTriangle, Clock, XCircle } from "lucide-react"

export const dynamic = "force-dynamic"

const PLAN_ORDER: PlanId[] = ["starter", "pro", "unlimited"]

function monthKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
}
function monthLabel(key: string) {
  const [y, m] = key.split("-").map(Number)
  return new Date(y, m - 1, 1).toLocaleString("default", { month: "short", year: "2-digit" })
}
function last12Months(): string[] {
  const now = new Date()
  const keys: string[] = []
  for (let i = 11; i >= 0; i--) {
    keys.push(monthKey(new Date(now.getFullYear(), now.getMonth() - i, 1)))
  }
  return keys
}

export default async function AdminReportsPage() {
  const companies = await db.company.findMany({
    select: {
      id: true,
      name: true,
      plan: true,
      isActive: true,
      stripeSubStatus: true,
      createdAt: true,
      trialEndsAt: true,
    },
    orderBy: { createdAt: "desc" },
  })

  const now = new Date()

  // ── MRR / ARR ──────────────────────────────────────────────────────────────

  const stripeMrr = companies
    .filter((c) => c.stripeSubStatus === "active")
    .reduce((s, c) => s + (PLANS[c.plan as PlanId]?.priceMonthly ?? 0), 0)

  const planMrr = companies
    .filter((c) => c.isActive && c.plan !== "trial")
    .reduce((s, c) => s + (PLANS[c.plan as PlanId]?.priceMonthly ?? 0), 0)

  const payingCount = companies.filter((c) => c.isActive && c.plan !== "trial").length
  const arpu = payingCount > 0 ? planMrr / payingCount : 0

  // ── Plan distribution ──────────────────────────────────────────────────────

  const planBreakdown = PLAN_ORDER.map((id) => {
    const members = companies.filter((c) => c.isActive && c.plan === id)
    const mrr = members.reduce((s) => s + (PLANS[id]?.priceMonthly ?? 0), 0)
    return { id, label: PLANS[id].label, badge: PLANS[id].badge, count: members.length, mrr }
  })

  const trialCompanies = companies.filter((c) => c.isActive && c.plan === "trial")

  // ── Monthly new signups (last 12 months) ───────────────────────────────────

  const months = last12Months()
  const signupsByMonth: Record<string, { total: number; converted: number }> = {}
  for (const key of months) signupsByMonth[key] = { total: 0, converted: 0 }

  for (const c of companies) {
    const key = monthKey(c.createdAt)
    if (!signupsByMonth[key]) continue
    signupsByMonth[key].total++
    if (c.plan !== "trial" || c.stripeSubStatus === "active") {
      signupsByMonth[key].converted++
    }
  }

  const maxSignups = Math.max(...months.map((k) => signupsByMonth[k].total), 1)

  // ── Totals for conversion funnel ───────────────────────────────────────────

  const totalEver = companies.length
  const totalPaying = companies.filter((c) => c.plan !== "trial").length
  const conversionRate = totalEver > 0 ? Math.round((totalPaying / totalEver) * 100) : 0

  // ── At-risk ────────────────────────────────────────────────────────────────

  const pastDue = companies.filter((c) => c.stripeSubStatus === "past_due")

  const trialsExpiringSoon = companies.filter((c) => {
    if (c.plan !== "trial" || !c.trialEndsAt) return false
    const daysLeft = (c.trialEndsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    return daysLeft >= 0 && daysLeft <= 7
  }).map((c) => ({
    ...c,
    daysLeft: Math.ceil((c.trialEndsAt!.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
  }))

  const expiredTrials = companies.filter((c) => {
    if (c.plan !== "trial" || !c.trialEndsAt) return false
    return c.trialEndsAt < now && c.isActive
  })

  const inactive = companies.filter((c) => !c.isActive).slice(0, 10)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Revenue & Growth</h1>
        <p className="text-sm text-gray-400 mt-1">PoolOS subscription metrics — not pool company data</p>
      </div>

      {/* ── MRR / ARR KPIs ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          {
            label: "Stripe MRR",
            value: formatCurrency(stripeMrr),
            sub: "Stripe-confirmed active subs",
            icon: DollarSign,
            color: "text-emerald-600 bg-emerald-50",
            note: stripeMrr < planMrr ? `${formatCurrency(planMrr - stripeMrr)} unbilled` : null,
          },
          {
            label: "Plan MRR",
            value: formatCurrency(planMrr),
            sub: `${payingCount} paying companies`,
            icon: TrendingUp,
            color: "text-sky-600 bg-sky-50",
            note: null,
          },
          {
            label: "ARR",
            value: formatCurrency(stripeMrr * 12),
            sub: "MRR × 12",
            icon: BarChart3,
            color: "text-indigo-600 bg-indigo-50",
            note: null,
          },
          {
            label: "ARPU",
            value: payingCount > 0 ? formatCurrency(arpu) : "—",
            sub: "Avg revenue / paying company",
            icon: Users,
            color: "text-purple-600 bg-purple-50",
            note: null,
          },
        ].map(({ label, value, sub, icon: Icon, color, note }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-200 px-4 py-3.5">
            <div className="flex items-start justify-between gap-2 mb-1">
              <p className="text-xs text-gray-500 font-medium">{label}</p>
              <span className={`p-1.5 rounded-lg shrink-0 ${color}`}>
                <Icon className="w-3.5 h-3.5" />
              </span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            <p className="text-xs text-gray-400 mt-0.5">{sub}</p>
            {note && <p className="text-xs text-amber-500 mt-0.5">{note}</p>}
          </div>
        ))}
      </div>

      {/* ── Plan breakdown + Conversion funnel ─────────────────────────────── */}
      <div className="grid lg:grid-cols-2 gap-5">

        {/* Plan breakdown */}
        <Card>
          <div className="px-5 py-3 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900 text-sm">Revenue by Plan</h2>
          </div>
          <div className="divide-y divide-gray-50">
            {planBreakdown.map(({ id, label, badge, count, mrr }) => (
              <div key={id} className="flex items-center justify-between px-5 py-3.5">
                <div className="flex items-center gap-3">
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${badge}`}>
                    {label}
                  </span>
                  <span className="text-sm text-gray-500">{count} {count === 1 ? "company" : "companies"}</span>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-900">{mrr > 0 ? formatCurrency(mrr) : "—"}/mo</p>
                  {planMrr > 0 && mrr > 0 && (
                    <p className="text-xs text-gray-400">{Math.round((mrr / planMrr) * 100)}% of MRR</p>
                  )}
                </div>
              </div>
            ))}
            <div className="flex items-center justify-between px-5 py-3.5 bg-gray-50">
              <div className="flex items-center gap-3">
                <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
                  Trial
                </span>
                <span className="text-sm text-gray-500">{trialCompanies.length} {trialCompanies.length === 1 ? "company" : "companies"}</span>
              </div>
              <p className="text-sm font-semibold text-gray-400">$0/mo</p>
            </div>
          </div>
        </Card>

        {/* Conversion funnel */}
        <Card>
          <div className="px-5 py-3 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900 text-sm">Trial Conversion</h2>
          </div>
          <div className="divide-y divide-gray-50">
            {[
              { label: "Total signups ever", value: totalEver, color: "text-gray-900" },
              { label: "Converted to paid", value: totalPaying, color: "text-emerald-600" },
              { label: "Conversion rate", value: `${conversionRate}%`, color: conversionRate >= 20 ? "text-emerald-600" : "text-amber-500" },
              { label: "Active trials", value: trialCompanies.length, color: "text-sky-600" },
              { label: "Expired (still active)", value: expiredTrials.length, color: expiredTrials.length > 0 ? "text-red-500" : "text-gray-400" },
              { label: "Inactive / churned", value: inactive.length + (companies.length - inactive.length - companies.filter(c => c.isActive).length), color: "text-gray-500" },
            ].map(({ label, value, color }) => (
              <div key={label} className="flex items-center justify-between px-5 py-3">
                <span className="text-sm text-gray-600">{label}</span>
                <span className={`text-sm font-semibold ${color}`}>{value}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* ── Monthly signups chart (last 12 months) ─────────────────────────── */}
      <Card>
        <div className="px-5 py-3 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900 text-sm">New Signups — Last 12 Months</h2>
          <p className="text-xs text-gray-400 mt-0.5">Dark = converted to paid · Light = still on trial / total</p>
        </div>
        <div className="p-5">
          {months.every((k) => signupsByMonth[k].total === 0) ? (
            <p className="text-sm text-gray-400 text-center py-6">No signups yet.</p>
          ) : (
            <div className="space-y-2.5">
              {months.map((key) => {
                const { total, converted } = signupsByMonth[key]
                const totalPct = Math.round((total / maxSignups) * 100)
                const convertedPct = total > 0 ? Math.round((converted / total) * 100) : 0
                return (
                  <div key={key} className="flex items-center gap-3">
                    <span className="text-xs text-gray-400 w-12 shrink-0 text-right">{monthLabel(key)}</span>
                    <div className="flex-1 bg-gray-100 rounded-full h-5 overflow-hidden relative">
                      <div
                        className="absolute inset-y-0 left-0 bg-sky-200 rounded-full"
                        style={{ width: `${totalPct}%` }}
                      />
                      <div
                        className="absolute inset-y-0 left-0 bg-sky-600 rounded-full"
                        style={{ width: `${totalPct * (convertedPct / 100)}%` }}
                      />
                    </div>
                    <span className="text-xs font-medium text-gray-700 w-20 shrink-0 text-right">
                      {total > 0 ? `${total} signup${total !== 1 ? "s" : ""}` : "—"}
                      {converted > 0 && total > 0 && (
                        <span className="text-gray-400"> · {converted} paid</span>
                      )}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </Card>

      {/* ── At-risk panel ──────────────────────────────────────────────────── */}
      {(pastDue.length > 0 || trialsExpiringSoon.length > 0 || expiredTrials.length > 0) && (
        <div>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            Needs Attention
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">

            {pastDue.length > 0 && (
              <Card>
                <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-2">
                  <XCircle className="w-4 h-4 text-red-500" />
                  <h3 className="font-semibold text-gray-900 text-sm">Past Due ({pastDue.length})</h3>
                </div>
                <div className="divide-y divide-gray-50">
                  {pastDue.slice(0, 5).map((c) => (
                    <Link
                      key={c.id}
                      href={`/admin/companies/${c.id}`}
                      className="flex items-center justify-between px-5 py-3 hover:bg-gray-50 transition-colors"
                    >
                      <span className="text-sm text-gray-700 truncate">{c.name}</span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-medium shrink-0 ml-2">
                        {PLANS[c.plan as PlanId]?.label ?? c.plan}
                      </span>
                    </Link>
                  ))}
                  {pastDue.length > 5 && (
                    <p className="px-5 py-2 text-xs text-gray-400">+{pastDue.length - 5} more</p>
                  )}
                </div>
              </Card>
            )}

            {trialsExpiringSoon.length > 0 && (
              <Card>
                <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-500" />
                  <h3 className="font-semibold text-gray-900 text-sm">Trials Expiring (7d) ({trialsExpiringSoon.length})</h3>
                </div>
                <div className="divide-y divide-gray-50">
                  {trialsExpiringSoon.map((c) => (
                    <Link
                      key={c.id}
                      href={`/admin/companies/${c.id}`}
                      className="flex items-center justify-between px-5 py-3 hover:bg-gray-50 transition-colors"
                    >
                      <span className="text-sm text-gray-700 truncate">{c.name}</span>
                      <span className="text-xs text-amber-600 font-medium shrink-0 ml-2">
                        {c.daysLeft}d left
                      </span>
                    </Link>
                  ))}
                </div>
              </Card>
            )}

            {expiredTrials.length > 0 && (
              <Card>
                <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-orange-500" />
                  <h3 className="font-semibold text-gray-900 text-sm">Expired Trials ({expiredTrials.length})</h3>
                </div>
                <div className="divide-y divide-gray-50">
                  {expiredTrials.slice(0, 5).map((c) => (
                    <Link
                      key={c.id}
                      href={`/admin/companies/${c.id}`}
                      className="flex items-center justify-between px-5 py-3 hover:bg-gray-50 transition-colors"
                    >
                      <span className="text-sm text-gray-700 truncate">{c.name}</span>
                      <span className="text-xs text-orange-600 font-medium shrink-0 ml-2">
                        {c.trialEndsAt ? formatDate(c.trialEndsAt) : "—"}
                      </span>
                    </Link>
                  ))}
                  {expiredTrials.length > 5 && (
                    <p className="px-5 py-2 text-xs text-gray-400">+{expiredTrials.length - 5} more</p>
                  )}
                </div>
              </Card>
            )}
          </div>
        </div>
      )}

      {/* ── Inactive / churned ─────────────────────────────────────────────── */}
      {inactive.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Inactive / Churned</h2>
          <Card>
            <div className="divide-y divide-gray-50">
              {inactive.map((c) => (
                <Link
                  key={c.id}
                  href={`/admin/companies/${c.id}`}
                  className="flex items-center justify-between px-5 py-3 hover:bg-gray-50 transition-colors"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-700 truncate">{c.name}</p>
                    <p className="text-xs text-gray-400 mt-0.5">Signed up {formatDate(c.createdAt)}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${PLANS[c.plan as PlanId]?.badge ?? "bg-gray-100 text-gray-600"}`}>
                      {PLANS[c.plan as PlanId]?.label ?? c.plan}
                    </span>
                    {c.stripeSubStatus && (
                      <span className="text-xs text-gray-400">{c.stripeSubStatus}</span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
