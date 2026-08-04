"use server"

import { requireSuperAdmin } from "@/lib/session"
import { revalidatePath } from "next/cache"
import { db } from "@/lib/db"

export type ExpenseFormState = { error?: string } | null

function revalidate() {
  revalidatePath("/admin/expenses")
  revalidatePath("/admin/reports")
}

export async function createPlatformExpense(
  _: ExpenseFormState,
  formData: FormData,
): Promise<ExpenseFormState> {
  await requireSuperAdmin()

  const description = (formData.get("description") as string)?.trim()
  const amountRaw   = (formData.get("amount") as string)?.trim()
  const category    = (formData.get("category") as string)?.trim()
  const dateRaw     = (formData.get("date") as string)?.trim()

  if (!description || !amountRaw || !category || !dateRaw) {
    return { error: "Description, amount, category, and date are required." }
  }

  const amount = parseFloat(amountRaw)
  if (isNaN(amount) || amount <= 0) {
    return { error: "Amount must be a positive number." }
  }

  const isRecurring = formData.get("isRecurring") === "true"
  const frequency   = isRecurring ? ((formData.get("frequency") as string) || "monthly") : null

  await db.platformExpense.create({
    data: {
      date:        new Date(dateRaw),
      description,
      amount,
      category,
      vendor:      (formData.get("vendor") as string)?.trim() || null,
      notes:       (formData.get("notes") as string)?.trim() || null,
      isRecurring,
      frequency,
    },
  })

  revalidate()
  return null
}

export async function deletePlatformExpense(id: string): Promise<void> {
  await requireSuperAdmin()
  await db.platformExpense.delete({ where: { id } })
  revalidate()
}
