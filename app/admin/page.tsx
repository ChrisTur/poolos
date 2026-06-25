import { db } from "@/lib/db"
import Card, { CardHeader, CardBody } from "@/components/ui/Card"
import {
  Building2, Users, TrendingUp, DollarSign, CreditCard, Activity,
  ChevronRight, CheckCircle2, AlertTriangle, Settings, ListChecks,
  Zap, BookOpen, Gift, UserPlus, AlertCircle,
} from "lucide-react"
import Link from "next/link"
import { formatDate, formatCurrency } from "@/lib/utils"
import { PLANS } from "@/lib/plans"

export const dynamic = "force-dynamic"

export default async function AdminOverviewPage() {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
  const sevenDaysAgo  = new Date(Date.now() -  7 * 24 * 60 * 60 * 1000)

  const [
    allCompanies,
    newLast30d,
    newLast7d,
    totalCustomers,
    stripe30dPayments,
    recentCompanies,
  ] = await Promise.all([
    db.company.findMany({
      select: { plan: true, isActive: true, stripeSubStatus: true },
    }),
    db.company.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
    db.company.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
    db.customer.count(),
    db.payment.aggregate({
      where: { method: "card", createdAt: { gte: thirtyDaysAgo } },
      _sum: { amount: true },
    }),
    db.company.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
      include: { _count: { select: { customers: true } } },
    }),
  ])

  // ── PoolOS platform metrics ───────────────────────────────────────────────

  const activeCompanies = allCompanies.filter((c) => c.isActive)

  // MRR from companies confirmed active on Stripe
  const stripeMrr = allCompanies
    .filter((c) => c.stripeSubStatus === "active")
    .reduce((s, c) => s + (PLANS[c.plan as keyof typeof PLANS]?.priceMonthly ?? 0), 0)

  // MRR from all non-trial active companies (plan-assigned, whether billed yet or not)
  const planMrr = activeCompanies
    .filter((c) => c.plan !== "trial")
    .reduce((s, c) => s + (PLANS[c.plan as keyof typeof PLANS]?.priceMonthly ?? 0), 0)

  const trialCount    = activeCompanies.filter((c) => c.plan === "trial").length
  const pastDueCount  = allCompanies.filter((c) => c.stripeSubStatus === "past_due").length
  const inactiveCount = allCompanies.filter((c) => !c.isActive).length

  const stripe30dVolume = stripe30dPayments._sum.amount ?? 0

  // Plan distribution (active companies only)
  const planCounts = (["trial", "starter", "pro", "unlimited"] as const).map((id) => ({
    id,
    plan: PLANS[id],
    count: activeCompanies.filter((c) => c.plan === id).length,
  }))

  const healthChecks = [
    {
      label: "Resend API key",
      ok: !!process.env.RESEND_API_KEY,
      note: process.env.RESEND_API_KEY ? "Configured" : "Set RESEND_API_KEY in environment variables",
    },
    {
      label: "App URL",
      ok: !!process.env.NEXT_PUBLIC_APP_URL,
      note: process.env.NEXT_PUBLIC_APP_URL ?? "Set NEXT_PUBLIC_APP_URL in environment variables",
    },
    {
      label: "Email FROM",
      ok: !!process.env.EMAIL_FROM,
      note: process.env.EMAIL_FROM ?? "Set EMAIL_FROM in environment variables",
    },
    {
      label: "DNS / SPF · DKIM · DMARC",
      ok: false,
      note: "Verify poolos.biz in Resend → Domains and add the provided DNS records",
    },
  ]

  return (
    <div className="space-y-6">
      <h1 className="text-xl sm:text-2xl font-bold text-gray-900">PoolOS Overview</h1>

      {/* ── Primary KPIs ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          {
            label: "Stripe MRR",
            value: formatCurrency(stripeMrr),
            sub: "confirmed active subscriptions",
            icon: DollarSign,
            color: "text-emerald-600 bg-emerald-50",
          },
          {
            label: "Plan MRR",
            value: formatCurrency(planMrr),
            sub: stripeMrr < planMrr ? `$${planMrr - stripeMrr} unbilled` : "fully billed",
            subColor: stripeMrr < planMrr ? "text-amber-500" : "text-gray-400",
            icon: TrendingUp,
            color: "text-sky-600 bg-sky-50",
          },
          {
            label: "Active companies",
            value: activeCompanies.length,
            sub: `${trialCount} on trial`,
            icon: Building2,
            color: "text-indigo-600 bg-indigo-50",
          },
          {
            label: "Stripe volume (30d)",
            value: formatCurrency(stripe30dVolume),
            sub: "card payments processed",
            icon: CreditCard,
            color: "text-purple-600 bg-purple-50",
          },
        ].map((kpi) => (
          <div key={kpi.label} className="bg-white rounded-xl border border-gray-200 px-4 py-3.5">
            <div className="flex items-start justify-between gap-2 mb-1">
              <p className="text-xs text-gray-500 font-medium">{kpi.label}</p>
              <span className={`p-1.5 rounded-lg shrink-0 ${kpi.color}`}>
                <kpi.icon className="w-3.5 h-3.5" />
              </span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{kpi.value}</p>
            <p className={`text-xs mt-0.5 ${(kpi as { subColor?: string }).subColor ?? "text-gray-400"}`}>
              {kpi.sub}
            </p>
          </div>
        ))}
      </div>

      {/* ── Secondary KPIs ────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          {
            label: "New (7d)",
            value: newLast7d,
            icon: UserPlus,
            color: "text-green-600 bg-green-50",
          },
          {
            label: "New (30d)",
            value: newLast30d,
            icon: UserPlus,
            color: "text-green-600 bg-green-50",
          },
          {
            label: "Customers managed",
            value: totalCustomers.toLocaleString(),
            icon: Users,
            color: "text-sky-600 bg-sky-50",
          },
          {
            label: "At risk",
            value: pastDueCount + inactiveCount,
            sub: `${pastDueCount} past due · ${inactiveCount} inactive`,
            icon: AlertCircle,
            color: pastDueCount > 0 ? "text-red-600 bg-red-50" : "text-gray-400 bg-gray-50",
          },
        ].map((kpi) => (
          <div key={kpi.label} className="bg-white rounded-xl border border-gray-200 px-4 py-3">
            <div className="flex items-center gap-2 mb-1">
              <span className={`p-1.5 rounded-lg shrink-0 ${kpi.color}`}>
                <kpi.icon className="w-3.5 h-3.5" />
              </span>
              <p className="text-xs text-gray-500">{kpi.label}</p>
            </div>
            <p className="text-xl font-bold text-gray-900">{kpi.value}</p>
            {(kpi as { sub?: string }).sub && (
              <p className="text-xs text-gray-400 mt-0.5">{(kpi as { sub?: string }).sub}</p>
            )}
          </div>
        ))}
      </div>

      {/* ── Plan distribution ─────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <h2 className="font-semibold text-gray-900 text-sm">Plan Distribution</h2>
          <p className="text-xs text-gray-400">Active companies only</p>
        </CardHeader>
        <CardBody className="!p-0">
          <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-y sm:divide-y-0 divide-gray-100">
            {planCounts.map(({ id, plan, count }) => {
              const value = plan.priceMonthly ? plan.priceMonthly * count : 0
              return (
                <div key={id} className="px-5 py-4">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${plan.badge} mb-2`}>
                    {plan.label}
                  </span>
                  <p className="text-2xl font-bold text-gray-900">{count}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {value > 0 ? `${formatCurrency(value)}/mo` : "Free"}
                  </p>
                </div>
              )
            })}
          </div>
        </CardBody>
      </Card>

      {/* ── Recent signups + health in a 2-col layout ─────────────────── */}
      <div className="grid lg:grid-cols-2 gap-5">
        {/* Recent companies */}
        <Card>
          <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900 text-sm">Recent Signups</h2>
            <Link href="/admin/companies" className="text-xs text-sky-600 hover:underline">Manage all</Link>
          </div>
          <div className="divide-y divide-gray-50">
            {recentCompanies.map((c) => (
              <Link
                key={c.id}
                href={`/admin/companies/${c.id}`}
                className="flex items-center justify-between px-5 py-3 hover:bg-gray-50 transition-colors"
              >
                <div className="min-w-0">
                  <p className="font-medium text-gray-900 text-sm truncate">{c.name}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {c._count.customers} customers · {formatDate(c.createdAt)}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    c.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"
                  }`}>{c.isActive ? "Active" : "Inactive"}</span>
                  <ChevronRight className="w-4 h-4 text-gray-300" />
                </div>
              </Link>
            ))}
          </div>
        </Card>

        {/* Platform health */}
        <Card>
          <CardHeader>
            <h2 className="font-semibold text-gray-900 text-sm">Platform Health</h2>
          </CardHeader>
          <CardBody className="divide-y divide-gray-50 !p-0">
            {healthChecks.map((check) => (
              <div key={check.label} className="flex items-center gap-3 px-4 sm:px-5 py-3">
                {check.ok
                  ? <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                  : <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">{check.label}</p>
                  <p className={`text-xs mt-0.5 truncate ${check.ok ? "text-gray-400" : "text-amber-600"}`}>
                    {check.note}
                  </p>
                </div>
              </div>
            ))}
          </CardBody>
        </Card>
      </div>

      {/* ── Marketing CMS links ───────────────────────────────────────── */}
      <div>
        <h2 className="font-semibold text-gray-900 text-sm sm:text-base mb-3">Marketing CMS</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {[
            { href: "/admin/site-config", icon: Settings,   label: "Site Config", desc: "Hero video & waitlist CTA",      color: "text-gray-600",   bg: "bg-gray-50"   },
            { href: "/admin/waitlist",    icon: ListChecks, label: "Waitlist",    desc: "View & manage waitlist entries", color: "text-sky-600",   bg: "bg-sky-50"    },
            { href: "/admin/features",    icon: Zap,        label: "Features",    desc: "Feature cards on /features",    color: "text-amber-600", bg: "bg-amber-50"  },
            { href: "/admin/blog",        icon: BookOpen,   label: "Blog",        desc: "Publish posts to /blog",        color: "text-indigo-600",bg: "bg-indigo-50" },
            { href: "/admin/referrals",   icon: Gift,       label: "Referrals",   desc: "Referral codes & tracking",     color: "text-green-600", bg: "bg-green-50"  },
          ].map(({ href, icon: Icon, label, desc, color, bg }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-4 bg-white rounded-2xl border border-gray-200 p-4 hover:border-sky-200 hover:shadow-sm transition-all group"
            >
              <span className={`${bg} ${color} p-2.5 rounded-xl shrink-0`}>
                <Icon className="w-5 h-5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-gray-900 group-hover:text-sky-700">{label}</p>
                <p className="text-xs text-gray-400 truncate">{desc}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-300 shrink-0" />
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
