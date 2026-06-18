import { db } from "@/lib/db"
import { requireSession } from "@/lib/session"
import { notFound } from "next/navigation"
import Link from "next/link"
import {
  ChevronLeft, Trash2, Mail, CheckCircle, AlertCircle,
  Send, ArrowRight, FileText, Pencil
} from "lucide-react"
import Card, { CardHeader, CardBody } from "@/components/ui/Card"
import Button from "@/components/ui/Button"
import { formatCurrency, formatDate } from "@/lib/utils"
import {
  deleteEstimate,
  updateEstimateStatus,
  sendEstimateEmail,
  convertEstimateToInvoice,
} from "@/lib/actions/estimates"
import ConfirmButton from "@/components/ui/ConfirmButton"

export const dynamic = "force-dynamic"

const STATUS_COLORS: Record<string, string> = {
  draft:     "bg-gray-100 text-gray-600",
  sent:      "bg-sky-50 text-sky-700",
  accepted:  "bg-green-50 text-green-700",
  declined:  "bg-red-50 text-red-600",
  converted: "bg-purple-50 text-purple-700",
}

export default async function EstimateDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ emailed?: string; emailError?: string }>
}) {
  const { companyId } = await requireSession()
  const { id } = await params
  const { emailed, emailError } = await searchParams

  const [estimate, company, emailLogs] = await Promise.all([
    db.estimate.findFirst({
      where: { id, companyId },
      include: { customer: true, items: true },
    }),
    db.company.findUnique({ where: { id: companyId } }),
    db.emailLog.findMany({
      where: { estimateId: id, companyId },
      orderBy: { createdAt: "desc" },
    }),
  ])

  if (!estimate || !company) notFound()

  const total = estimate.items.reduce((s, i) => s + i.quantity * i.unitPrice, 0)
  const hasEmail = !!estimate.customer.email
  const canConvert = estimate.status !== "converted" && estimate.status !== "declined"
  const canEdit   = estimate.status === "draft" || estimate.status === "sent"

  const deleteAction   = deleteEstimate.bind(null, id)
  const sendAction     = sendEstimateEmail.bind(null, id)
  const markAccepted   = updateEstimateStatus.bind(null, id, "accepted")
  const markDeclined   = updateEstimateStatus.bind(null, id, "declined")
  const convertAction  = convertEstimateToInvoice.bind(null, id)

  const emailErrorMsg: Record<string, string> = {
    no_email:    "This customer has no email address on file.",
    send_failed: "Email delivery failed — check your Resend API key.",
    not_found:   "Estimate not found.",
  }

  return (
    <div className="space-y-6">
      {emailed && (
        <div className="rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-800 flex items-center gap-2">
          <CheckCircle className="w-4 h-4 shrink-0" />
          Estimate emailed to {estimate.customer.email}.
        </div>
      )}
      {emailError && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-800 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {emailErrorMsg[emailError] ?? "Failed to send email."}
        </div>
      )}

      {/* If already converted, show link to the invoice */}
      {estimate.status === "converted" && estimate.convertedInvoiceId && (
        <div className="rounded-lg bg-purple-50 border border-purple-200 px-4 py-3 text-sm text-purple-800 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 shrink-0" />
            This estimate has been converted to an invoice.
          </div>
          <Link href={`/invoices/${estimate.convertedInvoiceId}`} className="flex items-center gap-1 font-medium hover:underline shrink-0">
            View Invoice <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      <div>
        <Link href="/estimates" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900 mb-3">
          <ChevronLeft className="w-4 h-4" /> Estimates
        </Link>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">{estimate.estimateNumber}</h1>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[estimate.status] ?? ""}`}>
                {estimate.status}
              </span>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              Created {formatDate(estimate.createdAt)}
              {estimate.validUntil && ` · Valid until ${formatDate(estimate.validUntil)}`}
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            {canEdit && (
              <Link href={`/estimates/${id}/edit`}>
                <Button variant="secondary" size="sm">
                  <Pencil className="w-4 h-4" />
                  <span className="hidden sm:inline">Edit</span>
                </Button>
              </Link>
            )}
            {hasEmail && estimate.status !== "converted" && (
              <form action={sendAction}>
                <Button type="submit" variant="secondary" size="sm">
                  <Mail className="w-4 h-4" />
                  <span className="hidden sm:inline">Email</span>
                </Button>
              </form>
            )}
            {estimate.status === "sent" && (
              <>
                <form action={markAccepted}>
                  <Button type="submit" variant="secondary" size="sm">Mark Accepted</Button>
                </form>
                <form action={markDeclined}>
                  <Button type="submit" variant="secondary" size="sm">Mark Declined</Button>
                </form>
              </>
            )}
            {canConvert && (
              <form action={convertAction}>
                <Button type="submit" size="sm">
                  <ArrowRight className="w-4 h-4" />
                  Convert to Invoice
                </Button>
              </form>
            )}
            <ConfirmButton action={deleteAction} confirm="Delete this estimate?" variant="danger" size="sm">
              <Trash2 className="w-4 h-4" />
            </ConfirmButton>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-5">
          {/* Estimate body */}
          <Card>
            <CardBody>
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
                </div>
                <div className="text-right">
                  <p className="text-xs text-amber-700 font-semibold uppercase tracking-wide">Estimate</p>
                  <p className="text-xl font-bold text-gray-900 mt-0.5">{estimate.estimateNumber}</p>
                  {estimate.validUntil && (
                    <p className="text-xs text-gray-400 mt-1">Valid until {formatDate(estimate.validUntil)}</p>
                  )}
                </div>
              </div>

              <div className="mb-6">
                <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Prepared For</p>
                <p className="font-semibold text-gray-900">
                  {estimate.customer.firstName} {estimate.customer.lastName}
                </p>
                <p className="text-sm text-gray-500">{estimate.customer.address}</p>
                <p className="text-sm text-gray-500">{estimate.customer.city}, {estimate.customer.state} {estimate.customer.zip}</p>
              </div>

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
                  {estimate.items.map((item) => (
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
                    <td colSpan={3} className="pt-3 text-right text-sm font-semibold text-gray-700">Estimate Total</td>
                    <td className="pt-3 text-right text-lg font-bold text-gray-900">{formatCurrency(total)}</td>
                  </tr>
                </tfoot>
              </table>

              {estimate.notes && (
                <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-600">{estimate.notes}</div>
              )}
            </CardBody>
          </Card>

          {/* Email with message */}
          {hasEmail && estimate.status !== "converted" && (
            <Card>
              <CardHeader>
                <h2 className="font-semibold text-gray-900 text-sm flex items-center gap-1.5">
                  <Send className="w-3.5 h-3.5 text-gray-400" /> Send Estimate
                </h2>
              </CardHeader>
              <CardBody className="space-y-3">
                <p className="text-xs text-gray-400">To: {estimate.customer.email}</p>
                <form action={sendAction} className="space-y-2">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Additional details <span className="font-normal text-gray-400">(optional)</span>
                    </label>
                    <textarea
                      name="message"
                      placeholder={"e.g. This includes all labor and chemicals. Work to be completed within 5 business days. 50% deposit required to schedule."}
                      rows={5}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-500 resize-y"
                    />
                    <p className="text-xs text-gray-400 mt-1">Appears as a highlighted note in the email above the line items.</p>
                  </div>
                  <Button type="submit" variant="secondary" size="sm">Send Estimate</Button>
                </form>
              </CardBody>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-5">
          <Card>
            <CardHeader><h2 className="font-semibold text-gray-900 text-sm">Customer</h2></CardHeader>
            <CardBody>
              <Link href={`/customers/${estimate.customerId}`} className="font-medium text-sky-700 hover:underline text-sm">
                {estimate.customer.firstName} {estimate.customer.lastName}
              </Link>
              <p className="text-xs text-gray-400 mt-1">{estimate.customer.address}</p>
              <p className="text-xs text-gray-400">{estimate.customer.city}, {estimate.customer.state}</p>
              {estimate.customer.email && (
                <p className="text-xs text-gray-400 mt-1">{estimate.customer.email}</p>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <div className="flex justify-between text-sm font-semibold text-gray-900">
                <span>Estimate Total</span>
                <span>{formatCurrency(total)}</span>
              </div>
            </CardBody>
          </Card>

          {/* Email history */}
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
                          Estimate · {log.status}
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
