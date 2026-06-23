"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import type { Plan } from "@/lib/plans"
import { seedDefaultPlans } from "@/lib/actions/admin-plans"
import { Database } from "lucide-react"

interface Props {
  plans: Plan[]
  seededCount: number
}

export default function PlansSidebar({ plans, seededCount }: Props) {
  const pathname = usePathname()

  return (
    <aside className="w-44 shrink-0 space-y-1">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide px-2 mb-3">Plans</p>

      {plans.map((plan) => {
        const active = pathname === `/admin/plans/${plan.id}`
        return (
          <Link
            key={plan.id}
            href={`/admin/plans/${plan.id}`}
            className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              active
                ? "bg-gray-200 text-gray-900"
                : "text-gray-500 hover:bg-gray-100 hover:text-gray-800"
            }`}
          >
            <span>{plan.label}</span>
            <span className={`text-xs font-semibold px-1.5 py-0.5 rounded-full ${plan.badge}`}>
              {plan.priceMonthly != null ? `$${plan.priceMonthly}` : "Free"}
            </span>
          </Link>
        )
      })}

      {seededCount === 0 && (
        <div className="pt-3 border-t border-gray-200 mt-3">
          <form action={seedDefaultPlans}>
            <button
              type="submit"
              className="flex items-center gap-1.5 w-full px-3 py-2 rounded-lg text-xs font-medium text-amber-700 bg-amber-50 hover:bg-amber-100 transition-colors"
            >
              <Database className="w-3.5 h-3.5 shrink-0" />
              Seed defaults
            </button>
          </form>
          <p className="text-xs text-gray-400 mt-2 px-1 leading-relaxed">
            Using code defaults. Seed to enable editing.
          </p>
        </div>
      )}
    </aside>
  )
}
