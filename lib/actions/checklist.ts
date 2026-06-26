"use server"

import { db } from "@/lib/db"
import { requireSession } from "@/lib/session"
import { refresh } from "next/cache"

export async function addChecklistItem(formData: FormData) {
  const { companyId } = await requireSession()
  const label = (formData.get("label") as string)?.trim()
  if (!label) return

  const last = await db.visitChecklistItem.findFirst({
    where: { companyId },
    orderBy: { position: "desc" },
    select: { position: true },
  })

  await db.visitChecklistItem.create({
    data: { companyId, label, position: (last?.position ?? -1) + 1 },
  })
  refresh()
}

export async function deleteChecklistItem(id: string) {
  const { companyId } = await requireSession()
  await db.visitChecklistItem.deleteMany({ where: { id, companyId } })
  refresh()
}

export async function toggleChecklistItem(id: string, isActive: boolean) {
  const { companyId } = await requireSession()
  await db.visitChecklistItem.updateMany({ where: { id, companyId }, data: { isActive } })
  refresh()
}
