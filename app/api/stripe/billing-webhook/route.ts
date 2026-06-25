import { stripe } from "@/lib/stripe"
import { db } from "@/lib/db"
import { NextRequest, NextResponse } from "next/server"
import { resend, FROM, buildDunningHtml, dunningSubject } from "@/lib/email"
import { getPlan } from "@/lib/plans"

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

      // Fetch the real subscription to get its actual status (may be "trialing"
      // rather than "active" when the company still has trial days remaining).
      const subId = typeof session.subscription === "string" ? session.subscription : null
      const sub   = subId ? await stripe.subscriptions.retrieve(subId) : null

      await db.company.update({
        where: { id: companyId },
        data: {
          plan:                 planId,
          stripePlatformCustId: typeof session.customer === "string" ? session.customer : undefined,
          stripeSubId:          subId ?? undefined,
          stripeSubStatus:      sub?.status ?? "active",
          trialEndsAt:          null,
          planUpdatedAt:        new Date(),
        },
      })
      break
    }

    case "customer.subscription.created":
    case "customer.subscription.updated": {
      const sub        = event.data.object
      const customerId = typeof sub.customer === "string" ? sub.customer : (sub.customer as { id?: string } | null)?.id
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
      const customerId = typeof sub.customer === "string" ? sub.customer : (sub.customer as { id?: string } | null)?.id
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
      const customerId = typeof inv.customer === "string" ? inv.customer : (inv.customer as { id?: string } | null)?.id
      if (!customerId) break

      const company = await db.company.findFirst({
        where: { stripePlatformCustId: customerId },
        select: { id: true, plan: true },
      })
      if (!company) break

      await db.company.update({
        where: { id: company.id },
        data: { stripeSubStatus: "past_due" },
      })

      // Send dunning email to the account owner
      const owner = await db.user.findFirst({
        where: { companyId: company.id, role: "owner" },
        select: { email: true, firstName: true },
      })
      if (owner?.email) {
        const attemptCount = (inv as unknown as { attempt_count?: number }).attempt_count ?? 1
        const planLabel    = getPlan(company.plan).label
        const billingUrl   = `${process.env.NEXT_PUBLIC_APP_URL ?? "https://poolos.biz"}/settings/billing`
        await resend.emails.send({
          from:    FROM,
          to:      owner.email,
          subject: dunningSubject(attemptCount),
          html:    buildDunningHtml({ firstName: owner.firstName ?? "there", planLabel, billingUrl, attemptCount }),
        })
      }
      break
    }

    case "invoice.paid": {
      const inv        = event.data.object
      const customerId = typeof inv.customer === "string" ? inv.customer : (inv.customer as { id?: string } | null)?.id
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
