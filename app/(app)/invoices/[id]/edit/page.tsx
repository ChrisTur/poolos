import { db } from "@/lib/db"
import { requireSession } from "@/lib/session"
import { notFound } from "next/navigation"
import Link from "next/link"
import { ChevronLeft } from "lucide-react"
import Card, { CardBody, CardHeader } from "@/components/ui/Card"
import InvoiceForm from "@/components/invoices/InvoiceForm"
import { updateInvoice } from "@/lib/actions/invoices"

export const dynamic = "force-dynamic"

export default async function EditInvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const { companyId } = await requireSession()
  const { id } = await params

  const [invoice, company] = await Promise.all([
    db.invoice.findFirst({
      where: { id, companyId },
      include: { customer: true, items: true },
    }),
    db.company.findUnique({ where: { id: companyId }, select: { defaultDueDays: true } }),
  ])

  if (!invoice) notFound()

  const action = updateInvoice.bind(null, id)

  return (
    <div className="max-w-2xl space-y-5">
      <div>
        <Link href={`/invoices/${id}`} className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900 mb-3">
          <ChevronLeft className="w-4 h-4" /> {invoice.invoiceNumber}
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Edit Invoice</h1>
        <p className="text-sm text-gray-500 mt-1">
          {invoice.customer.firstName} {invoice.customer.lastName}
        </p>
      </div>

      <Card>
        <CardHeader>
          <p className="text-sm text-gray-500">Update line items or due date. Customer cannot be changed.</p>
        </CardHeader>
        <CardBody>
          <InvoiceForm
            action={action}
            customers={[]}
            hideCustomerSelect
            defaultDueDays={company?.defaultDueDays ?? 30}
            initialDueDate={invoice.dueDate.toISOString().split("T")[0]}
            initialServiceType={invoice.serviceType ?? ""}
            initialNotes={invoice.notes ?? ""}
            initialItems={invoice.items.map((item) => ({
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
