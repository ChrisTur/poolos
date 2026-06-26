import { db } from "@/lib/db"
import { notFound } from "next/navigation"
import { formatCurrency, formatDate } from "@/lib/utils"
import { CheckCircle, XCircle, Clock, AlertTriangle } from "lucide-react"
import SignaturePad from "@/components/portal/SignaturePad"
import { approveEstimate, denyEstimate } from "@/lib/actions/portal-estimates"

export const dynamic = "force-dynamic"

export default async function PortalEstimatePage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string; id: string }>
  searchParams: Promise<{ approved?: string; declined?: string; error?: string }>
}) {
  const { token, id } = await params
  const { approved, declined, error } = await searchParams

  const customer = await db.customer.findUnique({
    where: { portalToken: token },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      company: {
        select: { name: true, logoUrl: true, phone: true, replyToEmail: true },
      },
    },
  })
  if (!customer) notFound()

  const estimate = await db.estimate.findFirst({
    where: { id, customerId: customer.id },
    include: { items: true },
  })
  if (!estimate) notFound()

  const total      = estimate.items.reduce((s, i) => s + i.quantity * i.unitPrice, 0)
  const now        = new Date()
  const isExpired  = !!estimate.validUntil && estimate.validUntil < now
  const canAct     = estimate.status === "sent" && !isExpired

  const errorMsg: Record<string, string> = {
    missing_fields: "Please draw your signature and enter your name before approving.",
    expired:        "This estimate has expired. Please contact us for a revised estimate.",
    unavailable:    "This estimate is no longer available for action.",
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-2xl mx-auto px-4 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {customer.company.logoUrl ? (
              <img src={customer.company.logoUrl} alt={customer.company.name} className="h-8 object-contain" />
            ) : (
              <span className="text-base font-bold text-gray-900">{customer.company.name}</span>
            )}
          </div>
          {(customer.company.phone || customer.company.replyToEmail) && (
            <a
              href={customer.company.phone ? `tel:${customer.company.phone}` : `mailto:${customer.company.replyToEmail}`}
              className="text-sm text-sky-600 hover:underline"
            >
              {customer.company.phone ?? customer.company.replyToEmail}
            </a>
          )}
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        {/* Flash messages */}
        {approved && (
          <div className="bg-green-50 border border-green-200 rounded-xl px-5 py-4 flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-green-900">Estimate approved!</p>
              <p className="text-sm text-green-700 mt-0.5">
                Thank you — {customer.company.name} has been notified and will be in touch to schedule your service.
              </p>
            </div>
          </div>
        )}
        {declined && (
          <div className="bg-gray-50 border border-gray-200 rounded-xl px-5 py-4 flex items-start gap-3">
            <XCircle className="w-5 h-5 text-gray-500 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-gray-900">Estimate declined.</p>
              <p className="text-sm text-gray-600 mt-0.5">
                {customer.company.name} has been notified. Check your messages for follow-up.
              </p>
            </div>
          </div>
        )}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-5 py-4 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            <p className="text-sm text-red-700">{errorMsg[error] ?? "Something went wrong."}</p>
          </div>
        )}

        {/* Estimate document */}
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          {/* Amber header strip */}
          <div className="border-b-4 border-amber-700 bg-white px-6 py-5 flex items-center justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-widest text-gray-400 font-semibold">Estimate</p>
              <p className="text-xl font-bold text-gray-900">{estimate.estimateNumber}</p>
              {estimate.validUntil && (
                <p className="text-xs text-gray-400 mt-0.5">
                  Valid until {formatDate(estimate.validUntil)}
                  {isExpired && <span className="ml-1 text-red-500 font-medium">(expired)</span>}
                </p>
              )}
            </div>
            <div className="text-right text-sm">
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Prepared for</p>
              <p className="font-semibold text-gray-900">{customer.firstName} {customer.lastName}</p>
              <p className="text-xs text-gray-400">Issued {formatDate(estimate.createdAt)}</p>
            </div>
          </div>

          {/* Line items */}
          <div className="px-6 py-5">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-xs text-gray-400 uppercase tracking-wide">
                  <th className="pb-2 text-left font-medium">Description</th>
                  <th className="pb-2 text-center font-medium w-12">Qty</th>
                  <th className="pb-2 text-right font-medium w-24">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {estimate.items.map((item) => (
                  <tr key={item.id}>
                    <td className="py-2.5 text-gray-700">{item.description}</td>
                    <td className="py-2.5 text-center text-gray-500">{item.quantity}</td>
                    <td className="py-2.5 text-right font-medium text-gray-900">
                      {formatCurrency(item.quantity * item.unitPrice)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-gray-200">
                  <td colSpan={2} className="pt-3 text-right font-semibold text-gray-700 text-sm">Estimate Total</td>
                  <td className="pt-3 text-right text-lg font-bold text-gray-900">{formatCurrency(total)}</td>
                </tr>
              </tfoot>
            </table>
            {estimate.notes && (
              <div className="mt-4 bg-gray-50 rounded-lg p-3 text-sm text-gray-600">{estimate.notes}</div>
            )}
          </div>
        </div>

        {/* Approval status banner (already acted) */}
        {estimate.status === "accepted" && estimate.approvedAt && (
          <div className="bg-green-50 border border-green-200 rounded-xl overflow-hidden">
            <div className="px-5 py-4 flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 shrink-0" />
              <div>
                <p className="font-semibold text-green-900">Approved</p>
                <p className="text-sm text-green-700">
                  Signed by <strong>{estimate.signedByName}</strong> on {formatDate(estimate.approvedAt)}
                </p>
              </div>
            </div>
            {estimate.signatureData && (
              <div className="border-t border-green-100 px-5 py-4">
                <p className="text-xs text-green-700 mb-2 font-medium uppercase tracking-wide">Signature on file</p>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={estimate.signatureData}
                  alt="Customer signature"
                  className="max-h-24 border border-green-100 rounded bg-white p-2"
                />
              </div>
            )}
          </div>
        )}

        {estimate.status === "declined" && estimate.deniedAt && (
          <div className="bg-gray-50 border border-gray-200 rounded-xl px-5 py-4 flex items-start gap-3">
            <XCircle className="w-5 h-5 text-gray-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-gray-700">Declined on {formatDate(estimate.deniedAt)}</p>
              {estimate.denialReason && (
                <p className="text-sm text-gray-500 mt-1">{estimate.denialReason}</p>
              )}
            </div>
          </div>
        )}

        {estimate.status === "converted" && (
          <div className="bg-purple-50 border border-purple-200 rounded-xl px-5 py-4 flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-purple-600 shrink-0" />
            <p className="text-sm text-purple-800 font-medium">
              This estimate has been converted — work is scheduled. Check your invoices for billing details.
            </p>
          </div>
        )}

        {/* Expired but not yet acted */}
        {isExpired && estimate.status === "sent" && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-5 py-4 flex items-start gap-3">
            <Clock className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-amber-900">This estimate has expired.</p>
              <p className="text-sm text-amber-700 mt-0.5">
                Contact {customer.company.name} to request an updated estimate.
              </p>
            </div>
          </div>
        )}

        {/* Action forms — only when estimate is actionable */}
        {canAct && (
          <>
            {/* Approve section */}
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100">
                <h2 className="font-semibold text-gray-900">Approve this estimate</h2>
                <p className="text-sm text-gray-500 mt-0.5">
                  Sign below and enter your full name to authorize the work for {formatCurrency(total)}.
                </p>
              </div>
              <form action={approveEstimate} className="px-5 py-5 space-y-4">
                <input type="hidden" name="token"      value={token} />
                <input type="hidden" name="estimateId" value={id} />

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Your signature</label>
                  <SignaturePad name="signatureData" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Full name <span className="text-gray-400 font-normal">(typed)</span>
                  </label>
                  <input
                    type="text"
                    name="signedByName"
                    required
                    defaultValue={`${customer.firstName} ${customer.lastName}`}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-xl transition-colors text-sm"
                >
                  Sign & Approve Estimate
                </button>
                <p className="text-xs text-gray-400 text-center">
                  By approving you authorize {customer.company.name} to proceed with the above work at the stated price.
                </p>
              </form>
            </div>

            {/* Decline section */}
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100">
                <h2 className="font-semibold text-gray-900">Decline</h2>
                <p className="text-sm text-gray-500 mt-0.5">
                  Not ready to move forward? Let us know — we can revise the estimate.
                </p>
              </div>
              <form action={denyEstimate} className="px-5 py-5 space-y-3">
                <input type="hidden" name="token"      value={token} />
                <input type="hidden" name="estimateId" value={id} />
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Reason <span className="text-gray-400 font-normal">(optional)</span>
                  </label>
                  <textarea
                    name="reason"
                    rows={3}
                    placeholder="e.g. Price is too high, timing doesn't work, etc."
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-400 resize-none"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-white border border-gray-300 hover:border-red-400 hover:text-red-600 text-gray-600 font-medium py-2.5 rounded-xl transition-colors text-sm"
                >
                  Decline Estimate
                </button>
              </form>
            </div>
          </>
        )}

        <p className="text-center text-xs text-gray-400 pt-2">
          {customer.company.name} · Powered by PoolOS
        </p>
      </div>
    </div>
  )
}
