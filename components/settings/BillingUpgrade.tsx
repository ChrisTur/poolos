"use client"

import { useState } from "react"
import { CheckCircle2 } from "lucide-react"
import type { Plan } from "@/lib/plans"
import { createCheckoutSession } from "@/lib/actions/billing"

export default function BillingUpgrade({ plans }: { plans: Plan[] }) {
  const [annual, setAnnual] = useState(false)

  return (
    <div>
      {/* Billing period toggle */}
      <div className="flex items-center gap-3 mb-6">
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

      <div className="grid sm:grid-cols-3 gap-4">
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
              className={`rounded-2xl p-5 border flex flex-col ${
                plan.mostPopular
                  ? "border-sky-500 ring-1 ring-sky-500"
                  : "border-gray-200"
              }`}
            >
              {plan.mostPopular && (
                <span className="text-xs font-semibold bg-sky-100 text-sky-700 px-2.5 py-1 rounded-full mb-3 self-start">
                  Most popular
                </span>
              )}
              <p className="text-sm font-semibold text-gray-500 mb-1">{plan.label}</p>
              <div className="flex items-end gap-1 mb-1">
                <span className="text-3xl font-extrabold text-gray-900">
                  ${displayPrice}
                </span>
                <span className="text-sm text-gray-400 mb-1">/mo</span>
              </div>
              {annualSavings != null ? (
                <p className="text-xs text-green-600 mb-3">
                  billed as ${plan.priceAnnual}/yr · save ${annualSavings}
                </p>
              ) : (
                <p className="text-xs text-gray-400 mb-3">{plan.description}</p>
              )}

              <ul className="space-y-1.5 flex-1 mb-5">
                {plan.highlights.map((h) => (
                  <li key={h} className="flex items-center gap-2 text-xs text-gray-600">
                    <CheckCircle2 className="w-3.5 h-3.5 text-sky-500 shrink-0" />
                    {h}
                  </li>
                ))}
              </ul>

              <form action={createCheckoutSession}>
                <input type="hidden" name="planId" value={plan.id} />
                <input type="hidden" name="period" value={annual ? "annual" : "monthly"} />
                <button
                  type="submit"
                  className={`w-full py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                    plan.mostPopular
                      ? "bg-sky-600 text-white hover:bg-sky-700"
                      : "bg-gray-100 text-gray-900 hover:bg-gray-200"
                  }`}
                >
                  Upgrade to {plan.label}
                </button>
              </form>
            </div>
          )
        })}
      </div>
    </div>
  )
}
