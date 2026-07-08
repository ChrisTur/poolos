"use server"

import { db } from "@/lib/db"
import { requirePermission } from "@/lib/session"
import { revalidatePath } from "next/cache"

export async function createPoolBody(customerId: string, formData: FormData) {
  const { companyId } = await requirePermission("customers.edit")

  const customer = await db.customer.findFirst({ where: { id: customerId, companyId }, select: { id: true } })
  if (!customer) return

  const name  = (formData.get("name") as string)?.trim()
  if (!name) return

  const type   = (formData.get("type") as string) || "pool"
  const volume = formData.get("volume") ? parseFloat(formData.get("volume") as string) : null
  const shape  = (formData.get("shape") as string)?.trim() || null
  const notes  = (formData.get("notes") as string)?.trim() || null

  await db.poolBody.create({
    data: { name, type, volume, shape, notes, customerId, companyId },
  })

  revalidatePath(`/customers/${customerId}`)
}

export async function deletePoolBody(id: string, customerId: string) {
  const { companyId } = await requirePermission("customers.edit")

  await db.poolBody.deleteMany({ where: { id, companyId } })

  revalidatePath(`/customers/${customerId}`)
}
