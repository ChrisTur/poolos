import { db } from "@/lib/db"
import { getPlansFromDb } from "@/lib/plans-db"
import PlansSidebar from "@/components/admin/PlansSidebar"

export const dynamic = "force-dynamic"

export default async function PlansLayout({ children }: { children: React.ReactNode }) {
  const [plans, seededCount] = await Promise.all([
    getPlansFromDb(),
    db.planConfig.count(),
  ])

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Plans</h1>
        <p className="text-sm text-gray-500 mt-1">Edit pricing, features, and limits for each plan.</p>
      </div>
      <div className="flex gap-8">
        <PlansSidebar plans={plans} seededCount={seededCount} />
        <div className="flex-1 min-w-0">{children}</div>
      </div>
    </div>
  )
}
