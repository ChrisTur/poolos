import type { Metadata } from "next"
import Link from "next/link"
import { CheckCircle2, XCircle, ChevronRight } from "lucide-react"
import MarketingNav from "@/components/marketing/MarketingNav"
import PricingSection from "@/components/marketing/PricingSection"
import { getPlansFromDb } from "@/lib/plans-db"
import { FEATURE_LABELS } from "@/lib/plans"
import { getActiveBanner } from "@/lib/banners"
import PromoBannerBar from "@/components/PromoBannerBar"

const BASE = process.env.NEXT_PUBLIC_APP_URL ?? "https://poolos.biz"

export const metadata: Metadata = {
  title: "Pricing — PoolOS Pool Service Software",
  description:
    "Simple, transparent pricing for pool service companies. Plans from $49/mo. 14-day free trial, no credit card required. Cancel anytime.",
  alternates: { canonical: `${BASE}/pricing` },
  openGraph: {
    title: "PoolOS Pricing — Pool Service Management Software",
    description: "Starter $49/mo · Pro $99/mo · Unlimited $199/mo. Start free for 14 days.",
  },
}

const FAQ = [
  {
    q: "What happens when my trial ends?",
    a: "After 14 days you'll be prompted to choose a plan. Your data is never deleted — customers, routes, and invoices are all waiting when you're ready to subscribe.",
  },
  {
    q: "Can I switch plans later?",
    a: "Yes, anytime from your billing settings. Stripe prorates the change automatically so you only pay for what you use.",
  },
  {
    q: "Do you offer annual billing?",
    a: "Yes — pay annually and get 2 months free (≈17% off). Toggle between monthly and annual right at checkout.",
  },
  {
    q: "What payment methods do you accept?",
    a: "All major credit and debit cards (Visa, Mastercard, Amex, Discover) through Stripe. No checks or wire transfers.",
  },
  {
    q: "Is there a contract or commitment?",
    a: "No contracts. Monthly plans cancel anytime with no further charges. Annual plans are billed upfront and won't auto-renew if cancelled.",
  },
  {
    q: "What counts toward the customer limit?",
    a: "Active customer profiles. Archived customers don't count. Starter supports up to 50 active customers; Pro up to 200; Unlimited has no cap.",
  },
]

const FEATURE_GROUP_ORDER: (keyof typeof FEATURE_LABELS)[] = [
  "invoicing",
  "routes",
  "customerPortal",
  "chemicalTracking",
  "emailNotifications",
  "reports",
  "csvExport",
  "bulkInvoicing",
  "fileAttachments",
  "customBranding",
]

export default async function PricingPage() {
  const [allPlans, banner] = await Promise.all([
    getPlansFromDb(),
    getActiveBanner("marketing"),
  ])
  const paidPlans = allPlans.filter((p) => p.id !== "trial")

  return (
    <div className="min-h-screen bg-white text-gray-900">
      <MarketingNav />
      {banner && <PromoBannerBar banner={banner} />}

      <main>
        {/* Hero */}
        <section className="py-16 sm:py-20 text-center px-4">
          <div className="max-w-2xl mx-auto">
            <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 tracking-tight mb-4">
              Simple, transparent pricing
            </h1>
            <p className="text-lg text-gray-500">
              Start free for 14 days — no credit card required. Switch or cancel anytime.
            </p>
          </div>
        </section>

        {/* Pricing cards */}
        <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
          <PricingSection plans={paidPlans} />
        </section>

        {/* Feature comparison table */}
        <section className="bg-gray-50 py-16 sm:py-20">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 text-center mb-3">
              Compare features
            </h2>
            <p className="text-center text-gray-500 mb-10">Everything included in every plan from day one.</p>

            <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white shadow-sm">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wide w-1/2">
                      Feature
                    </th>
                    {paidPlans.map((plan) => (
                      <th key={plan.id} className="px-4 py-4 text-center">
                        <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${plan.badge}`}>
                          {plan.label}
                        </span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {/* Limits */}
                  <tr className="bg-gray-50">
                    <td colSpan={paidPlans.length + 1} className="px-6 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wide">
                      Limits
                    </td>
                  </tr>
                  <tr>
                    <td className="px-6 py-3.5 text-gray-700">Active customers</td>
                    {paidPlans.map((plan) => (
                      <td key={plan.id} className="px-4 py-3.5 text-center font-semibold text-gray-900">
                        {plan.limits.customers === Infinity ? "Unlimited" : plan.limits.customers}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="px-6 py-3.5 text-gray-700">Staff accounts</td>
                    {paidPlans.map((plan) => (
                      <td key={plan.id} className="px-4 py-3.5 text-center font-semibold text-gray-900">
                        {plan.limits.staff === Infinity ? "Unlimited" : plan.limits.staff}
                      </td>
                    ))}
                  </tr>

                  {/* Features */}
                  <tr className="bg-gray-50">
                    <td colSpan={paidPlans.length + 1} className="px-6 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wide">
                      Features
                    </td>
                  </tr>
                  {FEATURE_GROUP_ORDER.map((key) => (
                    <tr key={key}>
                      <td className="px-6 py-3.5 text-gray-700">{FEATURE_LABELS[key]}</td>
                      {paidPlans.map((plan) => (
                        <td key={plan.id} className="px-4 py-3.5 text-center">
                          {plan.features[key]
                            ? <CheckCircle2 className="w-5 h-5 text-green-500 mx-auto" />
                            : <XCircle     className="w-5 h-5 text-gray-200 mx-auto" />}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-16 sm:py-20">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 text-center mb-10">
              Frequently asked questions
            </h2>
            <div className="divide-y divide-gray-200">
              {FAQ.map(({ q, a }) => (
                <div key={q} className="py-6">
                  <h3 className="text-base font-semibold text-gray-900 mb-2">{q}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{a}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Bottom CTA */}
        <section className="bg-sky-600 py-14 sm:py-16">
          <div className="max-w-2xl mx-auto px-4 text-center">
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">
              Ready to simplify your pool business?
            </h2>
            <p className="text-sky-100 mb-8 text-base">
              14 days free. No credit card. Cancel anytime.
            </p>
            <Link
              href="/register"
              className="inline-flex items-center gap-2 bg-white text-sky-700 font-bold text-sm px-8 py-3.5 rounded-xl hover:bg-sky-50 transition-colors"
            >
              Start your free trial
              <ChevronRight className="w-4 h-4" />
            </Link>
            <p className="text-sky-200 text-xs mt-4">
              Questions? Email{" "}
              <a href="mailto:hello@poolos.biz" className="underline hover:text-white">
                hello@poolos.biz
              </a>
            </p>
          </div>
        </section>
      </main>

      {/* Minimal footer */}
      <footer className="py-8 border-t border-gray-100 text-center text-xs text-gray-400">
        <p>© {new Date().getFullYear()} PoolOS. All rights reserved.</p>
        <div className="flex justify-center gap-4 mt-2">
          <Link href="/"        className="hover:text-gray-600">Home</Link>
          <Link href="/register" className="hover:text-gray-600">Sign up</Link>
          <Link href="/login"   className="hover:text-gray-600">Sign in</Link>
          <Link href="/privacy" className="hover:text-gray-600">Privacy</Link>
        </div>
      </footer>
    </div>
  )
}
