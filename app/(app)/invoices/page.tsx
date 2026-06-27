import { db } from "@/lib/db"
import { requireSession } from "@/lib/session"
import Link from "next/link"
import { Plus, ChevronRight, Zap, Mail, AlertTriangle, CheckCircle, Download } from "lucide-react"
import Card from "@/components/ui/Card"
import Button from "@/components/ui/Button"
import { statusBadge } from "@/components/ui/Badge"
import { formatCurrency, formatDate, invoiceTotal, paymentTotal } from "@/lib/utils"
import { markOverdueInvoices } from "@/lib/actions/invoices"
import { sendBulkOverdueReminders } from "@/lib/actions/emails"

export const dynamic = "force-dynamic"

export default async function InvoicesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; from?: string; to?: string; serviceType?: string; generated?: string; reminded?: string; failed?: string }>
}) {
  const { companyId } = await requireSession()
  await markOverdueInvoices(companyId)
  const { status, from, to, serviceType, generated, reminded, failed: reminderFailed } = await searchParams

  const invoices = await db.invoice.findMany({
    where: {
      companyId,
      ...(status && status !== "all" ? { status } : {}),
      ...(serviceType ? { serviceType } : {}),
      ...(from || to ? {
        issuedAt: {
          ...(from ? { gte: new Date(from) } : {}),
          ...(to   ? { lte: new Date(to + "T23:59:59") } : {}),
        },
      } : {}),
    },
    orderBy: status === "overdue" ? { dueDate: "asc" } : { createdAt: "desc" },
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

  // eslint-disable-next-line react-hooks/purity
  const now = Date.now()
  const daysOverdue = (dueDate: Date) => Math.floor((now - dueDate.getTime()) / 86_400_000)

  const overdueWithEmail = status === "overdue"
    ? invoices.filter((i) => !!i.customer.email).length
    : 0

  const statusTabs = [
    { key: "all", label: "All" },
    { key: "draft", label: "Draft" },
    { key: "sent", label: "Sent" },
    { key: "overdue", label: "Overdue" },
    { key: "paid", label: "Paid" },
  ]

  return (
    <div className="space-y-4 sm:space-y-5">
      {generated && (
        <div className="rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-800 flex items-center gap-2">
          <Zap className="w-4 h-4 shrink-0" />
          {generated} invoice{parseInt(generated) !== 1 ? "s" : ""} generated successfully. Review and mark as Sent when ready.
        </div>
      )}
      {reminded && (
        <div className="rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-800 flex items-center gap-2">
          <CheckCircle className="w-4 h-4 shrink-0" />
          {reminded} reminder{parseInt(reminded) !== 1 ? "s" : ""} sent.
          {reminderFailed && parseInt(reminderFailed) > 0 && (
            <span className="text-red-700"> {reminderFailed} failed — check individual invoices.</span>
          )}
        </div>
      )}

      {(from || to || serviceType) && (
        <div className="rounded-lg bg-sky-50 border border-sky-200 px-4 py-2.5 text-sm text-sky-800 flex items-center justify-between gap-2">
          <span>
            Filtered
            {serviceType ? ` · Service type: ${serviceType}` : ""}
            {from ? ` · From ${from}` : ""}
            {to   ? ` · To ${to}` : ""}
          </span>
          <Link href="/invoices" className="text-sky-600 hover:text-sky-900 font-medium whitespace-nowrap">Clear ×</Link>
        </div>
      )}

      <div className="flex items-center justify-between gap-2">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Invoices</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {invoices.length} {status && status !== "all" ? status : "total"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <a href={`/api/export/invoices${status && status !== "all" ? `?status=${status}` : ""}`} download>
            <Button size="sm" variant="secondary">
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Export</span>
            </Button>
          </a>
          <Link href="/invoices/generate">
            <Button size="sm" variant="secondary">
              <Zap className="w-4 h-4" />
              <span className="hidden sm:inline">Generate Monthly</span>
            </Button>
          </Link>
          <Link href="/invoices/new">
            <Button size="sm">
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">New Invoice</span>
              <span className="sm:hidden">New</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Status tabs — larger tap targets on mobile */}
      <div className="flex gap-1 overflow-x-auto pb-1 -mx-1 px-1">
        {statusTabs.map((tab) => {
          const active = (status ?? "all") === tab.key
          const isOverdueTab = tab.key === "overdue"
          return (
            <Link
              key={tab.key}
              href={`/invoices?status=${tab.key}`}
              className={`flex-none px-3 py-2 sm:py-1.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                active
                  ? isOverdueTab ? "bg-red-600 text-white" : "bg-sky-600 text-white"
                  : isOverdueTab && totals.overdue > 0 ? "text-red-600 hover:bg-red-50" : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              {tab.label}
              <span className={`ml-1.5 text-xs ${active ? (isOverdueTab ? "text-red-200" : "text-sky-200") : isOverdueTab && totals.overdue > 0 ? "text-red-400" : "text-gray-400"}`}>
                {totals[tab.key as keyof typeof totals]}
              </span>
            </Link>
          )
        })}
      </div>

      {/* Bulk remind button — only on overdue tab */}
      {status === "overdue" && (
        <div className="flex items-center justify-between gap-3 rounded-lg bg-red-50 border border-red-200 px-4 py-3">
          <div className="flex items-center gap-2 text-sm text-red-800">
            <AlertTriangle className="w-4 h-4 shrink-0 text-red-500" />
            <span>
              {invoices.length} overdue invoice{invoices.length !== 1 ? "s" : ""}
              {overdueWithEmail < invoices.length && ` · ${invoices.length - overdueWithEmail} customer${invoices.length - overdueWithEmail !== 1 ? "s" : ""} have no email`}
            </span>
          </div>
          {overdueWithEmail > 0 && (
            <form action={sendBulkOverdueReminders}>
              <Button type="submit" size="sm" variant="secondary">
                <Mail className="w-4 h-4" />
                Remind all {overdueWithEmail}
              </Button>
            </form>
          )}
        </div>
      )}

      {/* Mobile card list */}
      <div className="sm:hidden space-y-2">
        {invoices.length === 0 ? (
          <Card>
            <div className="py-12 text-center">
              <p className="text-gray-400 text-sm">No invoices found.</p>
              <Link href="/invoices/new" className="mt-3 inline-block text-sm text-sky-600 hover:underline">
                Create your first invoice
              </Link>
            </div>
          </Card>
        ) : (
          invoices.map((inv) => {
            const total = invoiceTotal(inv.items)
            const paid = paymentTotal(inv.payments)
            const balance = total - paid
            return (
              <Link key={inv.id} href={`/invoices/${inv.id}`}>
                <Card className="p-4 flex items-center justify-between hover:bg-gray-50 active:bg-gray-100 transition-colors">
                  <div className="min-w-0">
                    <p className="font-medium text-gray-900 text-sm truncate">
                      {inv.customer.firstName} {inv.customer.lastName}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {inv.invoiceNumber} · Due {formatDate(inv.dueDate)}
                      {inv.status === "overdue" && (
                        <span className="text-red-500"> · {daysOverdue(inv.dueDate)}d overdue</span>
                      )}
                    </p>
                    <div className="mt-1.5">{statusBadge(inv.status)}</div>
                  </div>
                  <div className="text-right shrink-0 ml-3">
                    <p className="text-sm font-semibold text-gray-900">{formatCurrency(total)}</p>
                    {paid > 0 && balance > 0 && (
                      <p className="text-xs text-gray-400">{formatCurrency(balance)} due</p>
                    )}
                    <ChevronRight className="w-4 h-4 text-gray-300 mt-1 ml-auto" />
                  </div>
                </Card>
              </Link>
            )
          })
        )}
      </div>

      {/* Desktop/tablet table */}
      <Card className="hidden sm:block">
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
                  <th className="px-5 py-3 text-left font-medium hidden md:table-cell">Issued</th>
                  <th className="px-5 py-3 text-left font-medium hidden lg:table-cell">Due</th>
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
                      <td className="px-5 py-3 text-gray-500 hidden md:table-cell">{formatDate(inv.issuedAt)}</td>
                      <td className="px-5 py-3 hidden lg:table-cell">
                        <span className="text-gray-500">{formatDate(inv.dueDate)}</span>
                        {inv.status === "overdue" && (
                          <span className="ml-1.5 text-xs text-red-500 font-medium">{daysOverdue(inv.dueDate)}d</span>
                        )}
                      </td>
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
