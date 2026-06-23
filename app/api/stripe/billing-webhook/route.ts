import { stripe } from "@/lib/stripe"
import { db } from "@/lib/db"
import { NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig  = req.headers.get("stripe-signature")

  if (!sig) return NextResponse.json({ error: "No signature" }, { status: 400 })

  let event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_BILLING_WEBHOOK_SECRET!)
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object
      if (session.mode !== "subscription") break

      const companyId = session.metadata?.companyId
      const planId    = session.metadata?.planId
      if (!companyId || !planId) break

      await db.company.update({
        where: { id: companyId },
        data: {
          plan:                 planId,
          stripePlatformCustId: typeof session.customer === "string" ? session.customer : undefined,
          stripeSubId:          typeof session.subscription === "string" ? session.subscription : undefined,
          stripeSubStatus:      "active",
          trialEndsAt:          null,
          planUpdatedAt:        new Date(),
        },
      })
      break
    }

    case "customer.subscription.updated": {
      const sub        = event.data.object
      const customerId = typeof sub.customer === "string" ? sub.customer : (sub.customer as any)?.id
      if (!customerId) break

      // Determine plan from price metadata if available
      const priceId = sub.items?.data?.[0]?.price?.id
      const planId  = priceId ? planFromPriceId(priceId) : undefined

      await db.company.updateMany({
        where: { stripePlatformCustId: customerId },
        data: {
          ...(planId ? { plan: planId } : {}),
          stripeSubId:     sub.id,
          stripeSubStatus: sub.status,
          planUpdatedAt:   new Date(),
        },
      })
      break
    }

    case "customer.subscription.deleted": {
      const sub        = event.data.object
      const customerId = typeof sub.customer === "string" ? sub.customer : (sub.customer as any)?.id
      if (!customerId) break

      await db.company.updateMany({
        where: { stripePlatformCustId: customerId },
        data: {
          plan:            "trial",
          stripeSubId:     null,
          stripeSubStatus: "canceled",
          planUpdatedAt:   new Date(),
        },
      })
      break
    }

    case "invoice.payment_failed": {
      const inv        = event.data.object
      const customerId = typeof inv.customer === "string" ? inv.customer : (inv.customer as any)?.id
      if (!customerId) break

      await db.company.updateMany({
        where: { stripePlatformCustId: customerId },
        data: { stripeSubStatus: "past_due" },
      })
      break
    }

    case "invoice.paid": {
      const inv        = event.data.object
      const customerId = typeof inv.customer === "string" ? inv.customer : (inv.customer as any)?.id
      if (!customerId) break

      await db.company.updateMany({
        where: { stripePlatformCustId: customerId },
        data: { stripeSubStatus: "active" },
      })
      break
    }
  }

  return NextResponse.json({ received: true })
}

function planFromPriceId(priceId: string): string | undefined {
  const map: Record<string, string | undefined> = {
    [process.env.STRIPE_STARTER_MONTHLY_PRICE_ID ?? ""]:  "starter",
    [process.env.STRIPE_STARTER_ANNUAL_PRICE_ID ?? ""]:   "starter",
    [process.env.STRIPE_PRO_MONTHLY_PRICE_ID ?? ""]:      "pro",
    [process.env.STRIPE_PRO_ANNUAL_PRICE_ID ?? ""]:       "pro",
    [process.env.STRIPE_UNLIMITED_MONTHLY_PRICE_ID ?? ""]: "unlimited",
    [process.env.STRIPE_UNLIMITED_ANNUAL_PRICE_ID ?? ""]:  "unlimited",
  }
  return map[priceId]
}
