import { db } from "@/lib/db"
import { requireSession } from "@/lib/session"
import Link from "next/link"
import { Plus, ChevronRight, FileEdit, LayoutTemplate } from "lucide-react"
import Card from "@/components/ui/Card"
import Button from "@/components/ui/Button"
import { formatCurrency, formatDate } from "@/lib/utils"

export const dynamic = "force-dynamic"

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

export default async function EstimatesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
}) {
  const { companyId } = await requireSession()
  const { status } = await searchParams

  const estimates = await db.estimate.findMany({
    where: status && status !== "all" ? { companyId, status } : { companyId },
    orderBy: { createdAt: "desc" },
    include: {
      customer: true,
      items: true,
    },
  })

  const counts = STATUS_TABS.reduce<Record<string, number>>((acc, tab) => {
    acc[tab.key] = tab.key === "all"
      ? estimates.length
      : estimates.filter((e) => e.status === tab.key).length
    return acc
  }, {})

  return (
    <div className="space-y-4 sm:space-y-5">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Estimates</h1>
          <p className="text-sm text-gray-500 mt-0.5">{estimates.length} {status && status !== "all" ? status : "total"}</p>
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

      <div className="flex gap-1 overflow-x-auto pb-1 -mx-1 px-1">
        {STATUS_TABS.map((tab) => {
          const active = (status ?? "all") === tab.key
          return (
            <Link
              key={tab.key}
              href={`/estimates?status=${tab.key}`}
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
    </div>
  )
}
