"use server"

import { db } from "@/lib/db"
import { requireSuperAdmin } from "@/lib/session"
import { revalidatePath } from "next/cache"

export async function bulkDeleteContactMessages(ids: string[]) {
  await requireSuperAdmin()
  if (!ids.length) return
  await db.contactMessage.deleteMany({ where: { id: { in: ids } } })
  revalidatePath("/admin/contact")
}

export async function bulkMarkAsSpam(ids: string[]) {
  await requireSuperAdmin()
  if (!ids.length) return
  await db.contactMessage.updateMany({ where: { id: { in: ids } } , data: { status: "spam" } })
  revalidatePath("/admin/contact")
}
