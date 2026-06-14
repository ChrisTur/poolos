import { db } from "@/lib/db"
import { requireSession } from "@/lib/session"
import { notFound } from "next/navigation"
import Link from "next/link"
import { ChevronLeft } from "lucide-react"
import Card, { CardBody, CardHeader } from "@/components/ui/Card"
import CustomerForm from "@/components/customers/CustomerForm"
import { updateCustomer } from "@/lib/actions/customers"

export const dynamic = "force-dynamic"

export default async function EditCustomerPage({ params }: { params: Promise<{ id: string }> }) {
  const { companyId } = await requireSession()
  const { id } = await params
  const customer = await db.customer.findFirst({ where: { id, companyId } })
  if (!customer) notFound()

  const action = updateCustomer.bind(null, id)

  return (
    <div className="max-w-2xl space-y-5">
      <div>
        <Link href={`/customers/${id}`} className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900 mb-3">
          <ChevronLeft className="w-4 h-4" /> {customer.firstName} {customer.lastName}
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Edit Customer</h1>
      </div>
      <Card>
        <CardHeader>
          <p className="text-sm text-gray-500">Update customer details below.</p>
        </CardHeader>
        <CardBody>
          <CustomerForm action={action} customer={customer} submitLabel="Save Changes" />
        </CardBody>
      </Card>
    </div>
  )
}
