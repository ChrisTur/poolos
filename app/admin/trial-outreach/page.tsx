import { db } from "@/lib/db"
import Card, { CardHeader } from "@/components/ui/Card"
import { formatDate } from "@/lib/utils"
import { Mail, Users, Calendar, TrendingUp } from "lucide-react"
import SendTrialEmailButton from "./SendTrialEmailButton"

export const dynamic = "force-dynamic"

function daysLeft(trialEndsAt: Date | null): number | null {
  if (!trialEndsAt) return null
  return Math.ceil((trialEndsAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
}

function TrialBadge({ days }: { days: number | null }) {
  if (days === null) return <span className="text-xs text-gray-400">No expiry set</span>
  if (days < 0) return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">Expired {Math.abs(days)}d ago</span>
  if (days === 0) return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">Expires today</span>
  if (days <= 3) return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">{days}d left</span>
  if (days <= 7) return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">{days}d left</span>
  return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">{days}d left</span>
}

export default async function TrialOutreachPage() {
  const companies = await db.company.findMany({
    where: { plan: "trial", isActive: true },
    include: {
      users: { where: { role: "owner" }, take: 1, select: { firstName: true, lastName: true, email: true } },
      _count: { select: { customers: true } },
    },
    orderBy: { trialEndsAt: "asc" },
  })

  // Fetch visit counts per company via customers (ServiceVisit has no direct companyId)
  const visitCounts = await db.serviceVisit.groupBy({
    by: ["customerId"],
    _count: { id: true },
    where: { customer: { companyId: { in: companies.map((c) => c.id) } } },
  })

  // Map customerId → companyId so we can sum per company
  const customerCompanyMap = await db.customer.findMany({
    where: { companyId: { in: companies.map((c) => c.id) } },
    select: { id: true, companyId: true },
  })
  const custToCompany = Object.fromEntries(customerCompanyMap.map((c) => [c.id, c.companyId]))

  const visitsByCompany: Record<string, number> = {}
  for (const row of visitCounts) {
    const cid = custToCompany[row.customerId]
    if (cid) visitsByCompany[cid] = (visitsByCompany[cid] ?? 0) + row._count.id
  }

  const urgentCount = companies.filter((c) => {
    const d = daysLeft(c.trialEndsAt)
    return d !== null && d <= 3
  }).length

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Trial Outreach</h1>
        <p className="text-sm text-gray-500 mt-1">
          {companies.length} active trial {companies.length === 1 ? "company" : "companies"}
          {urgentCount > 0 && (
            <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
              {urgentCount} expiring within 3 days
            </span>
          )}
        </p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Trial companies",   value: companies.length,                                                  icon: Users },
          { label: "Expiring ≤ 3 days", value: urgentCount,                                                       icon: Calendar },
          { label: "Total customers",   value: companies.reduce((s, c) => s + c._count.customers, 0),            icon: TrendingUp },
          { label: "Total visits",      value: Object.values(visitsByCompany).reduce((s, v) => s + v, 0),        icon: Mail },
        ].map(({ label, value, icon: Icon }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-200 px-4 py-3">
            <div className="flex items-center gap-2 mb-1">
              <Icon className="w-3.5 h-3.5 text-gray-400" />
              <span className="text-xs text-gray-500">{label}</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
          </div>
        ))}
      </div>

      {companies.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <Mail className="w-8 h-8 mx-auto mb-3 opacity-50" />
          <p className="text-sm">No active trial companies right now.</p>
        </div>
      ) : (
        <Card>
          <CardHeader>
            <h2 className="font-semibold text-gray-900 text-sm">Active Trials</h2>
            <p className="text-xs text-gray-400">Sorted by trial expiry (soonest first)</p>
          </CardHeader>

          {/* Mobile cards */}
          <div className="sm:hidden divide-y divide-gray-50">
            {companies.map((c) => {
              const owner = c.users[0]
              const days = daysLeft(c.trialEndsAt)
              const visits = visitsByCompany[c.id] ?? 0
              return (
                <div key={c.id} className="px-5 py-4 space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-gray-900 text-sm">{c.name}</p>
                      {owner && (
                        <p className="text-xs text-gray-500 mt-0.5">
                          {owner.firstName} {owner.lastName} · {owner.email}
                        </p>
                      )}
                    </div>
                    <TrialBadge days={days} />
                  </div>
                  <div className="flex items-center gap-4 text-xs text-gray-400">
                    <span>{c._count.customers} customers</span>
                    <span>{visits} visits</span>
                    {c.trialEndsAt && <span>Ends {formatDate(c.trialEndsAt)}</span>}
                  </div>
                  <SendTrialEmailButton companyId={c.id} />
                </div>
              )
            })}
          </div>

          {/* Desktop table */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-xs text-gray-500 uppercase tracking-wide">
                  <th className="px-5 py-3 text-left font-medium">Company</th>
                  <th className="px-5 py-3 text-left font-medium">Owner</th>
                  <th className="px-5 py-3 text-center font-medium">Trial</th>
                  <th className="px-5 py-3 text-center font-medium">Customers</th>
                  <th className="px-5 py-3 text-center font-medium">Visits</th>
                  <th className="px-5 py-3 text-left font-medium">Joined</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {companies.map((c) => {
                  const owner = c.users[0]
                  const days = daysLeft(c.trialEndsAt)
                  const visits = visitsByCompany[c.id] ?? 0
                  return (
                    <tr key={c.id} className="hover:bg-gray-50">
                      <td className="px-5 py-3">
                        <p className="font-medium text-gray-900">{c.name}</p>
                        <p className="text-xs text-gray-400">{c.slug}</p>
                      </td>
                      <td className="px-5 py-3">
                        {owner ? (
                          <>
                            <p className="text-gray-700">{owner.firstName} {owner.lastName}</p>
                            <p className="text-xs text-gray-400">{owner.email}</p>
                          </>
                        ) : (
                          <span className="text-xs text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-5 py-3 text-center">
                        <TrialBadge days={days} />
                        {c.trialEndsAt && (
                          <p className="text-xs text-gray-400 mt-0.5">{formatDate(c.trialEndsAt)}</p>
                        )}
                      </td>
                      <td className="px-5 py-3 text-center text-gray-600">{c._count.customers}</td>
                      <td className="px-5 py-3 text-center text-gray-600">{visits}</td>
                      <td className="px-5 py-3 text-gray-500 text-sm">{formatDate(c.createdAt)}</td>
                      <td className="px-5 py-3 text-right">
                        <SendTrialEmailButton companyId={c.id} />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Email preview note */}
      <div className="rounded-lg bg-sky-50 border border-sky-200 px-4 py-3 text-sm text-sky-800">
        <strong>Email preview:</strong> The email comes from <code className="font-mono bg-sky-100 px-1 rounded text-xs">Chris at PoolOS &lt;billing@poolos.biz&gt;</code>, personalizes with the owner's first name, company name, customer count, visit count, and days remaining. Subject line adjusts automatically based on urgency.
      </div>
    </div>
  )
}
