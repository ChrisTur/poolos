import { db } from "@/lib/db"
import { requireSession } from "@/lib/session"
import Link from "next/link"
import { ChevronLeft } from "lucide-react"
import Card, { CardBody, CardHeader } from "@/components/ui/Card"
import { statusBadge } from "@/components/ui/Badge"
import { formatCurrency, formatDate, invoiceTotal, paymentTotal } from "@/lib/utils"
import { markOverdueInvoices } from "@/lib/actions/invoices"

export const dynamic = "force-dynamic"

interface AgingInvoice {
  id: string
  invoiceNumber: string
  dueDate: Date
  status: string
  customerName: string
  customerId: string
  balance: number
  daysPastDue: number
}

const BUCKETS = [
  { label: "Current",  min: -Infinity, max: 0  },
  { label: "1–30 days",  min: 1,  max: 30  },
  { label: "31–60 days", min: 31, max: 60  },
  { label: "61–90 days", min: 61, max: 90  },
  { label: "90+ days",   min: 91, max: Infinity },
]

export default async function AgingReportPage() {
  const { companyId } = await requireSession()
  await markOverdueInvoices(companyId)

  const openInvoices = await db.invoice.findMany({
    where: {
      companyId,
      status: { in: ["draft", "sent", "overdue"] },
    },
    include: {
      customer: { select: { id: true, firstName: true, lastName: true } },
      items: true,
      payments: true,
    },
    orderBy: { dueDate: "asc" },
  })

  const now = new Date()
  now.setHours(0, 0, 0, 0)

  const aging: AgingInvoice[] = openInvoices
    .map((inv) => {
      const total = invoiceTotal(inv.items)
      const paid = paymentTotal(inv.payments)
      const balance = total - paid
      if (balance <= 0) return null
      const dueDate = new Date(inv.dueDate)
      dueDate.setHours(0, 0, 0, 0)
      const daysPastDue = Math.floor((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24))
      return {
        id: inv.id,
        invoiceNumber: inv.invoiceNumber,
        dueDate: inv.dueDate,
        status: inv.status,
        customerName: `${inv.customer.firstName} ${inv.customer.lastName}`,
        customerId: inv.customer.id,
        balance,
        daysPastDue,
      }
    })
    .filter(Boolean) as AgingInvoice[]

  const bucketTotals = BUCKETS.map((b) => {
    const rows = aging.filter((r) => r.daysPastDue >= b.min && r.daysPastDue <= b.max)
    return { ...b, rows, total: rows.reduce((s, r) => s + r.balance, 0), count: rows.length }
  })

  const grandTotal = aging.reduce((s, r) => s + r.balance, 0)

  return (
    <div className="space-y-6">
      <div>
        <Link href="/reports" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900 mb-3">
          <ChevronLeft className="w-4 h-4" /> Reports
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Accounts Receivable Aging</h1>
        <p className="text-sm text-gray-500 mt-1">Open balances grouped by how far past due they are.</p>
      </div>

      {/* Summary bar */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {bucketTotals.map((b) => (
          <Card key={b.label} className={`p-3 ${b.min > 60 && b.total > 0 ? "border-red-200" : ""}`}>
            <p className="text-xs text-gray-500 font-medium">{b.label}</p>
            <p className={`text-lg font-bold mt-1 ${b.min > 60 && b.total > 0 ? "text-red-600" : "text-gray-900"}`}>
              {formatCurrency(b.total)}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">{b.count} invoice{b.count !== 1 ? "s" : ""}</p>
          </Card>
        ))}
      </div>

      {/* Grand total */}
      <div className="flex justify-end">
        <div className="text-right">
          <p className="text-xs text-gray-400 uppercase tracking-wide">Total Outstanding</p>
          <p className="text-2xl font-bold text-gray-900">{formatCurrency(grandTotal)}</p>
          <p className="text-xs text-gray-400">{aging.length} open invoice{aging.length !== 1 ? "s" : ""}</p>
        </div>
      </div>

      {/* Bucket tables */}
      {bucketTotals.filter((b) => b.rows.length > 0).map((b) => (
        <Card key={b.label}>
          <CardHeader className="flex items-center justify-between">
            <h2 className="font-semibold text-gray-900 text-sm">{b.label}</h2>
            <span className={`text-sm font-semibold ${b.min > 60 ? "text-red-600" : "text-gray-900"}`}>
              {formatCurrency(b.total)}
            </span>
          </CardHeader>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-xs text-gray-500 uppercase tracking-wide">
                  <th className="px-5 py-2.5 text-left font-medium">Customer</th>
                  <th className="px-5 py-2.5 text-left font-medium hidden sm:table-cell">Invoice</th>
                  <th className="px-5 py-2.5 text-left font-medium hidden md:table-cell">Due Date</th>
                  <th className="px-5 py-2.5 text-center font-medium hidden md:table-cell">Days Past Due</th>
                  <th className="px-5 py-2.5 text-left font-medium hidden sm:table-cell">Status</th>
                  <th className="px-5 py-2.5 text-right font-medium">Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {b.rows.map((row) => (
                  <tr key={row.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3">
                      <Link href={`/customers/${row.customerId}`} className="font-medium text-gray-900 hover:text-sky-600">
                        {row.customerName}
                      </Link>
                      <p className="text-xs text-gray-400 sm:hidden">{row.invoiceNumber}</p>
                    </td>
                    <td className="px-5 py-3 hidden sm:table-cell">
                      <Link href={`/invoices/${row.id}`} className="text-sky-600 hover:underline font-medium">
                        {row.invoiceNumber}
                      </Link>
                    </td>
                    <td className="px-5 py-3 text-gray-500 hidden md:table-cell">{formatDate(row.dueDate)}</td>
                    <td className="px-5 py-3 text-center hidden md:table-cell">
                      {row.daysPastDue <= 0 ? (
                        <span className="text-gray-400">—</span>
                      ) : (
                        <span className={`font-medium ${row.daysPastDue > 60 ? "text-red-600" : row.daysPastDue > 30 ? "text-amber-600" : "text-gray-700"}`}>
                          {row.daysPastDue}d
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3 hidden sm:table-cell">{statusBadge(row.status)}</td>
                    <td className="px-5 py-3 text-right font-semibold text-gray-900">
                      {formatCurrency(row.balance)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-gray-200 bg-gray-50">
                  <td colSpan={5} className="px-5 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide text-right hidden sm:table-cell">
                    Subtotal
                  </td>
                  <td colSpan={1} className="px-5 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide sm:hidden">
                    Subtotal
                  </td>
                  <td className="px-5 py-2.5 text-right font-bold text-gray-900">{formatCurrency(b.total)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </Card>
      ))}

      {aging.length === 0 && (
        <Card>
          <CardBody>
            <p className="text-center text-sm text-gray-400 py-8">No open balances. All invoices are paid or cancelled.</p>
          </CardBody>
        </Card>
      )}
    </div>
  )
}
