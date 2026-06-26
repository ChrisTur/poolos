"use server"

import { db } from "@/lib/db"
import { requireSession } from "@/lib/session"
import { redirect } from "next/navigation"

export async function addChecklistItem(formData: FormData) {
  const { companyId } = await requireSession()
  const label = (formData.get("label") as string)?.trim()
  if (!label) redirect("/settings/checklist")

  const last = await db.visitChecklistItem.findFirst({
    where: { companyId },
    orderBy: { position: "desc" },
    select: { position: true },
  })

  await db.visitChecklistItem.create({
    data: { companyId, label, position: (last?.position ?? -1) + 1 },
  })
  redirect("/settings/checklist")
}

export async function deleteChecklistItem(id: string) {
  const { companyId } = await requireSession()
  await db.visitChecklistItem.deleteMany({ where: { id, companyId } })
  redirect("/settings/checklist")
}

export async function toggleChecklistItem(id: string, isActive: boolean) {
  const { companyId } = await requireSession()
  await db.visitChecklistItem.updateMany({ where: { id, companyId }, data: { isActive } })
  redirect("/settings/checklist")
}
