import { db } from "@/lib/db"
import { requireSession } from "@/lib/session"
import { notFound } from "next/navigation"
import Link from "next/link"
import { ChevronLeft } from "lucide-react"
import Card, { CardHeader, CardBody } from "@/components/ui/Card"
import { formatDate } from "@/lib/utils"
import { chemStatus, CHEM_RANGES, STATUS_BG, type ChemKey } from "@/lib/chemistry"
import ChemLineChart from "@/components/charts/ChemLineChart"

export const dynamic = "force-dynamic"

const PERIODS = [
  { key: "30d",  label: "30 days" },
  { key: "90d",  label: "90 days" },
  { key: "all",  label: "All time" },
]

function getPeriodStart(period: string): Date {
  if (period === "30d") return new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
  if (period === "90d") return new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
  return new Date(0)
}

export default async function CustomerChemicalPage({
  params,
  searchParams,
}: {
  params: Promise<{ customerId: string }>
  searchParams: Promise<{ period?: string }>
}) {
  const { companyId } = await requireSession()
  const { customerId } = await params
  const { period = "90d" } = await searchParams
  const periodStart = getPeriodStart(period)

  const customer = await db.customer.findFirst({
    where: { id: customerId, companyId },
    include: {
      serviceVisits: {
        where: {
          visitedAt: { gte: periodStart },
          OR: [
            { chlorine: { not: null } },
            { ph: { not: null } },
            { alkalinity: { not: null } },
            { calcium: { not: null } },
          ],
        },
        orderBy: { visitedAt: "asc" },
      },
    },
  })

  if (!customer) notFound()

  const visits = customer.serviceVisits
  const chemKeys: ChemKey[] = ["chlorine", "ph", "alkalinity", "calcium"]

  // Latest readings summary
  const latest = visits[visits.length - 1] ?? null

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <Link href="/reports" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900 mb-3">
          <ChevronLeft className="w-4 h-4" /> Reports
        </Link>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
              {customer.firstName} {customer.lastName}
            </h1>
            <p className="text-sm text-gray-500 mt-1">Chemical readings — {customer.address}, {customer.city}</p>
          </div>
          <Link href={`/customers/${customerId}`} className="text-sm text-sky-600 hover:underline">
            View customer
          </Link>
        </div>

        {/* Period selector */}
        <div className="flex gap-1 mt-3">
          {PERIODS.map((p) => (
            <Link
              key={p.key}
              href={`/reports/chemicals/${customerId}?period=${p.key}`}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                period === p.key ? "bg-sky-600 text-white" : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              {p.label}
            </Link>
          ))}
        </div>
      </div>

      {/* Latest reading summary cards */}
      {latest && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {chemKeys.map((k) => {
            const val = latest[k] ?? null
            const s = chemStatus(k, val)
            const range = CHEM_RANGES[k]
            return (
              <Card key={k} className="p-3 sm:p-4">
                <p className="text-xs text-gray-500 font-medium">{range.label}</p>
                {val == null ? (
                  <p className="text-xl font-bold text-gray-300 mt-1">—</p>
                ) : (
                  <>
                    <p className="text-xl font-bold text-gray-900 mt-1">
                      {val}
                      {range.unit && <span className="text-sm font-normal text-gray-400 ml-1">{range.unit}</span>}
                    </p>
                    <span className={`inline-flex mt-1.5 rounded-full border px-2 py-0.5 text-xs font-medium ${s ? STATUS_BG[s] : "bg-gray-50 text-gray-500 border-gray-200"}`}>
                      {s === "ok" ? "In range" : s === "low" ? "Low ▼" : "High ▲"}
                    </span>
                  </>
                )}
                <p className="text-xs text-gray-400 mt-1">Normal: {range.low}–{range.high}{range.unit ? ` ${range.unit}` : ""}</p>
              </Card>
            )
          })}
        </div>
      )}

      {visits.length === 0 ? (
        <Card>
          <CardBody>
            <div className="py-12 text-center">
              <p className="text-gray-400 text-sm">No chemical readings in this period.</p>
              <Link
                href={`/reports/chemicals/${customerId}?period=all`}
                className="mt-2 inline-block text-sm text-sky-600 hover:underline"
              >
                View all time
              </Link>
            </div>
          </CardBody>
        </Card>
      ) : (
        <>
          {/* Trend charts — 2 per row */}
          <div className="grid sm:grid-cols-2 gap-5">
            {chemKeys.map((k) => {
              const data = visits
                .filter((v) => v[k] != null)
                .map((v) => ({ date: v.visitedAt, value: v[k] as number }))
              return (
                <Card key={k} className="p-4">
                  <ChemLineChart data={data} chemKey={k} />
                </Card>
              )
            })}
          </div>

          {/* Reading history table */}
          <Card>
            <CardHeader><h2 className="font-semibold text-gray-900 text-sm">Reading History</h2></CardHeader>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 text-xs text-gray-500 uppercase tracking-wide">
                    <th className="px-5 py-3 text-left font-medium">Date</th>
                    {chemKeys.map((k) => (
                      <th key={k} className="px-3 py-3 text-center font-medium">{CHEM_RANGES[k].label}</th>
                    ))}
                    <th className="px-5 py-3 text-left font-medium hidden sm:table-cell">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {[...visits].reverse().map((v) => (
                    <tr key={v.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-3 text-gray-600 whitespace-nowrap">{formatDate(v.visitedAt)}</td>
                      {chemKeys.map((k) => {
                        const val = v[k] ?? null
                        const s = chemStatus(k, val)
                        return (
                          <td key={k} className="px-3 py-3 text-center">
                            {val == null ? (
                              <span className="text-gray-300 text-xs">—</span>
                            ) : (
                              <span className={`inline-flex items-center justify-center rounded-full border px-2 py-0.5 text-xs font-medium ${s ? STATUS_BG[s] : "bg-gray-50 text-gray-500 border-gray-200"}`}>
                                {val}
                                {s === "low" && " ▼"}
                                {s === "high" && " ▲"}
                              </span>
                            )}
                          </td>
                        )
                      })}
                      <td className="px-5 py-3 text-xs text-gray-400 hidden sm:table-cell max-w-[200px] truncate">
                        {v.notes || "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}
    </div>
  )
}
