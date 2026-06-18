import { requireSession } from "@/lib/session"
import Link from "next/link"
import { ChevronLeft } from "lucide-react"
import Card, { CardBody, CardHeader } from "@/components/ui/Card"
import { createExpense } from "@/lib/actions/expenses"
import ExpenseForm from "@/components/expenses/ExpenseForm"

export const dynamic = "force-dynamic"

export default async function NewExpensePage() {
  await requireSession()

  return (
    <div className="max-w-xl space-y-5">
      <div>
        <Link href="/expenses" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900 mb-3">
          <ChevronLeft className="w-4 h-4" /> Expenses
        </Link>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Add Expense</h1>
      </div>
      <Card>
        <CardHeader><h2 className="font-semibold text-gray-900 text-sm">Expense Details</h2></CardHeader>
        <CardBody>
          <ExpenseForm action={createExpense} />
        </CardBody>
      </Card>
    </div>
  )
}
