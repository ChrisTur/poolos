import { db } from "@/lib/db"
import { requireSession } from "@/lib/session"
import { notFound } from "next/navigation"
import Link from "next/link"
import { ChevronLeft } from "lucide-react"
import Card, { CardBody, CardHeader } from "@/components/ui/Card"
import Button from "@/components/ui/Button"
import { updateVendor } from "@/lib/actions/vendors"
import { EXPENSE_CATEGORIES } from "@/components/expenses/ExpenseForm"

export const dynamic = "force-dynamic"

export default async function EditVendorPage({ params }: { params: Promise<{ id: string }> }) {
  const { companyId } = await requireSession()
  const { id } = await params

  const vendor = await db.vendor.findFirst({ where: { id, companyId } })
  if (!vendor) notFound()

  const action = updateVendor.bind(null, id)

  return (
    <div className="max-w-md space-y-5">
      <div>
        <Link href="/expenses/vendors" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900 mb-3">
          <ChevronLeft className="w-4 h-4" /> Vendors
        </Link>
        <h1 className="text-xl font-bold text-gray-900">Edit Vendor</h1>
      </div>
      <Card>
        <CardHeader><h2 className="font-semibold text-gray-900 text-sm">{vendor.name}</h2></CardHeader>
        <CardBody>
          <form action={action} className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
              <input
                name="name"
                required
                defaultValue={vendor.name}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category <span className="font-normal text-gray-400">(optional)</span>
              </label>
              <select
                name="category"
                defaultValue={vendor.category ?? ""}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
              >
                <option value="">Any category</option>
                {EXPENSE_CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notes <span className="font-normal text-gray-400">(optional)</span>
              </label>
              <input
                name="notes"
                defaultValue={vendor.notes ?? ""}
                placeholder="Account number, website, phone…"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>
            <div className="flex gap-3 pt-1">
              <Button type="submit" size="sm">Save Changes</Button>
              <Button type="button" variant="secondary" size="sm" onClick={() => history.back()}>Cancel</Button>
            </div>
          </form>
        </CardBody>
      </Card>
    </div>
  )
}
