import { db } from "@/lib/db"
import { requireSession } from "@/lib/session"
import Card, { CardBody, CardHeader } from "@/components/ui/Card"
import { createEstimate } from "@/lib/actions/estimates"
import EstimateForm from "@/components/estimates/EstimateForm"

export const dynamic = "force-dynamic"

export default async function NewEstimatePage({
  searchParams,
}: {
  searchParams: Promise<{ customerId?: string }>
}) {
  const { companyId } = await requireSession()
  const { customerId } = await searchParams

  const [customers, , templates] = await Promise.all([
    db.customer.findMany({ where: { companyId, status: "active" }, orderBy: [{ lastName: "asc" }] }),
    db.company.findUnique({ where: { id: companyId }, select: { defaultDueDays: true } }),
    db.estimateTemplate.findMany({ where: { companyId }, orderBy: { name: "asc" }, include: { items: true } }),
  ])

  return (
    <div className="max-w-2xl space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">New Estimate</h1>
        <p className="text-sm text-gray-500 mt-1">Create a quote for a customer. You can convert it to an invoice once accepted.</p>
      </div>

      <Card>
        <CardHeader><h2 className="font-semibold text-gray-900 text-sm">Estimate Details</h2></CardHeader>
        <CardBody>
          <EstimateForm
            action={createEstimate}
            customers={customers}
            defaultCustomerId={customerId}
            templates={templates}
          />
        </CardBody>
      </Card>
    </div>
  )
}
