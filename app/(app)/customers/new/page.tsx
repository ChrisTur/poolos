import Card, { CardBody, CardHeader } from "@/components/ui/Card"
import CustomerForm from "@/components/customers/CustomerForm"
import { createCustomer } from "@/lib/actions/customers"
import Link from "next/link"
import { ChevronLeft } from "lucide-react"

export default function NewCustomerPage() {
  return (
    <div className="max-w-2xl space-y-5">
      <div>
        <Link href="/customers" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900 mb-3">
          <ChevronLeft className="w-4 h-4" /> Customers
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">New Customer</h1>
      </div>
      <Card>
        <CardHeader>
          <p className="text-sm text-gray-500">Fill in the customer&apos;s details below.</p>
        </CardHeader>
        <CardBody>
          <CustomerForm action={createCustomer} submitLabel="Create Customer" />
        </CardBody>
      </Card>
    </div>
  )
}
