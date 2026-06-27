"use server"

import { stripe } from "@/lib/stripe"
import { requirePermission } from "@/lib/session"
import { db } from "@/lib/db"
import { redirect } from "next/navigation"

const BASE = process.env.NEXT_PUBLIC_APP_URL ?? "https://poolos.biz"

// Map planId + period to Stripe price IDs — set these in your environment variables
// after creating subscription products in the Stripe dashboard.
const PRICE_IDS: Record<string, Record<string, string | undefined>> = {
  starter: {
    monthly: process.env.STRIPE_STARTER_MONTHLY_PRICE_ID,
    annual:  process.env.STRIPE_STARTER_ANNUAL_PRICE_ID,
  },
  pro: {
    monthly: process.env.STRIPE_PRO_MONTHLY_PRICE_ID,
    annual:  process.env.STRIPE_PRO_ANNUAL_PRICE_ID,
  },
  unlimited: {
    monthly: process.env.STRIPE_UNLIMITED_MONTHLY_PRICE_ID,
    annual:  process.env.STRIPE_UNLIMITED_ANNUAL_PRICE_ID,
  },
}

// Grace: only offer the Stripe-level trial to companies that are still within
// their app-level trial window. Prevents double-dipping if a user upgrades,
// cancels, and tries to re-subscribe.
const TRIAL_DAYS = 14

export async function createCheckoutSession(formData: FormData) {
  const { companyId } = await requirePermission("settings.billing")
  const planId = formData.get("planId") as string
  const period = (formData.get("period") as string) === "annual" ? "annual" : "monthly"

  const priceId = PRICE_IDS[planId]?.[period]
  if (!priceId) throw new Error(`No Stripe price configured for ${planId}/${period}. Set STRIPE_${planId.toUpperCase()}_${period.toUpperCase()}_PRICE_ID.`)

  const company = await db.company.findUnique({
    where: { id: companyId },
    select: { stripePlatformCustId: true, plan: true, trialEndsAt: true },
  })
  if (!company) throw new Error("Company not found")

  // Only honour the Stripe trial if the company is still on an app-level trial
  // with time remaining — avoids charging users who upgrade mid-trial.
  const isStillInTrial =
    company.plan === "trial" &&
    company.trialEndsAt != null &&
    company.trialEndsAt > new Date()

  const trialDaysRemaining = isStillInTrial
    ? Math.max(1, Math.ceil((company.trialEndsAt!.getTime() - Date.now()) / 86_400_000))
    : undefined

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    payment_method_types: ["card"],
    line_items: [{ price: priceId, quantity: 1 }],
    allow_promotion_codes: true,
    metadata: { companyId, planId },
    ...(company.stripePlatformCustId
      ? { customer: company.stripePlatformCustId }
      : {}),
    ...(trialDaysRemaining != null
      ? { subscription_data: { trial_period_days: trialDaysRemaining } }
      : {}),
    success_url: `${BASE}/settings/billing?upgraded=1`,
    cancel_url:  `${BASE}/settings/billing`,
  })

  redirect(session.url!)
}

export async function createPortalSession() {
  const { companyId } = await requirePermission("settings.billing")

  const company = await db.company.findUnique({
    where: { id: companyId },
    select: { stripePlatformCustId: true },
  })

  if (!company?.stripePlatformCustId) {
    throw new Error("No billing account found. Please contact support.")
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: company.stripePlatformCustId,
    return_url: `${BASE}/settings/billing`,
  })

  redirect(session.url)
}
