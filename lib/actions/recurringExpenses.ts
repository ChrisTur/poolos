"use server"

import { db } from "@/lib/db"
import { requirePermission } from "@/lib/session"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

function parseDate(raw: string): Date {
  const [y, m, d] = raw.split("-").map(Number)
  return new Date(y, m - 1, d)
}

function nextDueDate(frequency: string, from: Date = new Date()): Date {
  const d = new Date(from)
  switch (frequency) {
    case "weekly":    d.setDate(d.getDate() + 7);   break
    case "monthly":   d.setMonth(d.getMonth() + 1); break
    case "quarterly": d.setMonth(d.getMonth() + 3); break
    case "annual":    d.setFullYear(d.getFullYear() + 1); break
  }
  return d
}

export async function createRecurringExpense(formData: FormData) {
  const { companyId } = await requirePermission("expenses.manage")

  const frequency = formData.get("frequency") as string
  const startDateRaw = formData.get("startDate") as string
  const firstDue = startDateRaw ? parseDate(startDateRaw) : new Date()

  await db.recurringExpense.create({
    data: {
      companyId,
      description: (formData.get("description") as string).trim(),
      amount:      parseFloat(formData.get("amount") as string),
      category:    formData.get("category") as string,
      vendor:      (formData.get("vendor") as string) || null,
      notes:       (formData.get("notes") as string) || null,
      frequency,
      nextDueAt: firstDue,
    },
  })

  revalidatePath("/expenses/recurring")
  redirect("/expenses/recurring")
}

export async function updateRecurringExpense(id: string, formData: FormData) {
  const { companyId } = await requirePermission("expenses.manage")
  const rec = await db.recurringExpense.findFirst({ where: { id, companyId } })
  if (!rec) return

  await db.recurringExpense.update({
    where: { id },
    data: {
      description: (formData.get("description") as string).trim(),
      amount:      parseFloat(formData.get("amount") as string),
      category:    formData.get("category") as string,
      vendor:      (formData.get("vendor") as string) || null,
      notes:       (formData.get("notes") as string) || null,
      frequency:   formData.get("frequency") as string,
      isActive:    formData.get("isActive") === "true",
    },
  })

  revalidatePath("/expenses/recurring")
  redirect("/expenses/recurring")
}

export async function deleteRecurringExpense(id: string) {
  const { companyId } = await requirePermission("expenses.manage")
  const rec = await db.recurringExpense.findFirst({ where: { id, companyId } })
  if (!rec) return
  await db.recurringExpense.delete({ where: { id } })
  revalidatePath("/expenses/recurring")
}

// Called at the top of the expenses page — creates any overdue recurring expenses
export async function createDueRecurringExpenses(companyId: string): Promise<number> {
  const now = new Date()
  const due = await db.recurringExpense.findMany({
    where: { companyId, isActive: true, nextDueAt: { lte: now } },
  })

  if (due.length === 0) return 0

  for (const rec of due) {
    await db.expense.create({
      data: {
        companyId,
        date:        rec.nextDueAt,
        category:    rec.category,
        description: rec.description,
        amount:      rec.amount,
        vendor:      rec.vendor,
        notes:       rec.notes ? `${rec.notes} (recurring)` : "(recurring)",
      },
    })

    await db.recurringExpense.update({
      where: { id: rec.id },
      data: {
        lastCreatedAt: rec.nextDueAt,
        nextDueAt:     nextDueDate(rec.frequency, rec.nextDueAt),
      },
    })
  }

  revalidatePath("/expenses")
  revalidatePath("/reports")
  return due.length
}
