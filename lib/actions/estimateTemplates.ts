"use server"

import { db } from "@/lib/db"
import { requirePermission } from "@/lib/session"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

export async function createTemplate(formData: FormData) {
  const { companyId } = await requirePermission("estimates.manage")

  const name        = formData.get("name") as string
  const description = (formData.get("description") as string) || null
  const descriptions = formData.getAll("description[]") as string[]
  const quantities   = formData.getAll("quantity[]") as string[]
  const unitPrices   = formData.getAll("unitPrice[]") as string[]

  await db.estimateTemplate.create({
    data: {
      companyId,
      name,
      description,
      items: {
        create: descriptions.map((desc, i) => ({
          description: desc,
          quantity:  parseFloat(quantities[i] || "1"),
          unitPrice: parseFloat(unitPrices[i]  || "0"),
        })),
      },
    },
  })

  revalidatePath("/estimates/templates")
  redirect("/estimates/templates")
}

export async function updateTemplate(id: string, formData: FormData) {
  const { companyId } = await requirePermission("estimates.manage")
  const tpl = await db.estimateTemplate.findFirst({ where: { id, companyId } })
  if (!tpl) return

  const name        = formData.get("name") as string
  const description = (formData.get("description") as string) || null
  const descriptions = formData.getAll("description[]") as string[]
  const quantities   = formData.getAll("quantity[]") as string[]
  const unitPrices   = formData.getAll("unitPrice[]") as string[]

  await db.estimateTemplateItem.deleteMany({ where: { templateId: id } })
  await db.estimateTemplate.update({
    where: { id },
    data: {
      name,
      description,
      items: {
        create: descriptions.map((desc, i) => ({
          description: desc,
          quantity:  parseFloat(quantities[i] || "1"),
          unitPrice: parseFloat(unitPrices[i]  || "0"),
        })),
      },
    },
  })

  revalidatePath("/estimates/templates")
  redirect("/estimates/templates")
}

export async function deleteTemplate(id: string) {
  const { companyId } = await requirePermission("estimates.manage")
  const tpl = await db.estimateTemplate.findFirst({ where: { id, companyId } })
  if (!tpl) return
  await db.estimateTemplate.delete({ where: { id } })
  revalidatePath("/estimates/templates")
}
