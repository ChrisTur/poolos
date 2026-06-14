import { db } from "@/lib/db"
import { requireSession } from "@/lib/session"
import { notFound } from "next/navigation"
import Link from "next/link"
import { ChevronLeft, Trash2, Download } from "lucide-react"
import Card, { CardHeader, CardBody } from "@/components/ui/Card"
import Button from "@/components/ui/Button"
import { statusBadge } from "@/components/ui/Badge"
import { formatCurrency, formatDate, formatPhone, invoiceTotal, paymentTotal } from "@/lib/utils"
import { deleteInvoice, updateInvoiceStatus, addPayment } from "@/lib/actions/invoices"
import InvoicePDFButton from "@/components/invoices/InvoicePDFButton"
import ConfirmButton from "@/components/ui/ConfirmButton"

export const dynamic = "force-dynamic"

export default async function InvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { companyId } = await requireSession()
  const { id } = await params

  const invoice = await db.invoice.findFirst({
    where: { id, companyId },
    include: {
      customer: true,
      items: true,
      payments: { orderBy: { createdAt: "asc" } },
    },
  })

  if (!invoice) notFound()

  const total = invoiceTotal(invoice.items)
  const paid = paymentTotal(invoice.payments)
  const balance = total - paid

  const deleteAction = deleteInvoice.bind(null, id)
  const markSent = updateInvoiceStatus.bind(null, id, "sent")
  const markPaid = updateInvoiceStatus.bind(null, id, "paid")
  const markOverdue = updateInvoiceStatus.bind(null, id, "overdue")
  const addPaymentAction = addPayment.bind(null, id)

  return (
    <div className="space-y-6">
      <div>
        <Link href="/invoices" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900 mb-3">
          <ChevronLeft className="w-4 h-4" /> Invoices
        </Link>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">{invoice.invoiceNumber}</h1>
              {statusBadge(invoice.status)}
            </div>
            <p className="text-sm text-gray-500 mt-1">
              Issued {formatDate(invoice.issuedAt)} · Due {formatDate(invoice.dueDate)}
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <InvoicePDFButton invoice={invoice} />
            {invoice.status === "draft" && (
              <form action={markSent}>
                <Button type="submit" variant="secondary" size="sm">Mark Sent</Button>
              </form>
            )}
            {invoice.status !== "paid" && invoice.status !== "cancelled" && (
              <>
                <form action={markPaid}>
                  <Button type="submit" size="sm">Mark Paid</Button>
                </form>
                {invoice.status !== "overdue" && (
                  <form action={markOverdue}>
                    <Button type="submit" variant="secondary" size="sm">Mark Overdue</Button>
                  </form>
                )}
              </>
            )}
            <ConfirmButton action={deleteAction} confirm="Delete this invoice?" variant="danger" size="sm">
              <Trash2 className="w-4 h-4" />
            </ConfirmButton>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-5">
          {/* Invoice */}
          <Card>
            <CardHeader className="flex items-center justify-between">
              <div>
                <h2 className="font-semibold text-gray-900">{invoice.invoiceNumber}</h2>
                <p className="text-xs text-gray-400">Issued {formatDate(invoice.issuedAt)}</p>
              </div>
            </CardHeader>
            <CardBody>
              {/* Customer */}
              <div className="mb-6">
                <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Bill To</p>
                <p className="font-semibold text-gray-900">
                  {invoice.customer.firstName} {invoice.customer.lastName}
                </p>
                <p className="text-sm text-gray-500">{invoice.customer.address}</p>
                <p className="text-sm text-gray-500">
                  {invoice.customer.city}, {invoice.customer.state} {invoice.customer.zip}
                </p>
                {invoice.customer.email && <p className="text-sm text-gray-500">{invoice.customer.email}</p>}
                {invoice.customer.phone && (
                  <p className="text-sm text-gray-500">{formatPhone(invoice.customer.phone)}</p>
                )}
              </div>

              {/* Line items */}
              <table className="w-full text-sm mb-4">
                <thead>
                  <tr className="border-b border-gray-200 text-xs text-gray-400 uppercase tracking-wide">
                    <th className="py-2 text-left font-medium">Description</th>
                    <th className="py-2 text-center font-medium w-16">Qty</th>
                    <th className="py-2 text-right font-medium w-24">Unit</th>
                    <th className="py-2 text-right font-medium w-24">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {invoice.items.map((item) => (
                    <tr key={item.id}>
                      <td className="py-2.5 text-gray-700">{item.description}</td>
                      <td className="py-2.5 text-center text-gray-500">{item.quantity}</td>
                      <td className="py-2.5 text-right text-gray-500">{formatCurrency(item.unitPrice)}</td>
                      <td className="py-2.5 text-right font-medium text-gray-900">
                        {formatCurrency(item.quantity * item.unitPrice)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t border-gray-200">
                    <td colSpan={3} className="pt-3 text-right text-sm font-semibold text-gray-700">Total</td>
                    <td className="pt-3 text-right text-lg font-bold text-gray-900">{formatCurrency(total)}</td>
                  </tr>
                  {paid > 0 && (
                    <>
                      <tr>
                        <td colSpan={3} className="py-0.5 text-right text-sm text-gray-400">Paid</td>
                        <td className="py-0.5 text-right text-sm text-green-600">−{formatCurrency(paid)}</td>
                      </tr>
                      <tr>
                        <td colSpan={3} className="pt-1 text-right text-sm font-semibold text-gray-700">Balance Due</td>
                        <td className="pt-1 text-right font-bold text-gray-900">{formatCurrency(balance)}</td>
                      </tr>
                    </>
                  )}
                </tfoot>
              </table>

              {invoice.notes && (
                <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-600">
                  {invoice.notes}
                </div>
              )}
            </CardBody>
          </Card>

          {/* Payments */}
          <Card>
            <CardHeader><h2 className="font-semibold text-gray-900 text-sm">Payments</h2></CardHeader>
            <CardBody className="space-y-4">
              {invoice.payments.length > 0 && (
                <div className="space-y-2">
                  {invoice.payments.map((p) => (
                    <div key={p.id} className="flex items-center justify-between text-sm">
                      <div>
                        <span className="font-medium text-gray-900">{formatCurrency(p.amount)}</span>
                        {p.method && <span className="text-gray-400 ml-2">via {p.method}</span>}
                        {p.reference && <span className="text-gray-400 ml-2">#{p.reference}</span>}
                      </div>
                      <span className="text-gray-400 text-xs">{formatDate(p.createdAt)}</span>
                    </div>
                  ))}
                </div>
              )}

              {invoice.status !== "paid" && invoice.status !== "cancelled" && (
                <form action={addPaymentAction} className="space-y-3 pt-2 border-t border-gray-100">
                  <p className="text-sm font-medium text-gray-700">Record Payment</p>
                  <div className="grid sm:grid-cols-2 gap-3">
                    <input
                      name="amount"
                      type="number"
                      step="0.01"
                      min="0.01"
                      placeholder={`Amount (${formatCurrency(balance)} due)`}
                      required
                      className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
                    />
                    <select
                      name="method"
                      className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
                    >
                      <option value="">Payment method…</option>
                      {["Cash", "Check", "Card", "Zelle", "Venmo", "PayPal", "ACH"].map((m) => (
                        <option key={m} value={m.toLowerCase()}>{m}</option>
                      ))}
                    </select>
                  </div>
                  <input
                    name="reference"
                    placeholder="Reference / check # (optional)"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                  <Button type="submit" size="sm">Record Payment</Button>
                </form>
              )}
            </CardBody>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-5">
          <Card>
            <CardHeader><h2 className="font-semibold text-gray-900 text-sm">Customer</h2></CardHeader>
            <CardBody>
              <Link
                href={`/customers/${invoice.customerId}`}
                className="font-medium text-sky-700 hover:underline text-sm"
              >
                {invoice.customer.firstName} {invoice.customer.lastName}
              </Link>
              <p className="text-xs text-gray-400 mt-1">{invoice.customer.address}</p>
              <p className="text-xs text-gray-400">{invoice.customer.city}, {invoice.customer.state}</p>
            </CardBody>
          </Card>

          <Card>
            <CardBody className="space-y-2 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Total</span>
                <span className="font-semibold text-gray-900">{formatCurrency(total)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Paid</span>
                <span className="text-green-600">{formatCurrency(paid)}</span>
              </div>
              <div className="flex justify-between border-t border-gray-100 pt-2 font-semibold text-gray-900">
                <span>Balance Due</span>
                <span>{formatCurrency(balance)}</span>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  )
}
