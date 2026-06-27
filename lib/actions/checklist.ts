"use server"

import { db } from "@/lib/db"
import { requirePermission } from "@/lib/session"
import { refresh } from "next/cache"

export async function addChecklistItem(formData: FormData) {
  const { companyId } = await requirePermission("settings.checklist")
  const label = (formData.get("label") as string)?.trim()
  if (!label) return

  const last = await db.visitChecklistItem.findFirst({
    where: { companyId, customerId: null },
    orderBy: { position: "desc" },
    select: { position: true },
  })

  await db.visitChecklistItem.create({
    data: { companyId, customerId: null, label, position: (last?.position ?? -1) + 1 },
  })
  refresh()
}

export async function addCustomerChecklistItem(formData: FormData) {
  const { companyId } = await requirePermission("settings.checklist")
  const customerId = (formData.get("customerId") as string)?.trim()
  const label      = (formData.get("label") as string)?.trim()
  if (!customerId || !label) return

  // Verify customer belongs to this company
  const customer = await db.customer.findFirst({ where: { id: customerId, companyId }, select: { id: true } })
  if (!customer) return

  const last = await db.visitChecklistItem.findFirst({
    where: { companyId, customerId },
    orderBy: { position: "desc" },
    select: { position: true },
  })

  await db.visitChecklistItem.create({
    data: { companyId, customerId, label, position: (last?.position ?? -1) + 1 },
  })
  refresh()
}

export async function deleteChecklistItem(id: string) {
  const { companyId } = await requirePermission("settings.checklist")
  await db.visitChecklistItem.deleteMany({ where: { id, companyId } })
  refresh()
}

export async function toggleChecklistItem(id: string, isActive: boolean) {
  const { companyId } = await requirePermission("settings.checklist")
  await db.visitChecklistItem.updateMany({ where: { id, companyId }, data: { isActive } })
  refresh()
}
