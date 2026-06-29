import { db } from "@/lib/db"
import { requireSession } from "@/lib/session"
import Link from "next/link"
import { ChevronLeft, TrendingDown, TrendingUp, Minus, DollarSign, Users, AlertTriangle } from "lucide-react"
import { formatCurrency } from "@/lib/utils"
import Card, { CardHeader } from "@/components/ui/Card"

export const dynamic = "force-dynamic"

export const metadata = { title: "Customer Profitability — PoolOS" }

function MarginBadge({ pct }: { pct: number }) {
  if (pct < 0)
    return <span className="inline-flex items-center gap-1 text-xs font-medium text-red-700 bg-red-50 border border-red-200 rounded-full px-2 py-0.5"><TrendingDown className="w-3 h-3" /> {pct.toFixed(0)}%</span>
  if (pct < 40)
    return <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-2 py-0.5"><AlertTriangle className="w-3 h-3" /> {pct.toFixed(0)}%</span>
  if (pct < 70)
    return <span className="inline-flex items-center gap-1 text-xs font-medium text-gray-600 bg-gray-100 border border-gray-200 rounded-full px-2 py-0.5"><Minus className="w-3 h-3" /> {pct.toFixed(0)}%</span>
  return <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-2 py-0.5"><TrendingUp className="w-3 h-3" /> {pct.toFixed(0)}%</span>
}

