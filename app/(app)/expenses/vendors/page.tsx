import { db } from "@/lib/db"
import { requireSession } from "@/lib/session"
import Link from "next/link"
import { ChevronLeft, Pencil, Trash2 } from "lucide-react"
import Card, { CardBody, CardHeader } from "@/components/ui/Card"
import Button from "@/components/ui/Button"
import { createVendor, deleteVendor } from "@/lib/actions/vendors"
import { EXPENSE_CATEGORIES } from "@/components/expenses/ExpenseForm"

export const dynamic = "force-dynamic"

export default async function VendorsPage() {
  const { companyId } = await requireSession()

  const vendors = await db.vendor.findMany({
    where: { companyId },
    orderBy: { name: "asc" },
  })

  const categoryLabel = (val: string) =>
    EXPENSE_CATEGORIES.find((c) => c.value === val)?.label ?? val

  return (
    <div className="max-w-2xl space-y-5">
      <div>
        <Link href="/expenses" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900 mb-3">
          <ChevronLeft className="w-4 h-4" /> Expenses
        </Link>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Vendors</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Saved vendors appear as suggestions when adding expenses.
        </p>
      </div>

      {/* Add vendor form */}
      <Card>
        <CardHeader><h2 className="font-semibold text-gray-900 text-sm">Add Vendor</h2></CardHeader>
        <CardBody>
          <form action={createVendor} className="space-y-3">
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                <input
                  name="name"
                  required
                  placeholder="e.g. Pool Supply World"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category <span className="font-normal text-gray-400">(optional)</span>
                </label>
                <select
                  name="category"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
                >
                  <option value="">Any category</option>
                  {EXPENSE_CATEGORIES.map((c) => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notes <span className="font-normal text-gray-400">(optional)</span>
              </label>
              <input
                name="notes"
                placeholder="Account number, website, phone…"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>
            <Button type="submit" size="sm">Add Vendor</Button>
          </form>
        </CardBody>
      </Card>

      {/* Vendor list */}
      {vendors.length === 0 ? (
        <p className="text-center text-sm text-gray-400 py-8">No vendors yet — add one above.</p>
      ) : (
        <Card>
          <div className="divide-y divide-gray-50">
            {vendors.map((v) => {
              const deleteAction = deleteVendor.bind(null, v.id)
              return (
                <div key={v.id} className="flex items-start justify-between gap-3 px-5 py-4">
                  <div>
                    <p className="font-medium text-gray-900 text-sm">{v.name}</p>
                    {v.category && (
                      <p className="text-xs text-gray-400 mt-0.5">{categoryLabel(v.category)}</p>
                    )}
                    {v.notes && (
                      <p className="text-xs text-gray-500 mt-0.5 italic">{v.notes}</p>
                    )}
                  </div>
                  <div className="flex gap-2 shrink-0 items-center">
                    <Link href={`/expenses/vendors/${v.id}/edit`}>
                      <button className="text-gray-400 hover:text-sky-600 transition-colors" title="Edit">
                        <Pencil className="w-4 h-4" />
                      </button>
                    </Link>
                    <form action={deleteAction}>
                      <button type="submit" className="text-gray-300 hover:text-red-500 transition-colors" title="Delete">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </form>
                  </div>
                </div>
              )
            })}
          </div>
        </Card>
      )}
    </div>
  )
}
