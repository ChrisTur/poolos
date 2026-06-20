import { requireSession } from "@/lib/session"
import { db } from "@/lib/db"
import { toCsv, csvResponse } from "@/lib/csv"
import { EXPENSE_CATEGORIES } from "@/lib/expense-categories"

const categoryLabel = (val: string) =>
  EXPENSE_CATEGORIES.find((c) => c.value === val)?.label ?? val

export async function GET(req: Request) {
  const { companyId } = await requireSession()
  const { searchParams } = new URL(req.url)
  const from = searchParams.get("from")
  const to = searchParams.get("to")
  const category = searchParams.get("category") || undefined

  const expenses = await db.expense.findMany({
    where: {
      companyId,
      ...(category && category !== "all" ? { category } : {}),
      ...(from || to
        ? {
            date: {
              ...(from ? { gte: new Date(from) } : {}),
              ...(to ? { lte: new Date(to + "T23:59:59") } : {}),
            },
          }
        : {}),
    },
    orderBy: { date: "desc" },
  })

  const rows = expenses.map((e) => ({
    "Date": e.date.toISOString().split("T")[0],
    "Vendor": e.vendor ?? "",
    "Category": categoryLabel(e.category),
    "Description": e.description,
    "Amount": e.amount.toFixed(2),
    "Notes": e.notes ?? "",
  }))

  return csvResponse(`expenses-${new Date().toISOString().split("T")[0]}.csv`, toCsv(rows))
}
