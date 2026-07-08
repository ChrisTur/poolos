"use server"

import { db } from "@/lib/db"
import { requirePermission } from "@/lib/session"
import { revalidatePath } from "next/cache"

export async function createServiceContract(customerId: string, formData: FormData) {
  const { companyId } = await requirePermission("customers.edit")

  const customer = await db.customer.findFirst({ where: { id: customerId, companyId }, select: { id: true } })
  if (!customer) return

  const name        = (formData.get("name") as string)?.trim()
  if (!name) return

  const totalVisits = parseInt(formData.get("totalVisits") as string) || 0
  const price       = parseFloat(formData.get("price") as string) || 0
  const description = (formData.get("description") as string)?.trim() || null
  const expiresAtRaw = formData.get("expiresAt") as string | null

  await db.serviceContract.create({
    data: {
      name,
      description,
      totalVisits,
      price,
      expiresAt: expiresAtRaw ? new Date(expiresAtRaw) : null,
      customerId,
      companyId,
    },
  })

  revalidatePath(`/customers/${customerId}`)
}

export async function cancelServiceContract(id: string, customerId: string) {
  const { companyId } = await requirePermission("customers.edit")

  await db.serviceContract.updateMany({
    where: { id, companyId, status: { in: ["active"] } },
    data: { status: "cancelled" },
  })

  revalidatePath(`/customers/${customerId}`)
}
