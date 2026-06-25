import { stripe } from "@/lib/stripe"
import { db } from "@/lib/db"
import { paymentLog } from "@/lib/logger"
import { NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig  = req.headers.get("stripe-signature")

  if (!sig) return NextResponse.json({ error: "No signature" }, { status: 400 })

  let event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch {
    paymentLog.warn("stripe webhook: invalid signature")
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
  }

  if (event.type === "payment_intent.succeeded") {
    const pi = event.data.object
    const invoiceId = pi.metadata?.invoiceId
    if (!invoiceId) {
      paymentLog.warn({ piId: pi.id }, "payment_intent.succeeded: no invoiceId in metadata")
      return NextResponse.json({ received: true })
    }

    const invoice = await db.invoice.findUnique({
      where: { id: invoiceId },
      include: { items: true, payments: true },
    })
    if (!invoice || invoice.status === "paid") {
      paymentLog.info({ invoiceId, status: invoice?.status ?? "not_found" }, "payment_intent.succeeded: skipped")
      return NextResponse.json({ received: true })
    }

    const total       = invoice.items.reduce((s, i) => s + i.quantity * i.unitPrice, 0)
    const alreadyPaid = invoice.payments.reduce((s, p) => s + p.amount, 0)
    const amountPaid  = pi.amount_received / 100

    // Only create payment record if this PI hasn't been recorded yet
    const existingPayment = await db.payment.findFirst({
      where: { invoiceId, reference: pi.id },
    })

    if (!existingPayment && amountPaid > 0) {
      await db.payment.create({
        data: {
          invoiceId,
          amount: amountPaid,
          method: "card",
          reference: pi.id,
          notes: "Paid online via Stripe",
        },
      })
      paymentLog.info({ invoiceId, piId: pi.id, amount: amountPaid }, "payment recorded")
    }

    const newTotal = alreadyPaid + amountPaid
    if (newTotal >= total - 0.01) {
      await db.invoice.update({
        where: { id: invoiceId },
        data: { status: "paid", paidAt: new Date() },
      })
      paymentLog.info({ invoiceId, total, paid: newTotal }, "invoice marked paid")
    }

    // If card was saved for auto-pay, store the payment method on the customer
    if (pi.setup_future_usage === "off_session" && pi.payment_method && pi.customer) {
      await db.customer.updateMany({
        where: { id: invoice.customerId },
        data: {
          autoPayEnabled: true,
          autoPayMethodId: typeof pi.payment_method === "string"
            ? pi.payment_method
            : pi.payment_method.id,
        },
      })
      paymentLog.info({ customerId: invoice.customerId }, "autopay method stored")
    }
  }

  return NextResponse.json({ received: true })
}
