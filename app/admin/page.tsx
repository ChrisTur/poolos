import { db } from "@/lib/db"
import Card, { CardHeader, CardBody } from "@/components/ui/Card"
import { Building2, Users, FileText, Activity, ChevronRight, CheckCircle2, AlertTriangle, Settings, ListChecks, Zap, BookOpen, Gift } from "lucide-react"
import Link from "next/link"
import { formatDate } from "@/lib/utils"

export const dynamic = "force-dynamic"

export default async function AdminOverviewPage() {
  const [companyCount, userCount, customerCount, invoiceCount, recentCompanies, activeSubscriptions] = await Promise.all([
    db.company.count(),
    db.user.count(),
    db.customer.count(),
    db.invoice.count(),
    db.company.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
      include: { _count: { select: { users: true, customers: true } } },
    }),
    db.company.findMany({
      where: { stripeSubStatus: "active" },
      select: { plan: true },
    }),
  ])

  // MRR from active subscriptions
  const MRR_BY_PLAN: Record<string, number> = { starter: 49, pro: 99, unlimited: 199 }
  const mrr = activeSubscriptions.reduce((sum, c) => sum + (MRR_BY_PLAN[c.plan] ?? 0), 0)

  const healthChecks = [
    {
      label: "Resend API key",
      ok: !!process.env.RESEND_API_KEY,
      okNote: "Configured",
      failNote: "Set RESEND_API_KEY in environment variables",
    },
    {
      label: "Email FROM address",
      ok: !!process.env.EMAIL_FROM,
      okNote: process.env.EMAIL_FROM ?? "Using default billing@poolos.biz",
      failNote: "Set EMAIL_FROM=PoolOS <billing@poolos.biz> in environment variables",
    },
    {
      label: "App URL",
      ok: !!process.env.NEXT_PUBLIC_APP_URL,
      okNote: process.env.NEXT_PUBLIC_APP_URL ?? "",
      failNote: "Set NEXT_PUBLIC_APP_URL in environment variables",
    },
    {
      label: "DNS / SPF · DKIM · DMARC",
      ok: false,
      okNote: "Verified in Resend dashboard",
      failNote: "Verify poolos.biz domain in Resend → Domains and add the provided DNS records",
    },
  ]

  const stats = [
    { label: "Companies", value: companyCount, icon: Building2, color: "text-sky-600", bg: "bg-sky-50" },
    { label: "Users", value: userCount, icon: Users, color: "text-indigo-600", bg: "bg-indigo-50" },
    { label: "Customers", value: customerCount, icon: Activity, color: "text-green-600", bg: "bg-green-50" },
    { label: "MRR", value: `$${mrr}`, icon: FileText, color: "text-emerald-600", bg: "bg-emerald-50" },
  ]

  return (
    <div className="space-y-5 sm:space-y-6">
      <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Admin Overview</h1>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {stats.map(({ label, value, icon: Icon, color, bg }) => (
          <Card key={label} className="p-3 sm:p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-gray-500 font-medium">{label}</p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900 mt-1">{value}</p>
              </div>
              <span className={`${bg} ${color} p-1.5 sm:p-2 rounded-lg shrink-0`}>
                <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
              </span>
            </div>
          </Card>
        ))}
      </div>

      {/* Platform health */}
      <Card>
        <CardHeader>
          <h2 className="font-semibold text-gray-900 text-sm sm:text-base">Platform Health</h2>
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
                  {check.ok ? check.okNote : check.failNote}
                </p>
              </div>
            </div>
          ))}
        </CardBody>
      </Card>

      <Card>
        <div className="px-4 sm:px-5 py-3 sm:py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900 text-sm sm:text-base">Recent Companies</h2>
          <Link href="/admin/companies" className="text-xs text-sky-600 hover:underline">View all</Link>
        </div>

        {/* Mobile card list */}
        <div className="sm:hidden divide-y divide-gray-50">
          {recentCompanies.map((c) => (
            <Link key={c.id} href={`/admin/companies/${c.id}`}
              className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 active:bg-gray-100">
              <div className="min-w-0">
                <p className="font-medium text-gray-900 text-sm truncate">{c.name}</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {c._count.users} users · {c._count.customers} customers · {formatDate(c.createdAt)}
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

        {/* Desktop table */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-xs text-gray-500 uppercase tracking-wide">
                <th className="px-5 py-3 text-left font-medium">Company</th>
                <th className="px-5 py-3 text-left font-medium">Users</th>
                <th className="px-5 py-3 text-left font-medium">Customers</th>
                <th className="px-5 py-3 text-left font-medium">Joined</th>
                <th className="px-5 py-3 text-left font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {recentCompanies.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50">
                  <td className="px-5 py-3">
                    <Link href={`/admin/companies/${c.id}`} className="font-medium text-gray-900 hover:text-sky-600">
                      {c.name}
                    </Link>
                    <p className="text-xs text-gray-400">{c.slug}</p>
                  </td>
                  <td className="px-5 py-3 text-gray-600">{c._count.users}</td>
                  <td className="px-5 py-3 text-gray-600">{c._count.customers}</td>
                  <td className="px-5 py-3 text-gray-500">{formatDate(c.createdAt)}</td>
                  <td className="px-5 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                      c.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"
                    }`}>
                      {c.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Marketing CMS */}
      <div>
        <h2 className="font-semibold text-gray-900 text-sm sm:text-base mb-3">Marketing CMS</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {[
            { href: "/admin/site-config", icon: Settings,    label: "Site Config",  desc: "Hero video & waitlist CTA",   color: "text-gray-600",   bg: "bg-gray-50"   },
            { href: "/admin/waitlist",    icon: ListChecks,  label: "Waitlist",     desc: "View & manage waitlist entries", color: "text-sky-600",   bg: "bg-sky-50"    },
            { href: "/admin/features",    icon: Zap,         label: "Features",     desc: "Feature cards on /features",  color: "text-amber-600",  bg: "bg-amber-50"  },
            { href: "/admin/blog",        icon: BookOpen,    label: "Blog",         desc: "Publish posts to /blog",      color: "text-indigo-600", bg: "bg-indigo-50" },
            { href: "/admin/referrals",   icon: Gift,        label: "Referrals",    desc: "Referral codes & tracking",   color: "text-green-600",  bg: "bg-green-50"  },
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
