import { db } from "@/lib/db"
import { requireSession } from "@/lib/session"
import { createDueRecurringExpenses } from "@/lib/actions/recurringExpenses"
import Link from "next/link"
import { Plus, Pencil, Trash2, Download, RefreshCw } from "lucide-react"
import Card from "@/components/ui/Card"
import Button from "@/components/ui/Button"
import { formatCurrency, formatDate } from "@/lib/utils"
import { deleteExpense } from "@/lib/actions/expenses"
import { EXPENSE_CATEGORIES } from "@/lib/expense-categories"

export const dynamic = "force-dynamic"

const PERIODS = [
  { key: "30d", label: "Last 30 days" },
  { key: "90d", label: "Last 90 days" },
  { key: "ytd", label: "Year to date" },
  { key: "all", label: "All time" },
]

function getPeriodStart(period: string): Date {
  const now = new Date()
  if (period === "30d") return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  if (period === "90d") return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
  if (period === "ytd") return new Date(now.getFullYear(), 0, 1)
  return new Date(0)
}

const CATEGORY_COLORS: Record<string, string> = {
  chemicals: "bg-blue-50 text-blue-700",
  equipment: "bg-orange-50 text-orange-700",
  labor:     "bg-purple-50 text-purple-700",
  fuel:      "bg-yellow-50 text-yellow-700",
  supplies:  "bg-green-50 text-green-700",
  office:    "bg-gray-100 text-gray-600",
  other:     "bg-gray-100 text-gray-600",
}

