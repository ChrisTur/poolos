import { db } from "@/lib/db"
import { notFound } from "next/navigation"
import EditExpenseForm from "./EditExpenseForm"
import Link from "next/link"
import { ChevronLeft } from "lucide-react"

type Props = { params: Promise<{ id: string }> }

export default async function EditExpensePage({ params }: Props) {
  const { id } = await params
  const expense = await db.platformExpense.findUnique({ where: { id } })
  if (!expense) notFound()

  return (
    <div className="max-w-2xl space-y-4">
      <div className="flex items-center gap-2">
        <Link href="/admin/expenses" className="text-sm text-gray-400 hover:text-gray-600 inline-flex items-center gap-1">
          <ChevronLeft className="w-4 h-4" />
          Expenses
        </Link>
      </div>
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Edit Expense</h1>
        <p className="text-sm text-gray-400 mt-1">{expense.description}</p>
      </div>
      <EditExpenseForm expense={expense} />
    </div>
  )
}
