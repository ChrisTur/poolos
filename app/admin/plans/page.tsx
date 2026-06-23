import Link from "next/link"
import { getPlansFromDb } from "@/lib/plans-db"
import { seedDefaultPlans } from "@/lib/actions/admin-plans"
import { FEATURE_LABELS } from "@/lib/plans"
import { CheckCircle2, XCircle, Pencil, Database } from "lucide-react"
import { db } from "@/lib/db"

export const dynamic = "force-dynamic"

export default async function AdminPlansPage() {
  const [plans, seededCount] = await Promise.all([
    getPlansFromDb(),
    db.planConfig.count(),
  ])

  const featureKeys = Object.keys(FEATURE_LABELS) as (keyof typeof FEATURE_LABELS)[]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Plans</h1>
          <p className="text-sm text-gray-500 mt-1">Edit pricing, features, and limits for each plan.</p>
        </div>
        {seededCount === 0 && (
          <form action={seedDefaultPlans}>
            <button
              type="submit"
              className="flex items-center gap-2 bg-gray-800 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
            >
              <Database className="w-4 h-4" />
              Seed defaults
            </button>
          </form>
        )}
      </div>

      {seededCount === 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-800">
          No plan configuration in database yet — the app is using hardcoded defaults. Click <strong>Seed defaults</strong> to load them for editing.
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {plans.map((plan) => {
          const enabledCount = featureKeys.filter((k) => plan.features[k]).length
          return (
            <div key={plan.id} className="bg-white rounded-2xl border border-gray-200 p-5 flex flex-col gap-4">
              <div className="flex items-start justify-between">
                <div>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${plan.badge}`}>
                    {plan.label}
                  </span>
                  <p className="text-sm text-gray-500 mt-2">{plan.description}</p>
                </div>
                {plan.mostPopular && (
                  <span className="text-xs bg-sky-100 text-sky-700 font-semibold px-2 py-0.5 rounded-full shrink-0 ml-2">
                    Popular
                  </span>
                )}
              </div>

              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Monthly</span>
                  <span className="font-medium">{plan.priceMonthly != null ? `$${plan.priceMonthly}` : "Free"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Annual</span>
                  <span className="font-medium">{plan.priceAnnual != null ? `$${plan.priceAnnual}/yr` : "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Customers</span>
                  <span className="font-medium">{plan.limits.customers === Infinity ? "∞" : plan.limits.customers}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Staff</span>
                  <span className="font-medium">{plan.limits.staff === Infinity ? "∞" : plan.limits.staff}</span>
                </div>
              </div>

              <div className="space-y-1">
                {featureKeys.map((k) => (
                  <div key={k} className="flex items-center gap-2 text-xs">
                    {plan.features[k]
                      ? <CheckCircle2 className="w-3.5 h-3.5 text-green-500 shrink-0" />
                      : <XCircle     className="w-3.5 h-3.5 text-gray-300 shrink-0" />}
                    <span className={plan.features[k] ? "text-gray-700" : "text-gray-400"}>
                      {FEATURE_LABELS[k]}
                    </span>
                  </div>
                ))}
              </div>

              <div className="pt-2 mt-auto">
                <Link
                  href={`/admin/plans/${plan.id}`}
                  className="flex items-center justify-center gap-2 w-full bg-gray-100 hover:bg-gray-200 text-gray-800 text-sm font-medium py-2 rounded-xl transition-colors"
                >
                  <Pencil className="w-3.5 h-3.5" />
                  Edit plan
                </Link>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
