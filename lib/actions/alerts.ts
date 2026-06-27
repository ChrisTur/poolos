"use server"

import { db } from "@/lib/db"
import { requirePermission } from "@/lib/session"
import { revalidatePath } from "next/cache"

export async function addAlert(customerId: string, formData: FormData) {
  const { companyId } = await requirePermission("customers.edit")
  const customer = await db.customer.findFirst({ where: { id: customerId, companyId } })
  if (!customer) return

  const body = (formData.get("body") as string | null)?.trim()
  if (!body) return

  await db.customerAlert.create({ data: { customerId, body } })
  revalidatePath(`/customers/${customerId}`)
}

export async function deleteAlert(id: string, customerId: string) {
  const { companyId } = await requirePermission("customers.edit")
  const customer = await db.customer.findFirst({ where: { id: customerId, companyId } })
  if (!customer) return

  await db.customerAlert.deleteMany({ where: { id, customerId } })
  revalidatePath(`/customers/${customerId}`)
}
