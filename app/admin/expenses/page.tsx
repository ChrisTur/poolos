import { db } from "@/lib/db"
import { formatCurrency, formatDate } from "@/lib/utils"
import AddExpenseForm from "./AddExpenseForm"
import DeleteExpenseButton from "./DeleteExpenseButton"
import Link from "next/link"
import { Receipt, RefreshCw, Pencil } from "lucide-react"

export const dynamic = "force-dynamic"

const CATEGORY_LABELS: Record<string, string> = {
  cloud:   "Cloud Computing",
  email:   "Email Service",
  sem:     "Search Ads / SEM",
  saas:    "SaaS Tools",
  payroll: "Payroll / Contractors",
  other:   "Other",
}

const CATEGORY_BADGE: Record<string, string> = {
  cloud:   "bg-sky-100 text-sky-700",
  email:   "bg-purple-100 text-purple-700",
  sem:     "bg-amber-100 text-amber-700",
  saas:    "bg-emerald-100 text-emerald-700",
  payroll: "bg-rose-100 text-rose-700",
  other:   "bg-gray-100 text-gray-600",
}

export default async function AdminExpensesPage() {
  const expenses = await db.platformExpense.findMany({
    orderBy: { date: "desc" },
  })

  const now = new Date()
  const thisMonth = now.getMonth()
  const thisYear  = now.getFullYear()

  // ── Aggregates ────────────────────────────────────────────────────────────

  const mtdTotal = expenses
    .filter((e) => {
      const d = new Date(e.date)
      return d.getMonth() === thisMonth && d.getFullYear() === thisYear
    })
    .reduce((s, e) => s + e.amount, 0)

  const ytdTotal = expenses
    .filter((e) => new Date(e.date).getFullYear() === thisYear)
    .reduce((s, e) => s + e.amount, 0)

  // Monthly recurring burn — sum of all recurring monthly expenses + (annual / 12)
  const monthlyBurn = expenses
    .filter((e) => e.isRecurring)
    .reduce((s, e) => {
      if (e.frequency === "annual") return s + e.amount / 12
      return s + e.amount
    }, 0)

  // ── Category breakdown ────────────────────────────────────────────────────

  const byCategory: Record<string, number> = {}
  for (const e of expenses) {
    byCategory[e.category] = (byCategory[e.category] ?? 0) + e.amount
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Platform Expenses</h1>
        <p className="text-sm text-gray-400 mt-1">Track PoolOS operating costs — cloud, email, SEM, and more</p>
      </div>

      {/* ── KPI cards ──────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {[
          { label: "This Month", value: formatCurrency(mtdTotal), sub: "Month-to-date spend" },
          { label: "This Year",  value: formatCurrency(ytdTotal), sub: "Year-to-date spend" },
          { label: "Monthly Burn", value: formatCurrency(monthlyBurn), sub: "Recurring costs / month" },
        ].map(({ label, value, sub }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-200 px-4 py-3.5">
            <p className="text-xs text-gray-500 font-medium mb-1">{label}</p>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            <p className="text-xs text-gray-400 mt-0.5">{sub}</p>
          </div>
        ))}
      </div>

      {/* ── Add form ───────────────────────────────────────────────────────── */}
      <AddExpenseForm />

      {/* ── Category breakdown ─────────────────────────────────────────────── */}
      {Object.keys(byCategory).length > 1 && (
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="px-5 py-3 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900 text-sm">Spend by Category (all time)</h2>
          </div>
          <div className="divide-y divide-gray-50">
            {Object.entries(byCategory)
              .sort(([, a], [, b]) => b - a)
              .map(([cat, total]) => {
                const pct = expenses.length > 0
                  ? Math.round((total / expenses.reduce((s, e) => s + e.amount, 0)) * 100)
                  : 0
                return (
                  <div key={cat} className="flex items-center justify-between px-5 py-3 gap-4">
                    <div className="flex items-center gap-3">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${CATEGORY_BADGE[cat] ?? "bg-gray-100 text-gray-600"}`}>
                        {CATEGORY_LABELS[cat] ?? cat}
                      </span>
                    </div>
                    <div className="flex-1 bg-gray-100 rounded-full h-2 mx-4 hidden sm:block">
                      <div
                        className="bg-sky-500 h-2 rounded-full"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-sm font-semibold text-gray-900">{formatCurrency(total)}</span>
                      <span className="text-xs text-gray-400 ml-2">{pct}%</span>
                    </div>
                  </div>
                )
              })}
          </div>
        </div>
      )}

      {/* ── Expense list ───────────────────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="px-5 py-3 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900 text-sm">All Expenses ({expenses.length})</h2>
        </div>

        {expenses.length === 0 ? (
          <div className="text-center py-14">
            <Receipt className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-400">No expenses recorded yet.</p>
            <p className="text-xs text-gray-300 mt-1">Add your first expense above.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {expenses.map((e) => (
              <div key={e.id} className="flex items-center gap-3 px-5 py-3.5">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-medium text-gray-900 truncate">{e.description}</p>
                    {e.isRecurring && (
                      <span title={`Recurring ${e.frequency}`} className="inline-flex items-center gap-1 text-xs text-sky-600 bg-sky-50 px-1.5 py-0.5 rounded-full font-medium shrink-0">
                        <RefreshCw className="w-2.5 h-2.5" />
                        {e.frequency}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${CATEGORY_BADGE[e.category] ?? "bg-gray-100 text-gray-600"}`}>
                      {CATEGORY_LABELS[e.category] ?? e.category}
                    </span>
                    {e.vendor && <span className="text-xs text-gray-400">{e.vendor}</span>}
                    <span className="text-xs text-gray-300">{formatDate(e.date)}</span>
                  </div>
                  {e.notes && <p className="text-xs text-gray-400 mt-0.5 truncate">{e.notes}</p>}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-sm font-semibold text-gray-900">{formatCurrency(e.amount)}</span>
                  <Link
                    href={`/admin/expenses/${e.id}`}
                    className="p-1.5 text-gray-400 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition-colors"
                    title="Edit"
                  >
                    <Pencil className="w-4 h-4" />
                  </Link>
                  <DeleteExpenseButton id={e.id} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
