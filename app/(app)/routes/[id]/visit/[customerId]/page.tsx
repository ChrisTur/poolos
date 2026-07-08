import { db } from "@/lib/db"
import { requireSession } from "@/lib/session"
import { notFound } from "next/navigation"
import Link from "next/link"
import { ChevronLeft } from "lucide-react"
import LogVisitForm from "@/components/schedule/LogVisitForm"

export const dynamic = "force-dynamic"

export default async function RouteVisitPage({
  params,
}: {
  params: Promise<{ id: string; customerId: string }>
}) {
  const { companyId, userId } = await requireSession()
  const { id: routeId, customerId } = await params

  const [route, customer, checklistItems, jobTemplates, users] = await Promise.all([
    db.route.findFirst({
      where: { id: routeId, companyId },
    }),
    db.customer.findFirst({
      where: { id: customerId, companyId },
      include: { equipment: { select: { type: true } } },
    }),
    db.visitChecklistItem.findMany({
      where: { companyId, isActive: true },
      orderBy: { position: "asc" },
    }),
    db.jobTemplate.findMany({
      where: { companyId, isActive: true },
      include: { steps: { orderBy: { position: "asc" } } },
      orderBy: { name: "asc" },
    }),
    db.user.findMany({
      where: { companyId, isActive: true },
      orderBy: [{ firstName: "asc" }],
      select: { id: true, firstName: true, lastName: true },
    }),
  ])

  if (!route || !customer) notFound()

  const defaultTechId = route.assignedUserId ?? userId ?? undefined

  return (
    <div className="max-w-lg mx-auto space-y-4">
      <div>
        <Link
          href={`/routes/${routeId}`}
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900 mb-3"
        >
          <ChevronLeft className="w-4 h-4" /> Back to {route.name}
        </Link>
        <h1 className="text-xl font-bold text-gray-900">
          {customer.firstName} {customer.lastName}
        </h1>
        <p className="text-sm text-gray-500 mt-0.5">{customer.address}, {customer.city}</p>
      </div>

      <LogVisitForm
        customers={[customer]}
        routes={[route]}
        checklistItems={checklistItems}
        jobTemplates={jobTemplates}
        users={users}
        defaultCustomerId={customerId}
        defaultRouteId={routeId}
        defaultTechnicianId={defaultTechId}
        redirectTo={`/routes/${routeId}`}
      />
    </div>
  )
}
