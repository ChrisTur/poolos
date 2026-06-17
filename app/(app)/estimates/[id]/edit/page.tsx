import { db } from "@/lib/db"
import { requireSession } from "@/lib/session"
import { notFound } from "next/navigation"
import Link from "next/link"
import { ChevronLeft } from "lucide-react"
import Card, { CardBody, CardHeader } from "@/components/ui/Card"
import EstimateForm from "@/components/estimates/EstimateForm"
import { updateEstimate } from "@/lib/actions/estimates"

export const dynamic = "force-dynamic"

export default async function EditEstimatePage({ params }: { params: Promise<{ id: string }> }) {
  const { companyId } = await requireSession()
  const { id } = await params

  const estimate = await db.estimate.findFirst({
    where: { id, companyId },
    include: { customer: true, items: true },
  })
  if (!estimate) notFound()

  const action = updateEstimate.bind(null, id)

  return (
    <div className="max-w-2xl space-y-5">
      <div>
        <Link href={`/estimates/${id}`} className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900 mb-3">
          <ChevronLeft className="w-4 h-4" /> {estimate.estimateNumber}
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Edit Estimate</h1>
        <p className="text-sm text-gray-500 mt-1">
          {estimate.customer.firstName} {estimate.customer.lastName}
        </p>
      </div>

      <Card>
        <CardHeader>
          <p className="text-sm text-gray-500">Update line items, valid date, or notes. Customer cannot be changed.</p>
        </CardHeader>
        <CardBody>
          <EstimateForm
            action={action}
            customers={[]}
            hideCustomerSelect
            initialValidUntil={estimate.validUntil ? estimate.validUntil.toISOString().split("T")[0] : undefined}
            initialNotes={estimate.notes ?? ""}
            initialItems={estimate.items.map((item) => ({
              description: item.description,
              quantity: item.quantity.toString(),
              unitPrice: item.unitPrice.toString(),
            }))}
          />
        </CardBody>
      </Card>
    </div>
  )
}
