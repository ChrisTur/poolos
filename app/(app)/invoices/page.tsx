import { db } from "@/lib/db"
import { requireSession } from "@/lib/session"
import Link from "next/link"
import { Plus } from "lucide-react"
import Card from "@/components/ui/Card"
import Button from "@/components/ui/Button"
import { statusBadge } from "@/components/ui/Badge"
import { formatCurrency, formatDate, invoiceTotal, paymentTotal } from "@/lib/utils"

export const dynamic = "force-dynamic"

export default async function InvoicesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
}) {
  const { companyId } = await requireSession()
  const { status } = await searchParams

  const invoices = await db.invoice.findMany({
    where: status && status !== "all" ? { companyId, status } : { companyId },
    orderBy: { createdAt: "desc" },
    include: {
      customer: true,
      items: true,
      payments: true,
    },
  })

  const totals = {
    all: invoices.length,
    draft: invoices.filter((i) => i.status === "draft").length,
    sent: invoices.filter((i) => i.status === "sent").length,
    paid: invoices.filter((i) => i.status === "paid").length,
    overdue: invoices.filter((i) => i.status === "overdue").length,
  }

  const statusTabs = [
    { key: "all", label: "All" },
    { key: "draft", label: "Draft" },
    { key: "sent", label: "Sent" },
    { key: "overdue", label: "Overdue" },
    { key: "paid", label: "Paid" },
  ]

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Invoices</h1>
          <p className="text-sm text-gray-500 mt-0.5">{invoices.length} {status && status !== "all" ? status : "total"}</p>
        </div>
        <Link href="/invoices/new">
          <Button>
            <Plus className="w-4 h-4" />
            New Invoice
          </Button>
        </Link>
      </div>

      {/* Status tabs */}
      <div className="flex gap-1 flex-wrap">
        {statusTabs.map((tab) => {
          const active = (status ?? "all") === tab.key
          return (
            <Link
              key={tab.key}
              href={`/invoices?status=${tab.key}`}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                active ? "bg-sky-600 text-white" : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              {tab.label}
              <span className={`ml-1.5 text-xs ${active ? "text-sky-200" : "text-gray-400"}`}>
                {totals[tab.key as keyof typeof totals]}
              </span>
            </Link>
          )
        })}
      </div>

      <Card>
        {invoices.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-gray-400 text-sm">No invoices found.</p>
            <Link href="/invoices/new" className="mt-3 inline-block text-sm text-sky-600 hover:underline">
              Create your first invoice
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-xs text-gray-500 uppercase tracking-wide">
                  <th className="px-5 py-3 text-left font-medium">#</th>
                  <th className="px-5 py-3 text-left font-medium">Customer</th>
                  <th className="px-5 py-3 text-left font-medium hidden sm:table-cell">Issued</th>
                  <th className="px-5 py-3 text-left font-medium hidden md:table-cell">Due</th>
                  <th className="px-5 py-3 text-right font-medium">Amount</th>
                  <th className="px-5 py-3 text-left font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {invoices.map((inv) => {
                  const total = invoiceTotal(inv.items)
                  const paid = paymentTotal(inv.payments)
                  const balance = total - paid
                  return (
                    <tr key={inv.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-3">
                        <Link href={`/invoices/${inv.id}`} className="font-medium text-sky-600 hover:underline">
                          {inv.invoiceNumber}
                        </Link>
                      </td>
                      <td className="px-5 py-3 text-gray-700">
                        <Link href={`/customers/${inv.customerId}`} className="hover:text-sky-600">
                          {inv.customer.firstName} {inv.customer.lastName}
                        </Link>
                      </td>
                      <td className="px-5 py-3 text-gray-500 hidden sm:table-cell">{formatDate(inv.issuedAt)}</td>
                      <td className="px-5 py-3 text-gray-500 hidden md:table-cell">{formatDate(inv.dueDate)}</td>
                      <td className="px-5 py-3 text-right">
                        <p className="font-semibold text-gray-900">{formatCurrency(total)}</p>
                        {paid > 0 && balance > 0 && (
                          <p className="text-xs text-gray-400">{formatCurrency(balance)} due</p>
                        )}
                      </td>
                      <td className="px-5 py-3">{statusBadge(inv.status)}</td>
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
