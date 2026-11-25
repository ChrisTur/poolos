"use server"

import { db } from "@/lib/db"
import { requirePermission } from "@/lib/session"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { parseDate } from "@/lib/utils"

function nextDueDate(frequency: string, from: Date): Date {
  const d = new Date(from)
  if (frequency === "weekly")    d.setDate(d.getDate() + 7)
  else if (frequency === "monthly")   d.setMonth(d.getMonth() + 1)
  else if (frequency === "quarterly") d.setMonth(d.getMonth() + 3)
  else if (frequency === "annual")    d.setFullYear(d.getFullYear() + 1)
  return d
}

export async function createExpense(formData: FormData) {
  const { companyId } = await requirePermission("expenses.manage")

  const date        = parseDate(formData.get("date") as string)
  const category    = formData.get("category") as string
  const description = formData.get("description") as string
  const amount      = parseFloat(formData.get("amount") as string)
  const vendor      = (formData.get("vendor") as string) || null
  const notes       = (formData.get("notes") as string) || null

  await db.expense.create({ data: { companyId, date, category, description, amount, vendor, notes } })

  if (formData.get("isRecurring") === "true") {
    const frequency = (formData.get("frequency") as string) || "monthly"
    await db.recurringExpense.create({
      data: { companyId, description, amount, category, vendor, notes, frequency, nextDueAt: nextDueDate(frequency, date) },
    })
  }

  revalidatePath("/expenses")
  revalidatePath("/reports")
  redirect("/expenses")
}

export async function updateExpense(id: string, formData: FormData) {
  const { companyId } = await requirePermission("expenses.manage")
  const exp = await db.expense.findFirst({ where: { id, companyId } })
  if (!exp) return

  await db.expense.update({
    where: { id },
    data: {
      date:        parseDate(formData.get("date") as string),
      category:    formData.get("category") as string,
      description: formData.get("description") as string,
      amount:      parseFloat(formData.get("amount") as string),
      vendor:      (formData.get("vendor") as string) || null,
      notes:       (formData.get("notes") as string) || null,
    },
  })

  revalidatePath("/expenses")
  revalidatePath("/reports")
  redirect("/expenses")
}

export async function deleteExpense(id: string) {
  const { companyId } = await requirePermission("expenses.manage")
  const exp = await db.expense.findFirst({ where: { id, companyId } })
  if (!exp) return
  await db.expense.delete({ where: { id } })
  revalidatePath("/expenses")
  revalidatePath("/reports")
}
