"use server"

import { db } from "@/lib/db"
import { requirePermission } from "@/lib/session"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

export async function createInventoryItem(formData: FormData) {
  const { companyId } = await requirePermission("expenses.manage")

  await db.inventoryItem.create({
    data: {
      companyId,
      name:             (formData.get("name") as string).trim(),
      category:         formData.get("category") as string,
      unit:             formData.get("unit") as string,
      onHand:           parseFloat((formData.get("onHand") as string) || "0") || 0,
      lowStockThreshold:parseFloat((formData.get("lowStockThreshold") as string) || "0") || 0,
      reorderQty:       parseFloat((formData.get("reorderQty") as string) || "") || null,
      costPerUnit:      parseFloat((formData.get("costPerUnit") as string) || "") || null,
      notes:            (formData.get("notes") as string) || null,
    },
  })

  revalidatePath("/inventory")
  redirect("/inventory")
}

export async function updateInventoryItem(id: string, formData: FormData) {
  const { companyId } = await requirePermission("expenses.manage")
  const item = await db.inventoryItem.findFirst({ where: { id, companyId } })
  if (!item) return

  await db.inventoryItem.update({
    where: { id },
    data: {
      name:             (formData.get("name") as string).trim(),
      category:         formData.get("category") as string,
      unit:             formData.get("unit") as string,
      lowStockThreshold:parseFloat((formData.get("lowStockThreshold") as string) || "0") || 0,
      reorderQty:       parseFloat((formData.get("reorderQty") as string) || "") || null,
      costPerUnit:      parseFloat((formData.get("costPerUnit") as string) || "") || null,
      notes:            (formData.get("notes") as string) || null,
      isActive:         formData.get("isActive") === "true",
    },
  })

  revalidatePath("/inventory")
  redirect("/inventory")
}

export async function deleteInventoryItem(id: string) {
  const { companyId } = await requirePermission("expenses.manage")
  const item = await db.inventoryItem.findFirst({ where: { id, companyId } })
  if (!item) return
  await db.inventoryItem.delete({ where: { id } })
  revalidatePath("/inventory")
}

export async function addInventoryTransaction(
  itemId: string,
  type: "restock" | "adjustment",
  quantity: number,
  note: string | null,
) {
  const { companyId, userId } = await requirePermission("expenses.manage")

  const item = await db.inventoryItem.findFirst({ where: { id: itemId, companyId } })
  if (!item) return

  const delta = type === "restock" ? Math.abs(quantity) : quantity

  await db.$transaction([
    db.inventoryTransaction.create({
      data: {
        itemId,
        companyId,
        createdById: userId,
        type,
        quantity: delta,
        note: note || null,
      },
    }),
    db.inventoryItem.update({
      where: { id: itemId },
      data: { onHand: { increment: delta } },
    }),
  ])

  revalidatePath("/inventory")
  revalidatePath(`/inventory/${itemId}/edit`)
}
