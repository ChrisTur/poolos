"use server"

import { requireSuperAdmin } from "@/lib/session"
import { revalidatePath } from "next/cache"
import { db } from "@/lib/db"

// Called at the top of the admin expenses page — generates missing monthly
// PlatformExpense records for any recurring expenses whose last record
// predates the current month.
export async function createDuePlatformExpenses(): Promise<void> {
  const now = new Date()
  const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  const recurring = await db.platformExpense.findMany({
    where: { isRecurring: true },
    orderBy: { date: "asc" },
  })

  // Group by template key; keep all dates per group to find the most recent
  type Group = { template: typeof recurring[0]; latestDate: Date }
  const groups = new Map<string, Group>()
  for (const exp of recurring) {
    const key = `${exp.description}|||${exp.vendor ?? ""}|||${exp.amount}|||${exp.category}|||${exp.frequency}`
    const expDate = new Date(exp.date)
    if (!groups.has(key)) {
      groups.set(key, { template: exp, latestDate: expDate })
    } else {
      const g = groups.get(key)!
      if (expDate > g.latestDate) g.latestDate = expDate
    }
  }

  for (const [, { template, latestDate }] of groups) {
    if (template.frequency === "monthly") {
      // Generate a record for each month between latestDate+1 and startOfCurrentMonth
      let next = new Date(latestDate.getFullYear(), latestDate.getMonth() + 1, 1)
      while (next <= startOfCurrentMonth) {
        await db.platformExpense.create({
          data: {
            date:        next,
            category:    template.category,
            description: template.description,
            amount:      template.amount,
            vendor:      template.vendor,
            notes:       template.notes,
            isRecurring: true,
            frequency:   "monthly",
          },
        })
        next = new Date(next.getFullYear(), next.getMonth() + 1, 1)
      }
    } else if (template.frequency === "annual") {
      // Generate a record for each year between latestDate+1y and current year
      let nextYear = latestDate.getFullYear() + 1
      while (nextYear <= now.getFullYear()) {
        await db.platformExpense.create({
          data: {
            date:        new Date(nextYear, latestDate.getMonth(), 1),
            category:    template.category,
            description: template.description,
            amount:      template.amount,
            vendor:      template.vendor,
            notes:       template.notes,
            isRecurring: true,
            frequency:   "annual",
          },
        })
        nextYear++
      }
    }
  }
}

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

export async function updatePlatformExpense(
  id: string,
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

  await db.platformExpense.update({
    where: { id },
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
