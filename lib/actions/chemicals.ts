"use server"

import { db } from "@/lib/db"
import { requirePermission } from "@/lib/session"
import { revalidatePath } from "next/cache"

export async function saveChemicalUsages(
  visitId: string,
  customerId: string,
  usages: Array<{
    productName: string
    quantity: number
    unit: string
    unitCost: number
    totalCost: number
  }>
) {
  const { companyId } = await requirePermission("schedule.log")

  // Verify visit belongs to this company
  const visit = await db.serviceVisit.findFirst({
    where: { id: visitId, customer: { companyId } },
  })
  if (!visit) return

  // Delete existing and recreate (simple upsert strategy)
  await db.chemicalUsage.deleteMany({ where: { visitId } })

  if (usages.length > 0) {
    await db.chemicalUsage.createMany({
      data: usages
        .filter((u) => u.productName.trim() && u.quantity > 0)
        .map((u) => ({
          ...u,
          visitId,
          companyId,
        })),
    })
  }

  revalidatePath(`/customers/${customerId}`)
}