export default async function ProfitabilityPage() {
  const { companyId } = await requireSession()

  const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)

  const customers = await db.customer.findMany({
    where: { companyId, status: "active", monthlyRate: { not: null } },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      monthlyRate: true,
      routeStops: {
        take: 1,
        select: { route: { select: { name: true } } },
      },
      serviceVisits: {
        where: { visitedAt: { gte: ninetyDaysAgo } },
        select: {
          chemicalUsages: { select: { totalCost: true } },
        },
      },
    },
  })

  type Row = {
    id: string
    name: string
    route: string | null
    monthlyRate: number
    visitsPer90: number
    avgMonthlyVisits: number
    avgMonthlyChemCost: number
    netPerMonth: number
    marginPct: number
  }

  const rows: Row[] = customers.map((c) => {
    const visitsPer90 = c.serviceVisits.length
    const totalChemCost = c.serviceVisits.reduce(
      (sum, v) => sum + v.chemicalUsages.reduce((s, u) => s + u.totalCost, 0),
      0,
    )
    const avgMonthlyChemCost = totalChemCost / 3
    const avgMonthlyVisits = visitsPer90 / 3
    const monthlyRate = c.monthlyRate!
    const netPerMonth = monthlyRate - avgMonthlyChemCost
    const marginPct = monthlyRate > 0 ? (netPerMonth / monthlyRate) * 100 : 0
    return {
      id: c.id,
      name: `${c.firstName} ${c.lastName}`,
      route: c.routeStops[0]?.route?.name ?? null,
      monthlyRate,
      visitsPer90,
      avgMonthlyVisits,
      avgMonthlyChemCost,
      netPerMonth,
      marginPct,
    }
  }).sort((a, b) => a.netPerMonth - b.netPerMonth)

  const totalMRR = rows.reduce((s, r) => s + r.monthlyRate, 0)
  const totalAvgChemPerMonth = rows.reduce((s, r) => s + r.avgMonthlyChemCost, 0)
  const netMRR = totalMRR - totalAvgChemPerMonth
  const atRisk = rows.filter((r) => r.marginPct < 40).length
  const noVisits = rows.filter((r) => r.visitsPer90 === 0).length

  return (
    <div className="space-y-6">
      <div>
        <Link href="/reports" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900 mb-3">
          <ChevronLeft className="w-4 h-4" /> Reports
        </Link>
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Customer Profitability</h1>
            <p className="text-sm text-gray-500 mt-1">
              {rows.length} rated customers · based on last 90 days of chemical costs
            </p>
          </div>
          <Link
            href="/customers/price-increase"
            className="inline-flex items-center gap-2 bg-sky-600 hover:bg-sky-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
          >
            <DollarSign className="w-4 h-4" /> Price Increase Wizard
          </Link>
        </div>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total MRR",         value: formatCurrency(totalMRR),            icon: DollarSign, color: "text-sky-600"    },
          { label: "Avg chem cost/mo",  value: formatCurrency(totalAvgChemPerMonth), icon: DollarSign, color: "text-purple-600" },
          { label: "Net MRR (est.)",    value: formatCurrency(netMRR),              icon: TrendingUp,  color: "text-emerald-600" },
          { label: "At risk (<40% margin)", value: atRisk,                          icon: AlertTriangle, color: "text-red-600"  },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-200 px-4 py-3">
            <div className="flex items-center gap-2 mb-1">
              <Icon className={`w-3.5 h-3.5 ${color}`} />
              <span className="text-xs text-gray-500">{label}</span>
            </div>
            <p className="text-xl font-bold text-gray-900">{value}</p>
          </div>
        ))}
      </div>

      {noVisits > 0 && (
        <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800">
          <strong>{noVisits} customer{noVisits !== 1 ? "s" : ""}</strong> with a monthly rate have no visits in the last 90 days — chemical costs show as $0.
        </div>
      )}

      <Card>
        <CardHeader>
          <h2 className="font-semibold text-gray-900 text-sm">All Rated Customers</h2>
          <p className="text-xs text-gray-400">Sorted by least profitable first · margin = (rate − avg chem cost) ÷ rate</p>
        </CardHeader>

        {/* Mobile cards */}
        <div className="sm:hidden divide-y divide-gray-50">
          {rows.map((r) => (
            <div key={r.id} className="px-5 py-4">
              <div className="flex items-center justify-between gap-3 mb-1.5">
                <Link href={`/customers/${r.id}`} className="font-medium text-gray-900 text-sm hover:text-sky-600">{r.name}</Link>
                <MarginBadge pct={r.marginPct} />
              </div>
              {r.route && <p className="text-xs text-gray-400 mb-2">{r.route}</p>}
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div><p className="text-gray-400">Rate/mo</p><p className="font-medium text-gray-700">{formatCurrency(r.monthlyRate)}</p></div>
                <div><p className="text-gray-400">Chem/mo</p><p className="font-medium text-gray-700">{formatCurrency(r.avgMonthlyChemCost)}</p></div>
                <div><p className="text-gray-400">Net/mo</p><p className={`font-semibold ${r.netPerMonth < 0 ? "text-red-600" : "text-emerald-600"}`}>{formatCurrency(r.netPerMonth)}</p></div>
              </div>
            </div>
          ))}
        </div>

        {/* Desktop table */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-xs text-gray-500 uppercase tracking-wide">
                <th className="px-5 py-3 text-left font-medium">Customer</th>
                <th className="px-5 py-3 text-left font-medium">Route</th>
                <th className="px-5 py-3 text-right font-medium">Rate/mo</th>
                <th className="px-5 py-3 text-right font-medium">Avg chem/mo</th>
                <th className="px-5 py-3 text-right font-medium">Visits/mo</th>
                <th className="px-5 py-3 text-right font-medium">Net/mo</th>
                <th className="px-5 py-3 text-center font-medium">Margin</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {rows.map((r) => (
                <tr key={r.id} className={`hover:bg-gray-50 ${r.marginPct < 0 ? "bg-red-50/40" : r.marginPct < 40 ? "bg-amber-50/30" : ""}`}>
                  <td className="px-5 py-3">
                    <Link href={`/customers/${r.id}`} className="font-medium text-gray-900 hover:text-sky-600">{r.name}</Link>
                  </td>
                  <td className="px-5 py-3 text-gray-500">{r.route ?? <span className="text-gray-300">—</span>}</td>
                  <td className="px-5 py-3 text-right text-gray-700">{formatCurrency(r.monthlyRate)}</td>
                  <td className="px-5 py-3 text-right text-gray-700">{formatCurrency(r.avgMonthlyChemCost)}</td>
                  <td className="px-5 py-3 text-right text-gray-500">{r.avgMonthlyVisits.toFixed(1)}</td>
                  <td className={`px-5 py-3 text-right font-semibold ${r.netPerMonth < 0 ? "text-red-600" : "text-emerald-600"}`}>
                    {formatCurrency(r.netPerMonth)}
                  </td>
                  <td className="px-5 py-3 text-center">
                    <MarginBadge pct={r.marginPct} />
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="border-t-2 border-gray-200 bg-gray-50">
              <tr className="text-sm font-semibold">
                <td className="px-5 py-3 text-gray-700" colSpan={2}>Totals</td>
                <td className="px-5 py-3 text-right text-gray-700">{formatCurrency(totalMRR)}</td>
                <td className="px-5 py-3 text-right text-gray-700">{formatCurrency(totalAvgChemPerMonth)}</td>
                <td className="px-5 py-3" />
                <td className={`px-5 py-3 text-right ${netMRR < 0 ? "text-red-600" : "text-emerald-600"}`}>{formatCurrency(netMRR)}</td>
                <td className="px-5 py-3 text-center">
                  <MarginBadge pct={totalMRR > 0 ? (netMRR / totalMRR) * 100 : 0} />
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {rows.length === 0 && (
          <div className="text-center py-16 text-gray-400">
            <Users className="w-8 h-8 mx-auto mb-3 opacity-40" />
            <p className="text-sm">No active customers with a monthly rate set.</p>
            <p className="text-xs mt-1">Add a monthly rate on each customer profile to see profitability data.</p>
          </div>
        )}
      </Card>
    </div>
  )
}
