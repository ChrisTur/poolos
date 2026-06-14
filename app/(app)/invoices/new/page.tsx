import { db } from "@/lib/db"
import { requireSession } from "@/lib/session"
import Link from "next/link"
import { ChevronLeft } from "lucide-react"
import Card, { CardBody, CardHeader } from "@/components/ui/Card"
import InvoiceForm from "@/components/invoices/InvoiceForm"
import { createInvoice } from "@/lib/actions/invoices"

export const dynamic = "force-dynamic"

export default async function NewInvoicePage({
  searchParams,
}: {
  searchParams: Promise<{ customerId?: string }>
}) {
  const { companyId } = await requireSession()
  const { customerId } = await searchParams

  const customers = await db.customer.findMany({
    where: { companyId, status: "active" },
    orderBy: [{ lastName: "asc" }],
  })

  return (
    <div className="max-w-2xl space-y-5">
      <div>
        <Link href="/invoices" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900 mb-3">
          <ChevronLeft className="w-4 h-4" /> Invoices
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">New Invoice</h1>
      </div>
      <Card>
        <CardHeader>
          <p className="text-sm text-gray-500">Add line items and set a due date.</p>
        </CardHeader>
        <CardBody>
          <InvoiceForm action={createInvoice} customers={customers} defaultCustomerId={customerId} />
        </CardBody>
      </Card>
    </div>
  )
}
