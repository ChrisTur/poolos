import { requireSuperAdmin } from "@/lib/session"
import { db } from "@/lib/db"
import { toCsv, csvResponse } from "@/lib/csv"

const CATEGORY_LABELS: Record<string, string> = {
  cloud:   "Cloud Computing",
  email:   "Email Service",
  sem:     "Search Ads / SEM",
  saas:    "SaaS Tools",
  payroll: "Payroll / Contractors",
  other:   "Other",
}

export async function GET() {
  await requireSuperAdmin()

  const expenses = await db.platformExpense.findMany({
    orderBy: { date: "desc" },
  })

  const rows = expenses.map((e) => ({
    "Date":        e.date.toISOString().split("T")[0],
    "Vendor":      e.vendor ?? "",
    "Category":    CATEGORY_LABELS[e.category] ?? e.category,
    "Description": e.description,
    "Amount":      e.amount.toFixed(2),
    "Recurring":   e.isRecurring ? (e.frequency ?? "yes") : "no",
    "Notes":       e.notes ?? "",
  }))

  return csvResponse(`platform-expenses-${new Date().toISOString().split("T")[0]}.csv`, toCsv(rows))
}
