import { db } from "@/lib/db"
import { requireSession } from "@/lib/session"
import Link from "next/link"
import { Plus, ChevronRight, ChevronLeft, FileEdit, LayoutTemplate, Search } from "lucide-react"
import Card from "@/components/ui/Card"
import Button from "@/components/ui/Button"
import { formatCurrency, formatDate } from "@/lib/utils"

export const dynamic = "force-dynamic"

const PAGE_SIZE = 50

const STATUS_COLORS: Record<string, string> = {
  draft:     "bg-gray-100 text-gray-600",
  sent:      "bg-sky-50 text-sky-700",
  accepted:  "bg-green-50 text-green-700",
  declined:  "bg-red-50 text-red-600",
  converted: "bg-purple-50 text-purple-700",
}

const STATUS_TABS = [
  { key: "all",       label: "All" },
  { key: "draft",     label: "Draft" },
  { key: "sent",      label: "Sent" },
  { key: "accepted",  label: "Accepted" },
  { key: "declined",  label: "Declined" },
  { key: "converted", label: "Converted" },
]

function buildUrl(params: Record<string, string | undefined>) {
  const p = new URLSearchParams()
  for (const [k, v] of Object.entries(params)) {
    if (v) p.set(k, v)
  }
  return `/estimates?${p.toString()}`
}

