import { requireSession } from "@/lib/session"
import Link from "next/link"
import { ChevronLeft } from "lucide-react"
import Card, { CardBody, CardHeader } from "@/components/ui/Card"
import { createTemplate } from "@/lib/actions/estimateTemplates"
import TemplateForm from "@/components/estimates/TemplateForm"

export const dynamic = "force-dynamic"

export default async function NewTemplatePage() {
  await requireSession()

  return (
    <div className="max-w-2xl space-y-5">
      <div>
        <Link href="/estimates/templates" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900 mb-3">
          <ChevronLeft className="w-4 h-4" /> Templates
        </Link>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">New Template</h1>
        <p className="text-sm text-gray-500 mt-0.5">Save a set of line items to reuse when creating estimates.</p>
      </div>

      <Card>
        <CardHeader><h2 className="font-semibold text-gray-900 text-sm">Template Details</h2></CardHeader>
        <CardBody>
          <TemplateForm action={createTemplate} />
        </CardBody>
      </Card>
    </div>
  )
}
