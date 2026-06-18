import { db } from "@/lib/db"
import { requireSession } from "@/lib/session"
import Link from "next/link"
import { Plus, ChevronLeft, Pencil, Trash2, FileEdit } from "lucide-react"
import Card, { CardBody, CardHeader } from "@/components/ui/Card"
import Button from "@/components/ui/Button"
import { formatCurrency } from "@/lib/utils"
import { deleteTemplate } from "@/lib/actions/estimateTemplates"

export const dynamic = "force-dynamic"

export default async function EstimateTemplatesPage() {
  const { companyId } = await requireSession()

  const templates = await db.estimateTemplate.findMany({
    where: { companyId },
    orderBy: { name: "asc" },
    include: { items: true },
  })

  return (
    <div className="max-w-2xl space-y-5">
      <div>
        <Link href="/estimates" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900 mb-3">
          <ChevronLeft className="w-4 h-4" /> Estimates
        </Link>
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Estimate Templates</h1>
            <p className="text-sm text-gray-500 mt-0.5">Reusable starting points for common jobs.</p>
          </div>
          <Link href="/estimates/templates/new">
            <Button size="sm" className="bg-amber-600 hover:bg-amber-700 focus:ring-amber-500">
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">New Template</span>
              <span className="sm:hidden">New</span>
            </Button>
          </Link>
        </div>
      </div>

      {templates.length === 0 ? (
        <Card>
          <CardBody className="py-12 text-center space-y-2">
            <FileEdit className="w-8 h-8 text-gray-300 mx-auto" />
            <p className="text-gray-400 text-sm">No templates yet.</p>
            <Link href="/estimates/templates/new" className="text-sm text-amber-600 hover:underline">
              Create your first template
            </Link>
          </CardBody>
        </Card>
      ) : (
        <div className="space-y-3">
          {templates.map((tpl) => {
            const total = tpl.items.reduce((s, i) => s + i.quantity * i.unitPrice, 0)
            const deleteAction = deleteTemplate.bind(null, tpl.id)
            return (
              <Card key={tpl.id}>
                <CardHeader>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h2 className="font-semibold text-gray-900">{tpl.name}</h2>
                      {tpl.description && (
                        <p className="text-xs text-gray-500 mt-0.5">{tpl.description}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Link href={`/estimates/templates/${tpl.id}/edit`}>
                        <Button size="sm" variant="secondary">
                          <Pencil className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Edit</span>
                        </Button>
                      </Link>
                      <form action={deleteAction}>
                        <button
                          type="submit"
                          className="p-1.5 text-gray-300 hover:text-red-500 transition-colors"
                          aria-label="Delete template"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </form>
                    </div>
                  </div>
                </CardHeader>
                <div className="divide-y divide-gray-50">
                  {tpl.items.map((item) => (
                    <div key={item.id} className="flex items-center justify-between px-4 sm:px-5 py-2 text-sm">
                      <span className="text-gray-700">{item.description}</span>
                      <span className="text-gray-500 shrink-0 ml-4">
                        {item.quantity !== 1 && <span className="text-gray-400 mr-2">{item.quantity}×</span>}
                        {formatCurrency(item.unitPrice)}
                      </span>
                    </div>
                  ))}
                  {total > 0 && (
                    <div className="flex items-center justify-between px-4 sm:px-5 py-2.5">
                      <span className="text-xs text-gray-400 uppercase tracking-wide">Total</span>
                      <span className="font-semibold text-gray-900">{formatCurrency(total)}</span>
                    </div>
                  )}
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
