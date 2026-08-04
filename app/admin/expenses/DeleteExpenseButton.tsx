"use client"

import { Trash2 } from "lucide-react"
import { deletePlatformExpense } from "@/lib/actions/platform-expenses"

export default function DeleteExpenseButton({ id }: { id: string }) {
  return (
    <button
      onClick={async () => {
        if (confirm("Delete this expense?")) await deletePlatformExpense(id)
      }}
      className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
      title="Delete"
    >
      <Trash2 className="w-4 h-4" />
    </button>
  )
}
