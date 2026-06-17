import { db } from "@/lib/db"
import { requireSession } from "@/lib/session"
import { notFound } from "next/navigation"
import Link from "next/link"
import { ChevronLeft, Trash2, Mail, BellRing, CheckCircle, AlertCircle, Send, Pencil, CreditCard } from "lucide-react"
import Card, { CardHeader, CardBody } from "@/components/ui/Card"
import Button from "@/components/ui/Button"
import { statusBadge } from "@/components/ui/Badge"
import { formatCurrency, formatDate, formatPhone, invoiceTotal, paymentTotal } from "@/lib/utils"
import { deleteInvoice, updateInvoiceStatus, addPayment, deletePayment, markOverdueInvoices } from "@/lib/actions/invoices"
import { sendInvoiceEmail, sendReminderEmail } from "@/lib/actions/emails"
import InvoicePDFButton from "@/components/invoices/InvoicePDFButton"
import ConfirmButton from "@/components/ui/ConfirmButton"

export const dynamic = "force-dynamic"

export default async function InvoiceDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ emailed?: string; reminded?: string; emailError?: string }>
}) {
  const { companyId } = await requireSession()
  await markOverdueInvoices(companyId)
  const { id } = await params
  const { emailed, reminded, emailError } = await searchParams

  const [invoice, company, emailLogs] = await Promise.all([
    db.invoice.findFirst({
      where: { id, companyId },
      include: {
        customer: true,
        items: true,
        payments: { orderBy: { createdAt: "asc" } },
      },
    }),
    db.company.findUnique({ where: { id: companyId } }),
    db.emailLog.findMany({
      where: { invoiceId: id, companyId },
      orderBy: { createdAt: "desc" },
    }),
  ])

  if (!invoice || !company) notFound()

  const total = invoiceTotal(invoice.items)
  const paid = paymentTotal(invoice.payments)
  const balance = total - paid

  const deleteAction = deleteInvoice.bind(null, id)
  const markSent = updateInvoiceStatus.bind(null, id, "sent")
  const markPaid = updateInvoiceStatus.bind(null, id, "paid")
  const markOverdue = updateInvoiceStatus.bind(null, id, "overdue")
  const addPaymentAction = addPayment.bind(null, id)

  const sendAction = sendInvoiceEmail.bind(null, id)
  const remindAction = sendReminderEmail.bind(null, id)
  const hasEmail = !!invoice.customer.email
  const canRemind = hasEmail && invoice.status !== "paid" && invoice.status !== "cancelled"

  const emailErrorMsg: Record<string, string> = {
    no_email: "This customer has no email address on file.",
    send_failed: "Email delivery failed — check your Resend API key.",
    not_found: "Invoice not found.",
  }

  return (
    <div className="space-y-6">
      {emailed && (
        <div className="rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-800 flex items-center gap-2">
          <CheckCircle className="w-4 h-4 shrink-0" />
          Invoice emailed to {invoice.customer.email}.
        </div>
      )}
      {reminded && (
        <div className="rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-800 flex items-center gap-2">
          <CheckCircle className="w-4 h-4 shrink-0" />
          Payment reminder sent to {invoice.customer.email}.
        </div>
      )}
      {emailError && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-800 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {emailErrorMsg[emailError] ?? "Failed to send email."}
        </div>
      )}

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
            <InvoicePDFButton invoice={invoice} company={company} />
            {invoice.status !== "paid" && invoice.status !== "cancelled" && (
              <Link href={`/invoices/${id}/edit`}>
                <Button variant="secondary" size="sm">
                  <Pencil className="w-4 h-4" />
                  <span className="hidden sm:inline">Edit</span>
                </Button>
              </Link>
            )}
            {hasEmail && (
              <>
                <form action={sendAction}>
                  <Button type="submit" variant="secondary" size="sm" title={`Email invoice to ${invoice.customer.email}`}>
                    <Mail className="w-4 h-4" />
                    <span className="hidden sm:inline">Email</span>
                  </Button>
                </form>
                {canRemind && (
                  <form action={remindAction}>
                    <Button type="submit" variant="secondary" size="sm" title="Send payment reminder">
                      <BellRing className="w-4 h-4" />
                      <span className="hidden sm:inline">Remind</span>
                    </Button>
                  </form>
                )}
              </>
            )}
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
            <CardBody>
              {/* Company header */}
              <div className="flex items-start justify-between mb-8">
                <div>
                  {company.logoUrl && (
                    <img src={company.logoUrl} alt={company.name} className="h-12 object-contain mb-2" />
                  )}
                  <p className="font-bold text-gray-900">{company.name}</p>
                  {company.address && <p className="text-sm text-gray-500">{company.address}</p>}
                  {company.city && (
                    <p className="text-sm text-gray-500">{company.city}, {company.state} {company.zip}</p>
                  )}
                  {company.phone && <p className="text-sm text-gray-500">{formatPhone(company.phone)}</p>}
                  {company.website && <p className="text-sm text-gray-500">{company.website}</p>}
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold text-gray-900">{invoice.invoiceNumber}</p>
                  <p className="text-xs text-gray-400 mt-1">Issued {formatDate(invoice.issuedAt)}</p>
                  <p className="text-xs text-gray-400">Due {formatDate(invoice.dueDate)}</p>
                </div>
              </div>

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

          {/* Email */}
          {hasEmail && (
            <Card>
              <CardHeader>
                <h2 className="font-semibold text-gray-900 text-sm flex items-center gap-1.5">
                  <Send className="w-3.5 h-3.5 text-gray-400" /> Send with Message
                </h2>
              </CardHeader>
              <CardBody className={canRemind ? "space-y-4" : "space-y-3"}>
                <p className="text-xs text-gray-400">To: {invoice.customer.email}</p>

                <form action={sendAction} className="space-y-2">
                  <textarea
                    name="message"
                    placeholder="Add a personal note to the invoice email…"
                    rows={2}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-sky-500 resize-none"
                  />
                  <Button type="submit" variant="secondary" size="sm">Send Invoice</Button>
                </form>

                {canRemind && (
                  <form action={remindAction} className="space-y-2 pt-3 border-t border-gray-100">
                    <textarea
                      name="message"
                      placeholder="Add a personal note to the reminder email…"
                      rows={2}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-sky-500 resize-none"
                    />
                    <Button type="submit" variant="secondary" size="sm">Send Reminder</Button>
                  </form>
                )}
              </CardBody>
            </Card>
          )}

          {/* Payments */}
          <Card>
            <CardHeader><h2 className="font-semibold text-gray-900 text-sm">Payments</h2></CardHeader>
            <CardBody className="space-y-4">
              {invoice.payments.length > 0 && (
                <div className="space-y-2">
                  {invoice.payments.map((p) => {
                    const deletePaymentAction = deletePayment.bind(null, p.id, id)
                    return (
                      <div key={p.id} className="flex items-center justify-between text-sm">
                        <div>
                          <span className="font-medium text-gray-900">{formatCurrency(p.amount)}</span>
                          {p.method && <span className="text-gray-400 ml-2">via {p.method}</span>}
                          {p.reference && <span className="text-gray-400 ml-2">#{p.reference}</span>}
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-gray-400 text-xs">{formatDate(p.createdAt)}</span>
                          <form action={deletePaymentAction}>
                            <button type="submit" className="text-gray-300 hover:text-red-500 transition-colors" title="Remove payment">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </form>
                        </div>
                      </div>
                    )
                  })}
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

          {/* Pay Now — only if company has configured payment handles and invoice isn't fully paid */}
          {balance > 0 && (company.venmoHandle || company.paypalHandle || company.cashAppHandle || company.zellePhone || company.zelleEmail) && (
            <Card>
              <CardHeader>
                <h2 className="font-semibold text-gray-900 text-sm flex items-center gap-1.5">
                  <CreditCard className="w-3.5 h-3.5 text-gray-400" /> Pay Now
                </h2>
              </CardHeader>
              <CardBody className="space-y-2">
                {company.venmoHandle && (
                  <a
                    href={`https://venmo.com/${company.venmoHandle}?txn=pay&amount=${balance.toFixed(2)}&note=${encodeURIComponent(invoice.invoiceNumber)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full rounded-lg px-3 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
                    style={{ background: "#3D95CE" }}
                  >
                    Pay with Venmo
                  </a>
                )}
                {company.paypalHandle && (
                  <a
                    href={`https://paypal.me/${company.paypalHandle}/${balance.toFixed(2)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full rounded-lg px-3 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
                    style={{ background: "#009CDE" }}
                  >
                    Pay with PayPal
                  </a>
                )}
                {company.cashAppHandle && (
                  <a
                    href={`https://cash.app/$${company.cashAppHandle}/${balance.toFixed(2)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full rounded-lg px-3 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
                    style={{ background: "#00A86B" }}
                  >
                    Pay with Cash App
                  </a>
                )}
                {(company.zellePhone || company.zelleEmail) && (
                  <div className="rounded-lg px-3 py-2 text-sm text-center" style={{ background: "#f3e8ff" }}>
                    <p className="font-medium" style={{ color: "#6D1ED4" }}>Pay via Zelle</p>
                    {company.zellePhone && <p className="text-xs text-gray-600 mt-0.5">{company.zellePhone}</p>}
                    {company.zelleEmail && <p className="text-xs text-gray-600">{company.zelleEmail}</p>}
                  </div>
                )}
              </CardBody>
            </Card>
          )}

          <Card>
            <CardHeader>
              <h2 className="font-semibold text-gray-900 text-sm flex items-center gap-1.5">
                <Send className="w-3.5 h-3.5 text-gray-400" /> Email History
              </h2>
            </CardHeader>
            <CardBody>
              {emailLogs.length === 0 ? (
                <p className="text-xs text-gray-400">No emails sent yet.</p>
              ) : (
                <div className="space-y-2">
                  {emailLogs.map((log) => (
                    <div key={log.id} className="text-xs">
                      <div className="flex items-center justify-between gap-2">
                        <span className={`font-medium ${log.status === "sent" ? "text-green-700" : "text-red-600"}`}>
                          {log.type === "reminder" ? "Reminder" : "Invoice"} · {log.status}
                        </span>
                        <span className="text-gray-400 shrink-0">{formatDate(log.createdAt)}</span>
                      </div>
                      <p className="text-gray-400 truncate">{log.toEmail}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  )
}
