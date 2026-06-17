"use server"

import { db } from "@/lib/db"
import { requireSession } from "@/lib/session"
import { revalidatePath } from "next/cache"

export async function addEquipment(customerId: string, formData: FormData) {
  const { companyId } = await requireSession()
  const customer = await db.customer.findFirst({ where: { id: customerId, companyId } })
  if (!customer) return

  const installedRaw    = formData.get("installedAt") as string
  const warrantyRaw     = formData.get("warrantyExpiry") as string
  await db.equipment.create({
    data: {
      customerId,
      type:             formData.get("type") as string,
      brand:            (formData.get("brand") as string) || null,
      model:            (formData.get("model") as string) || null,
      serialNumber:     (formData.get("serialNumber") as string) || null,
      installedAt:      installedRaw ? new Date(installedRaw) : null,
      warrantyExpiry:   warrantyRaw ? new Date(warrantyRaw) : null,
      warrantyProvider: (formData.get("warrantyProvider") as string) || null,
      warrantyNotes:    (formData.get("warrantyNotes") as string) || null,
      notes:            (formData.get("notes") as string) || null,
    },
  })
  revalidatePath(`/customers/${customerId}`)
}

export async function deleteEquipment(equipmentId: string, customerId: string) {
  const { companyId } = await requireSession()
  const customer = await db.customer.findFirst({ where: { id: customerId, companyId } })
  if (!customer) return
  await db.equipment.delete({ where: { id: equipmentId } })
  revalidatePath(`/customers/${customerId}`)
}

export async function updateEquipment(equipmentId: string, customerId: string, formData: FormData) {
  const { companyId } = await requireSession()
  const customer = await db.customer.findFirst({ where: { id: customerId, companyId } })
  if (!customer) return

  const installedRaw    = formData.get("installedAt") as string
  const warrantyRaw     = formData.get("warrantyExpiry") as string
  await db.equipment.update({
    where: { id: equipmentId },
    data: {
      type:             formData.get("type") as string,
      brand:            (formData.get("brand") as string) || null,
      model:            (formData.get("model") as string) || null,
      serialNumber:     (formData.get("serialNumber") as string) || null,
      installedAt:      installedRaw ? new Date(installedRaw) : null,
      warrantyExpiry:   warrantyRaw ? new Date(warrantyRaw) : null,
      warrantyProvider: (formData.get("warrantyProvider") as string) || null,
      warrantyNotes:    (formData.get("warrantyNotes") as string) || null,
      notes:            (formData.get("notes") as string) || null,
    },
  })
  revalidatePath(`/customers/${customerId}`)
}
