import { db } from "@/lib/db"
import { requireSession } from "@/lib/session"
import { notFound } from "next/navigation"
import Link from "next/link"
import { ChevronLeft } from "lucide-react"
import Card, { CardBody, CardHeader } from "@/components/ui/Card"
import { updateTemplate } from "@/lib/actions/estimateTemplates"
import TemplateForm from "@/components/estimates/TemplateForm"

export const dynamic = "force-dynamic"

export default async function EditTemplatePage({ params }: { params: Promise<{ id: string }> }) {
  const { companyId } = await requireSession()
  const { id } = await params

  const tpl = await db.estimateTemplate.findFirst({
    where: { id, companyId },
    include: { items: true },
  })
  if (!tpl) notFound()

  const action = updateTemplate.bind(null, id)

  return (
    <div className="max-w-2xl space-y-5">
      <div>
        <Link href="/estimates/templates" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900 mb-3">
          <ChevronLeft className="w-4 h-4" /> Templates
        </Link>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Edit Template</h1>
        <p className="text-sm text-gray-500 mt-0.5">{tpl.name}</p>
      </div>

      <Card>
        <CardHeader><h2 className="font-semibold text-gray-900 text-sm">Template Details</h2></CardHeader>
        <CardBody>
          <TemplateForm
            action={action}
            initialName={tpl.name}
            initialDescription={tpl.description ?? ""}
            initialItems={tpl.items.map((i) => ({
              description: i.description,
              quantity: String(i.quantity),
              unitPrice: String(i.unitPrice),
            }))}
            submitLabel="Update Template"
          />
        </CardBody>
      </Card>
    </div>
  )
}