export default async function EstimatesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string; page?: string }>
}) {
  const { companyId } = await requireSession()
  const { status, q, page: pageParam } = await searchParams

  const page = Math.max(1, parseInt(pageParam || "1") || 1)
  const skip = (page - 1) * PAGE_SIZE

  const customerFilter = q ? {
    customer: {
      OR: [
        { firstName: { contains: q, mode: "insensitive" as const } },
        { lastName: { contains: q, mode: "insensitive" as const } },
      ],
    },
  } : {}

  const baseWhere = {
    companyId,
    ...(status && status !== "all" ? { status } : {}),
    ...customerFilter,
  }

  const [estimates, filteredTotal, draftCount, sentCount, acceptedCount, declinedCount, convertedCount] = await Promise.all([
    db.estimate.findMany({
      where: baseWhere,
      orderBy: { createdAt: "desc" },
      include: { customer: true, items: true },
      take: PAGE_SIZE,
      skip,
    }),
    db.estimate.count({ where: baseWhere }),
    db.estimate.count({ where: { companyId, status: "draft" } }),
    db.estimate.count({ where: { companyId, status: "sent" } }),
    db.estimate.count({ where: { companyId, status: "accepted" } }),
    db.estimate.count({ where: { companyId, status: "declined" } }),
    db.estimate.count({ where: { companyId, status: "converted" } }),
  ])

  const counts: Record<string, number> = {
    all:       draftCount + sentCount + acceptedCount + declinedCount + convertedCount,
    draft:     draftCount,
    sent:      sentCount,
    accepted:  acceptedCount,
    declined:  declinedCount,
    converted: convertedCount,
  }

  const totalPages = Math.ceil(filteredTotal / PAGE_SIZE)

  return (
    <div className="space-y-4 sm:space-y-5">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Estimates</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {filteredTotal} {status && status !== "all" ? status : "total"}
            {totalPages > 1 && ` · page ${page} of ${totalPages}`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/estimates/templates">
            <Button size="sm" variant="secondary">
              <LayoutTemplate className="w-4 h-4" />
              <span className="hidden sm:inline">Templates</span>
            </Button>
          </Link>
          <Link href="/estimates/new">
            <Button size="sm" className="bg-amber-600 hover:bg-amber-700 focus:ring-amber-500">
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">New Estimate</span>
              <span className="sm:hidden">New</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Search */}
      <form method="GET" className="flex gap-2">
        {status && status !== "all" && <input type="hidden" name="status" value={status} />}
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <input
            name="q"
            defaultValue={q}
            placeholder="Search by customer…"
            className="w-full pl-9 pr-3 py-2 text-sm text-gray-900 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
        </div>
        <Button type="submit" size="sm" variant="secondary">Search</Button>
        {q && (
          <Link href={`/estimates${status && status !== "all" ? `?status=${status}` : ""}`}>
            <Button size="sm" variant="secondary">Clear</Button>
          </Link>
        )}
      </form>

      <div className="flex gap-1 overflow-x-auto pb-1 -mx-1 px-1">
        {STATUS_TABS.map((tab) => {
          const active = (status ?? "all") === tab.key
          return (
            <Link
              key={tab.key}
              href={buildUrl({ status: tab.key, q })}
              className={`flex-none px-3 py-2 sm:py-1.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                active ? "bg-amber-600 text-white" : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              {tab.label}
              <span className={`ml-1.5 text-xs ${active ? "text-amber-200" : "text-gray-400"}`}>
                {counts[tab.key]}
              </span>
            </Link>
          )
        })}
      </div>

      {/* Mobile list */}
      <div className="sm:hidden space-y-2">
        {estimates.length === 0 ? (
          <Card>
            <div className="py-12 text-center">
              <p className="text-gray-400 text-sm">No estimates found.</p>
              <Link href="/estimates/new" className="mt-3 inline-block text-sm text-amber-600 hover:underline">
                Create your first estimate
              </Link>
            </div>
          </Card>
        ) : (
          estimates.map((est) => {
            const total = est.items.reduce((s, i) => s + i.quantity * i.unitPrice, 0)
            return (
              <Link key={est.id} href={`/estimates/${est.id}`}>
                <Card className="p-4 flex items-center justify-between hover:bg-gray-50 active:bg-gray-100 transition-colors">
                  <div className="min-w-0">
                    <p className="font-medium text-gray-900 text-sm truncate">
                      {est.customer.firstName} {est.customer.lastName}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">{est.estimateNumber} · {formatDate(est.createdAt)}</p>
                    <span className={`mt-1.5 inline-block px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[est.status] ?? ""}`}>
                      {est.status}
                    </span>
                  </div>
                  <div className="text-right shrink-0 ml-3">
                    <p className="text-sm font-semibold text-gray-900">{formatCurrency(total)}</p>
                    <ChevronRight className="w-4 h-4 text-gray-300 mt-1 ml-auto" />
                  </div>
                </Card>
              </Link>
            )
          })
        )}
      </div>

      {/* Desktop table */}
      <Card className="hidden sm:block">
        {estimates.length === 0 ? (
          <div className="py-16 text-center">
            <FileEdit className="w-8 h-8 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">No estimates found.</p>
            <Link href="/estimates/new" className="mt-3 inline-block text-sm text-amber-600 hover:underline">
              Create your first estimate
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-xs text-gray-500 uppercase tracking-wide">
                  <th className="px-5 py-3 text-left font-medium">#</th>
                  <th className="px-5 py-3 text-left font-medium">Customer</th>
                  <th className="px-5 py-3 text-left font-medium hidden md:table-cell">Created</th>
                  <th className="px-5 py-3 text-left font-medium hidden lg:table-cell">Valid Until</th>
                  <th className="px-5 py-3 text-right font-medium">Total</th>
                  <th className="px-5 py-3 text-left font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {estimates.map((est) => {
                  const total = est.items.reduce((s, i) => s + i.quantity * i.unitPrice, 0)
                  return (
                    <tr key={est.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-3">
                        <Link href={`/estimates/${est.id}`} className="font-medium text-amber-600 hover:underline">
                          {est.estimateNumber}
                        </Link>
                      </td>
                      <td className="px-5 py-3 text-gray-700">
                        <Link href={`/customers/${est.customerId}`} className="hover:text-sky-600">
                          {est.customer.firstName} {est.customer.lastName}
                        </Link>
                      </td>
                      <td className="px-5 py-3 text-gray-500 hidden md:table-cell">{formatDate(est.createdAt)}</td>
                      <td className="px-5 py-3 text-gray-500 hidden lg:table-cell">
                        {est.validUntil ? formatDate(est.validUntil) : "—"}
                      </td>
                      <td className="px-5 py-3 text-right font-semibold text-gray-900">{formatCurrency(total)}</td>
                      <td className="px-5 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[est.status] ?? ""}`}>
                          {est.status}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between gap-3 py-1">
          <span className="text-sm text-gray-500">
            {skip + 1}–{Math.min(skip + PAGE_SIZE, filteredTotal)} of {filteredTotal}
          </span>
          <div className="flex gap-2">
            {page > 1 && (
              <Link href={buildUrl({ status, q, page: String(page - 1) })}>
                <Button size="sm" variant="secondary">
                  <ChevronLeft className="w-4 h-4" /> Prev
                </Button>
              </Link>
            )}
            {page < totalPages && (
              <Link href={buildUrl({ status, q, page: String(page + 1) })}>
                <Button size="sm" variant="secondary">
                  Next <ChevronRight className="w-4 h-4" />
                </Button>
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
