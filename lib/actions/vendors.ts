"use server"

import { db } from "@/lib/db"
import { requirePermission } from "@/lib/session"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

export async function createVendor(formData: FormData) {
  const { companyId } = await requirePermission("expenses.manage")

  await db.vendor.create({
    data: {
      companyId,
      name:     formData.get("name") as string,
      category: (formData.get("category") as string) || null,
      notes:    (formData.get("notes") as string) || null,
    },
  })

  revalidatePath("/expenses/vendors")
}

export async function updateVendor(id: string, formData: FormData) {
  const { companyId } = await requirePermission("expenses.manage")
  const v = await db.vendor.findFirst({ where: { id, companyId } })
  if (!v) return

  await db.vendor.update({
    where: { id },
    data: {
      name:     formData.get("name") as string,
      category: (formData.get("category") as string) || null,
      notes:    (formData.get("notes") as string) || null,
    },
  })

  revalidatePath("/expenses/vendors")
  redirect("/expenses/vendors")
}

export async function deleteVendor(id: string) {
  const { companyId } = await requirePermission("expenses.manage")
  const v = await db.vendor.findFirst({ where: { id, companyId } })
  if (!v) return
  await db.vendor.delete({ where: { id } })
  revalidatePath("/expenses/vendors")
}
