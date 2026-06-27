"use server"

import { db } from "@/lib/db"
import { requirePermission } from "@/lib/session"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

function parseDate(raw: string): Date {
  // Date inputs return YYYY-MM-DD — parse as local midnight to avoid UTC shift
  const [y, m, d] = raw.split("-").map(Number)
  return new Date(y, m - 1, d)
}

export async function createExpense(formData: FormData) {
  const { companyId } = await requirePermission("expenses.manage")

  await db.expense.create({
    data: {
      companyId,
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