export default async function ExpensesPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; period?: string }>
}) {
  const { companyId } = await requireSession()
  const { category, period = "30d" } = await searchParams
  const periodStart = getPeriodStart(period)

  // Lazy-create any overdue recurring expenses
  await createDueRecurringExpenses(companyId)

  const where = {
    companyId,
    date: { gte: periodStart },
    ...(category && category !== "all" ? { category } : {}),
  }

  const expenses = await db.expense.findMany({
    where,
    orderBy: { date: "desc" },
  })

  const total = expenses.reduce((s, e) => s + e.amount, 0)

  // Category totals for the tab counts (always for the period, ignoring category filter)
  const allInPeriod = await db.expense.findMany({
    where: { companyId, date: { gte: periodStart } },
    select: { category: true, amount: true },
  })
  const categoryTotals = new Map<string, number>()
  for (const e of allInPeriod) {
    categoryTotals.set(e.category, (categoryTotals.get(e.category) ?? 0) + e.amount)
  }
  const periodTotal = allInPeriod.reduce((s, e) => s + e.amount, 0)

  const categoryLabel = (val: string) =>
    EXPENSE_CATEGORIES.find((c) => c.value === val)?.label ?? val

  return (
    <div className="space-y-4 sm:space-y-5">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Expenses</h1>
          <p className="text-sm text-gray-500 mt-0.5">{formatCurrency(total)} in this view</p>
        </div>
        <div className="flex gap-2">
          <a href="/api/export/expenses" download>
            <Button size="sm" variant="secondary">
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Export</span>
            </Button>
          </a>
          <Link href="/expenses/recurring">
            <Button size="sm" variant="secondary">
              <RefreshCw className="w-4 h-4" />
              <span className="hidden sm:inline">Recurring</span>
            </Button>
          </Link>
          <Link href="/expenses/vendors">
            <Button size="sm" variant="secondary">Vendors</Button>
          </Link>
          <Link href="/expenses/new">
            <Button size="sm">
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Add Expense</span>
              <span className="sm:hidden">Add</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Period tabs */}
      <div className="flex gap-1 flex-wrap">
        {PERIODS.map((p) => (
          <Link
            key={p.key}
            href={`/expenses?period=${p.key}${category ? `&category=${category}` : ""}`}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              period === p.key ? "bg-sky-600 text-white" : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            {p.label}
          </Link>
        ))}
      </div>

      {/* Category summary cards */}
      {allInPeriod.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <Link href={`/expenses?period=${period}`}>
            <div className={`rounded-lg border px-3 py-2.5 cursor-pointer transition-colors ${!category || category === "all" ? "border-sky-500 bg-sky-50" : "border-gray-200 hover:bg-gray-50"}`}>
              <p className="text-xs text-gray-500">All</p>
              <p className="text-sm font-bold text-gray-900 mt-0.5">{formatCurrency(periodTotal)}</p>
            </div>
          </Link>
          {[...categoryTotals.entries()].sort((a, b) => b[1] - a[1]).map(([cat, amt]) => (
            <Link key={cat} href={`/expenses?period=${period}&category=${cat}`}>
              <div className={`rounded-lg border px-3 py-2.5 cursor-pointer transition-colors ${category === cat ? "border-sky-500 bg-sky-50" : "border-gray-200 hover:bg-gray-50"}`}>
                <p className="text-xs text-gray-500 truncate">{categoryLabel(cat)}</p>
                <p className="text-sm font-bold text-gray-900 mt-0.5">{formatCurrency(amt)}</p>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Mobile list */}
      <div className="sm:hidden space-y-2">
        {expenses.length === 0 ? (
          <Card>
            <div className="py-12 text-center">
              <p className="text-gray-400 text-sm">No expenses found.</p>
              <Link href="/expenses/new" className="mt-3 inline-block text-sm text-sky-600 hover:underline">
                Add your first expense
              </Link>
            </div>
          </Card>
        ) : (
          expenses.map((exp) => {
            const deleteAction = deleteExpense.bind(null, exp.id)
            return (
              <Card key={exp.id} className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium text-gray-900 text-sm truncate">{exp.description}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{formatDate(exp.date)}{exp.vendor && ` · ${exp.vendor}`}</p>
                    <span className={`inline-block mt-1.5 rounded-full px-2 py-0.5 text-xs font-medium ${CATEGORY_COLORS[exp.category] ?? "bg-gray-100 text-gray-600"}`}>
                      {categoryLabel(exp.category)}
                    </span>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-semibold text-gray-900">{formatCurrency(exp.amount)}</p>
                    <div className="flex gap-2 mt-2 justify-end">
                      <Link href={`/expenses/${exp.id}/edit`}>
                        <Button size="sm" variant="secondary"><Pencil className="w-3.5 h-3.5" /></Button>
                      </Link>
                      <form action={deleteAction}>
                        <button type="submit" className="p-1.5 text-gray-300 hover:text-red-500 transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </form>
                    </div>
                  </div>
                </div>
              </Card>
            )
          })
        )}
      </div>

      {/* Desktop table */}
      <Card className="hidden sm:block">
        {expenses.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-gray-400 text-sm">No expenses found.</p>
            <Link href="/expenses/new" className="mt-3 inline-block text-sm text-sky-600 hover:underline">
              Add your first expense
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-xs text-gray-500 uppercase tracking-wide">
                  <th className="px-5 py-3 text-left font-medium">Date</th>
                  <th className="px-5 py-3 text-left font-medium">Description</th>
                  <th className="px-5 py-3 text-left font-medium">Category</th>
                  <th className="px-5 py-3 text-left font-medium hidden lg:table-cell">Vendor</th>
                  <th className="px-5 py-3 text-right font-medium">Amount</th>
                  <th className="px-5 py-3 text-right font-medium"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {expenses.map((exp) => {
                  const deleteAction = deleteExpense.bind(null, exp.id)
                  return (
                    <tr key={exp.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-3 text-gray-500 whitespace-nowrap">{formatDate(exp.date)}</td>
                      <td className="px-5 py-3 text-gray-900">
                        <p className="font-medium">{exp.description}</p>
                        {exp.notes && <p className="text-xs text-gray-400 mt-0.5 truncate max-w-xs">{exp.notes}</p>}
                      </td>
                      <td className="px-5 py-3">
                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${CATEGORY_COLORS[exp.category] ?? "bg-gray-100 text-gray-600"}`}>
                          {categoryLabel(exp.category)}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-gray-500 hidden lg:table-cell">{exp.vendor ?? "—"}</td>
                      <td className="px-5 py-3 text-right font-semibold text-gray-900">{formatCurrency(exp.amount)}</td>
                      <td className="px-5 py-3 text-right">
                        <div className="flex items-center gap-2 justify-end">
                          <Link href={`/expenses/${exp.id}/edit`}>
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
                      </td>
                    </tr>
                  )
                })}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-gray-200">
                  <td colSpan={4} className="px-5 py-3 text-sm font-semibold text-gray-700">
                    Total {category && category !== "all" ? `(${categoryLabel(category)})` : ""}
                  </td>
                  <td className="px-5 py-3 text-right text-sm font-bold text-gray-900">{formatCurrency(total)}</td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}
