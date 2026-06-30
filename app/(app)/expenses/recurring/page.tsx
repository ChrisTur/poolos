import { db } from "@/lib/db"
import { requireSession } from "@/lib/session"
import Link from "next/link"
import { Plus, ChevronLeft, RefreshCw, Pencil, Trash2 } from "lucide-react"
import Card, { CardHeader, CardBody } from "@/components/ui/Card"
import Button from "@/components/ui/Button"
import { formatCurrency, formatDate } from "@/lib/utils"
import { deleteRecurringExpense } from "@/lib/actions/recurringExpenses"
import ConfirmButton from "@/components/ui/ConfirmButton"
import { EXPENSE_CATEGORIES } from "@/lib/expense-categories"

export const dynamic = "force-dynamic"

const FREQ_LABELS: Record<string, string> = {
  weekly:    "Weekly",
  monthly:   "Monthly",
  quarterly: "Quarterly",
  annual:    "Annual",
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

export default async function RecurringExpensesPage() {
  const { companyId } = await requireSession()

  const items = await db.recurringExpense.findMany({
    where: { companyId },
    orderBy: [{ isActive: "desc" }, { nextDueAt: "asc" }],
  })

  const active   = items.filter((i) => i.isActive)
  const inactive = items.filter((i) => !i.isActive)
  const now = new Date()
  const monthlyTotal = active.reduce((sum, r) => {
    const m = r.frequency === "weekly" ? r.amount * 4.33
            : r.frequency === "monthly" ? r.amount
            : r.frequency === "quarterly" ? r.amount / 3
            : r.amount / 12
    return sum + m
  }, 0)

  const categoryLabel = (val: string) => EXPENSE_CATEGORIES.find((c) => c.value === val)?.label ?? val

  return (
    <div className="space-y-5">
      <div>
        <Link href="/expenses" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900 mb-3">
          <ChevronLeft className="w-4 h-4" /> Expenses
        </Link>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Recurring Expenses</h1>
            {active.length > 0 && (
              <p className="text-sm text-gray-500 mt-0.5">~{formatCurrency(monthlyTotal)}/mo across {active.length} active template{active.length !== 1 ? "s" : ""}</p>
            )}
          </div>
          <Link href="/expenses/recurring/new">
            <Button size="sm"><Plus className="w-4 h-4" /> Add Recurring</Button>
          </Link>
        </div>
      </div>

      {items.length === 0 ? (
        <Card>
          <CardBody className="py-16 text-center">
            <RefreshCw className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">No recurring expenses set up yet.</p>
            <Link href="/expenses/recurring/new" className="mt-3 inline-block text-sm text-sky-600 hover:underline">
              Add your first recurring expense
            </Link>
          </CardBody>
        </Card>
      ) : (
        <div className="space-y-3">
          {[...active, ...inactive].map((rec) => {
            const deleteAction = deleteRecurringExpense.bind(null, rec.id)
            const isDue = rec.isActive && rec.nextDueAt <= now
            return (
              <Card key={rec.id} className={!rec.isActive ? "opacity-60" : ""}>
                <CardHeader>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-gray-900 text-sm">{rec.description}</span>
                      <span className={`text-xs font-medium rounded-full px-2 py-0.5 ${CATEGORY_COLORS[rec.category] ?? "bg-gray-100 text-gray-600"}`}>
                        {categoryLabel(rec.category)}
                      </span>
                      <span className="text-xs font-medium text-sky-700 bg-sky-50 border border-sky-200 rounded-full px-2 py-0.5">
                        {FREQ_LABELS[rec.frequency] ?? rec.frequency}
                      </span>
                      {!rec.isActive && (
                        <span className="text-xs text-gray-400 bg-gray-100 rounded-full px-2 py-0.5">Paused</span>
                      )}
                    </div>
                    <p className="text-sm text-gray-700 mt-0.5">
                      {formatCurrency(rec.amount)}
                      {rec.vendor && <span className="text-gray-400 font-normal"> · {rec.vendor}</span>}
                      <span className={`ml-2 text-xs ${isDue ? "text-red-600 font-semibold" : "text-gray-400"}`}>
                        {isDue ? "Overdue — auto-creates on next expense page load" : `Next: ${formatDate(rec.nextDueAt)}`}
                      </span>
                    </p>
                    {rec.lastCreatedAt && (
                      <p className="text-xs text-gray-400 mt-0.5">Last created: {formatDate(rec.lastCreatedAt)}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Link href={`/expenses/recurring/${rec.id}/edit`}>
                      <button className="text-gray-400 hover:text-sky-600 transition-colors" title="Edit">
                        <Pencil className="w-4 h-4" />
                      </button>
                    </Link>
                    <ConfirmButton action={deleteAction} confirm={`Delete "${rec.description}" recurring expense?`} variant="ghost" size="sm" className="text-gray-300 hover:text-red-500 !px-1 !py-1">
                      <Trash2 className="w-4 h-4" />
                    </ConfirmButton>
                  </div>
                </CardHeader>
                {rec.notes && (
                  <CardBody className="pt-0">
                    <p className="text-xs text-gray-500 italic">{rec.notes}</p>
                  </CardBody>
                )}
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
