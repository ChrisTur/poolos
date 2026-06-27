"use server"

import { db } from "@/lib/db"
import { requirePermission } from "@/lib/session"
import { revalidatePath } from "next/cache"

export async function addTagToCustomer(customerId: string, formData: FormData) {
  const { companyId } = await requirePermission("customers.edit")
  const customer = await db.customer.findFirst({ where: { id: customerId, companyId } })
  if (!customer) return

  const tagName = (formData.get("tagName") as string | null)?.trim()
  if (!tagName) return

  const color = (formData.get("color") as string | null)?.trim() || "#6b7280"

  // Get or create tag by name for this company
  const tag = await db.tag.upsert({
    where: { name_companyId: { name: tagName, companyId } },
    update: {},
    create: { name: tagName, color, companyId },
  })

  // Upsert the customer-tag join
  await db.customerTag.upsert({
    where: { customerId_tagId: { customerId, tagId: tag.id } },
    update: {},
    create: { customerId, tagId: tag.id },
  })

  revalidatePath(`/customers/${customerId}`)
  revalidatePath("/customers")
}

export async function removeTagFromCustomer(customerId: string, tagId: string) {
  const { companyId } = await requirePermission("customers.edit")
  const customer = await db.customer.findFirst({ where: { id: customerId, companyId } })
  if (!customer) return

  await db.customerTag.deleteMany({ where: { customerId, tagId } })
  revalidatePath(`/customers/${customerId}`)
  revalidatePath("/customers")
}

export async function getCompanyTags(companyId: string) {
  return db.tag.findMany({ where: { companyId }, orderBy: { name: "asc" } })
}
