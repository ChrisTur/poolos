"use client"

import { useState } from "react"
import Link from "next/link"
import { CheckCircle2 } from "lucide-react"
import { PLANS } from "@/lib/plans"

const plans = [PLANS.starter, PLANS.pro, PLANS.unlimited]

export default function PricingSection() {
  const [annual, setAnnual] = useState(false)

  return (
    <>
      {/* Billing period toggle */}
      <div className="flex items-center justify-center gap-3 mb-10 sm:mb-14">
        <span className={`text-sm font-medium transition-colors ${!annual ? "text-gray-900" : "text-gray-400"}`}>
          Monthly
        </span>
        <button
          onClick={() => setAnnual(!annual)}
          aria-label="Toggle annual billing"
          className={`relative w-11 h-6 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 ${
            annual ? "bg-sky-600" : "bg-gray-200"
          }`}
        >
          <span
            className={`absolute left-0 top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-200 ${
              annual ? "translate-x-6" : "translate-x-1"
            }`}
          />
        </button>
        <span className={`text-sm font-medium transition-colors ${annual ? "text-gray-900" : "text-gray-400"}`}>
          Annual{" "}
          <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-semibold align-middle">
            2 months free
          </span>
        </span>
      </div>

      {/* Pricing cards */}
      <div className="grid sm:grid-cols-3 gap-4 sm:gap-6 items-start">
        {plans.map((plan) => {
          const displayPrice =
            annual && plan.priceAnnual != null
              ? Math.round(plan.priceAnnual / 12)
              : plan.priceMonthly
          const annualSavings =
            annual && plan.priceAnnual != null && plan.priceMonthly != null
              ? plan.priceMonthly * 12 - plan.priceAnnual
              : null

          return (
            <div
              key={plan.id}
              className={`rounded-2xl p-6 sm:p-7 border flex flex-col ${
                plan.mostPopular
                  ? "bg-sky-600 text-white border-sky-600 shadow-xl shadow-sky-200 sm:-mt-3 sm:-mb-3"
                  : "bg-white text-gray-900 border-gray-200"
              }`}
            >
              <div className="mb-5">
                {plan.mostPopular && (
                  <span className="text-xs font-semibold bg-white/20 text-white px-2.5 py-1 rounded-full mb-3 inline-block">
                    Most popular
                  </span>
                )}
                <p className={`text-sm font-semibold mb-1 ${plan.mostPopular ? "text-sky-100" : "text-gray-500"}`}>
                  {plan.label}
                </p>
                <div className="flex items-end gap-1">
                  <span className="text-4xl font-extrabold">
                    {displayPrice != null ? `$${displayPrice}` : "Free"}
                  </span>
                  {displayPrice != null && (
                    <span className={`text-sm mb-1 ${plan.mostPopular ? "text-sky-200" : "text-gray-400"}`}>
                      /mo
                    </span>
                  )}
                </div>
                {annualSavings != null ? (
                  <p className={`text-xs mt-1.5 ${plan.mostPopular ? "text-sky-200" : "text-gray-400"}`}>
                    billed as ${plan.priceAnnual}/yr · save ${annualSavings}
                  </p>
                ) : (
                  <p className={`text-sm mt-2 ${plan.mostPopular ? "text-sky-100" : "text-gray-400"}`}>
                    {plan.description}
                  </p>
                )}
              </div>

              <ul className="space-y-2.5 flex-1 mb-6">
                {plan.highlights.map((h) => (
                  <li
                    key={h}
                    className={`flex items-center gap-2 text-sm ${plan.mostPopular ? "text-white" : "text-gray-600"}`}
                  >
                    <CheckCircle2
                      className={`w-4 h-4 shrink-0 ${plan.mostPopular ? "text-sky-200" : "text-sky-500"}`}
                    />
                    {h}
                  </li>
                ))}
              </ul>

              <Link
                href="/register"
                className={`block text-center py-3 rounded-xl text-sm font-semibold transition-colors ${
                  plan.mostPopular
                    ? "bg-white text-sky-600 hover:bg-sky-50"
                    : "bg-sky-600 text-white hover:bg-sky-700"
                }`}
              >
                Start free trial
              </Link>
            </div>
          )
        })}
      </div>
    </>
  )
}
