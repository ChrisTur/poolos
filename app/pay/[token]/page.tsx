import { db } from "@/lib/db"
import { stripe, stripePublishableKey } from "@/lib/stripe"
import { notFound } from "next/navigation"
import { formatCurrency, formatDate } from "@/lib/utils"
import PaymentForm from "@/components/stripe/PaymentForm"
import { CheckCircle } from "lucide-react"

export const dynamic = "force-dynamic"

export default async function PayInvoicePage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>
  searchParams: Promise<{ paid?: string }>
}) {
  const { token } = await params
  const { paid }  = await searchParams

  const invoice = await db.invoice.findUnique({
    where: { payToken: token },
    include: {
      items: true,
      payments: true,
      customer: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          stripeCustomerId: true,
          autoPayEnabled: true,
        },
      },
      company: {
        select: {
          name: true,
          logoUrl: true,
          phone: true,
          stripeAccountId: true,
          cardFeeEnabled: true,
          cardFeePercent: true,
          cardFeeFixed: true,
        },
      },
    },
  })

  if (!invoice) notFound()

  const total   = invoice.items.reduce((s, i) => s + i.quantity * i.unitPrice, 0)
  const paid_   = invoice.payments.reduce((s, p) => s + p.amount, 0)
  const balance = Math.max(0, Math.round((total - paid_) * 100) / 100)

  const alreadyPaid = invoice.status === "paid" || balance === 0 || paid === "1"

  // Card convenience fee
  const { cardFeeEnabled, cardFeePercent, cardFeeFixed } = invoice.company
  const cardFee = (cardFeeEnabled && !alreadyPaid && balance > 0)
    ? Math.round((balance * (cardFeePercent / 100) + cardFeeFixed) * 100) / 100
    : 0
  const chargeAmount = balance + cardFee

  // Stripe Connect not configured — show pay handles only
  const stripeReady = !!invoice.company.stripeAccountId && !alreadyPaid

  // Ensure Stripe Customer exists for auto-pay eligibility (requires customer email)
  let stripeCustomerId = invoice.customer.stripeCustomerId
  if (stripeReady && invoice.customer.email && !stripeCustomerId) {
    const stripeCustomer = await stripe.customers.create(
      {
        email: invoice.customer.email,
        name: `${invoice.customer.firstName} ${invoice.customer.lastName}`,
        metadata: { customerId: invoice.customer.id },
      },
      { stripeAccount: invoice.company.stripeAccountId! }
    )
    stripeCustomerId = stripeCustomer.id
    await db.customer.update({
      where: { id: invoice.customer.id },
      data: { stripeCustomerId },
    })
  }

  // Create or retrieve PaymentIntent
  let clientSecret: string | null = null
  if (stripeReady && balance > 0) {
    if (invoice.stripePaymentIntentId) {
      try {
        const pi = await stripe.paymentIntents.retrieve(
          invoice.stripePaymentIntentId,
          {},
          { stripeAccount: invoice.company.stripeAccountId! }
        )
        if (pi.status !== "succeeded" && pi.status !== "canceled") {
          clientSecret = pi.client_secret
        }
      } catch {
        // PI not found on this account — will create a new one below
      }
    }

    if (!clientSecret) {
      const piData: Parameters<typeof stripe.paymentIntents.create>[0] = {
        amount: Math.round(chargeAmount * 100),
        currency: "usd",
        automatic_payment_methods: { enabled: true },
        metadata: { invoiceId: invoice.id, payToken: token, companyId: invoice.companyId },
      }
      // Attach Stripe Customer and enable card saving when customer has email
      if (stripeCustomerId) {
        piData.customer = stripeCustomerId
        piData.setup_future_usage = "off_session"
      }
      const pi = await stripe.paymentIntents.create(
        piData,
        { stripeAccount: invoice.company.stripeAccountId! }
      )
      clientSecret = pi.client_secret

      await db.invoice.update({
        where: { id: invoice.id },
        data: { stripePaymentIntentId: pi.id },
      })
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center py-12 px-4">
      <div className="w-full max-w-md space-y-5">
        {/* Company header */}
        <div className="text-center">
          {invoice.company.logoUrl ? (
            <img src={invoice.company.logoUrl} alt={invoice.company.name} className="h-10 mx-auto mb-2 object-contain" />
          ) : (
            <p className="text-lg font-bold text-gray-900 mb-2">{invoice.company.name}</p>
          )}
        </div>

        {/* Invoice card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-100">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">{invoice.invoiceNumber}</p>
                <p className="font-semibold text-gray-900 mt-0.5">
                  {invoice.customer.firstName} {invoice.customer.lastName}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-400">Due {formatDate(invoice.dueDate)}</p>
                <p className="text-2xl font-bold text-gray-900 mt-0.5">{formatCurrency(balance)}</p>
              </div>
            </div>
          </div>

          {/* Line items */}
          <div className="px-6 py-4 space-y-2">
            {invoice.items.map((item) => (
              <div key={item.id} className="flex justify-between text-sm">
                <span className="text-gray-700">
                  {item.description}
                  {item.quantity !== 1 && (
                    <span className="text-gray-400 ml-1">× {item.quantity}</span>
                  )}
                </span>
                <span className="font-medium text-gray-900 tabular-nums">
                  {formatCurrency(item.quantity * item.unitPrice)}
                </span>
              </div>
            ))}
            {paid_ > 0 && (
              <div className="flex justify-between text-sm border-t border-gray-100 pt-2 mt-2">
                <span className="text-gray-500">Payments received</span>
                <span className="text-green-600">−{formatCurrency(paid_)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm font-semibold border-t border-gray-200 pt-2 mt-2">
              <span>Balance due</span>
              <span className="tabular-nums">{formatCurrency(balance)}</span>
            </div>
            {cardFee > 0 && (
              <>
                <div className="flex justify-between text-sm text-gray-500 mt-1">
                  <span>Card processing fee ({cardFeePercent}% + ${cardFeeFixed.toFixed(2)})</span>
                  <span className="tabular-nums">{formatCurrency(cardFee)}</span>
                </div>
                <div className="flex justify-between text-sm font-bold border-t border-gray-200 pt-2 mt-1">
                  <span>Total charged</span>
                  <span className="tabular-nums">{formatCurrency(chargeAmount)}</span>
                </div>
              </>
            )}
          </div>

          {/* Payment section */}
          <div className="px-6 pb-6">
            {alreadyPaid ? (
              <div className="flex items-center gap-2 rounded-lg bg-green-50 border border-green-200 px-4 py-3">
                <CheckCircle className="w-5 h-5 text-green-500 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-green-800">Payment received</p>
                  <p className="text-xs text-green-600 mt-0.5">This invoice has been paid. Thank you!</p>
                </div>
              </div>
            ) : clientSecret ? (
              <div className="pt-2">
                <p className="text-xs text-gray-500 mb-4 text-center">Secure payment powered by Stripe</p>
                <PaymentForm
                  clientSecret={clientSecret}
                  publishableKey={stripePublishableKey()}
                  stripeAccountId={invoice.company.stripeAccountId!}
                  amount={chargeAmount}
                />
              </div>
            ) : (
              <div className="rounded-lg bg-gray-50 border border-gray-200 px-4 py-3 text-sm text-gray-600 text-center">
                <p className="font-medium text-gray-700 mb-1">Contact us to pay</p>
                {invoice.company.phone && <p>{invoice.company.phone}</p>}
                <p className="text-xs text-gray-400 mt-1">Reference invoice {invoice.invoiceNumber}</p>
              </div>
            )}
          </div>
        </div>

        <p className="text-center text-xs text-gray-400">
          {invoice.company.name} · {invoice.invoiceNumber}
        </p>
      </div>
    </div>
  )
}
