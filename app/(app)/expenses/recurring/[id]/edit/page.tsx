import { db } from "@/lib/db"
import { requireSession } from "@/lib/session"
import { notFound } from "next/navigation"
import Link from "next/link"
import { ChevronLeft } from "lucide-react"
import Card, { CardBody, CardHeader } from "@/components/ui/Card"
import Button from "@/components/ui/Button"
import { updateRecurringExpense } from "@/lib/actions/recurringExpenses"
import { EXPENSE_CATEGORIES } from "@/lib/expense-categories"

export const dynamic = "force-dynamic"

export default async function EditRecurringExpensePage({ params }: { params: Promise<{ id: string }> }) {
  const { companyId } = await requireSession()
  const { id } = await params

  const rec = await db.recurringExpense.findFirst({ where: { id, companyId } })
  if (!rec) notFound()

  const updateAction = updateRecurringExpense.bind(null, id)

  return (
    <div className="max-w-xl space-y-5">
      <div>
        <Link href="/expenses/recurring" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900 mb-3">
          <ChevronLeft className="w-4 h-4" /> Recurring Expenses
        </Link>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Edit Recurring Expense</h1>
      </div>

      <Card>
        <CardHeader><h2 className="font-semibold text-gray-900 text-sm">Expense Template</h2></CardHeader>
        <CardBody>
          <form action={updateAction} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description <span className="text-red-500">*</span></label>
              <input
                name="description"
                required
                defaultValue={rec.description}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount ($) <span className="text-red-500">*</span></label>
                <input
                  name="amount"
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  defaultValue={rec.amount}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Frequency</label>
                <select
                  name="frequency"
                  defaultValue={rec.frequency}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
                >
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="quarterly">Quarterly</option>
                  <option value="annual">Annual</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select
                  name="category"
                  defaultValue={rec.category}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
                >
                  {EXPENSE_CATEGORIES.map((c) => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  name="isActive"
                  defaultValue={rec.isActive ? "true" : "false"}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
                >
                  <option value="true">Active</option>
                  <option value="false">Paused</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Vendor</label>
                <input
                  name="vendor"
                  defaultValue={rec.vendor ?? ""}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  name="notes"
                  rows={2}
                  defaultValue={rec.notes ?? ""}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>
            </div>

            <Button type="submit" className="w-full">Save Changes</Button>
          </form>
        </CardBody>
      </Card>
    </div>
  )
}
