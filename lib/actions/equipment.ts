"use server"

import { db } from "@/lib/db"
import { requirePermission } from "@/lib/session"
import { revalidatePath } from "next/cache"

export async function addEquipment(customerId: string, formData: FormData) {
  const { companyId } = await requirePermission("equipment.manage")
  const customer = await db.customer.findFirst({ where: { id: customerId, companyId } })
  if (!customer) return

  const installedRaw  = formData.get("installedAt") as string
  const warrantyRaw   = formData.get("warrantyExpiry") as string
  const intervalRaw   = formData.get("serviceIntervalDays") as string
  await db.equipment.create({
    data: {
      customerId,
      type:               formData.get("type") as string,
      brand:              (formData.get("brand") as string) || null,
      model:              (formData.get("model") as string) || null,
      serialNumber:       (formData.get("serialNumber") as string) || null,
      installedAt:        installedRaw ? new Date(installedRaw) : null,
      warrantyExpiry:     warrantyRaw ? new Date(warrantyRaw) : null,
      warrantyProvider:   (formData.get("warrantyProvider") as string) || null,
      warrantyNotes:      (formData.get("warrantyNotes") as string) || null,
      notes:              (formData.get("notes") as string) || null,
      serviceIntervalDays: intervalRaw ? parseInt(intervalRaw, 10) : null,
    },
  })
  revalidatePath(`/customers/${customerId}`)
}

export async function deleteEquipment(equipmentId: string, customerId: string) {
  const { companyId } = await requirePermission("equipment.manage")
  const customer = await db.customer.findFirst({ where: { id: customerId, companyId } })
  if (!customer) return
  await db.equipment.delete({ where: { id: equipmentId } })
  revalidatePath(`/customers/${customerId}`)
}

export async function updateEquipment(equipmentId: string, customerId: string, formData: FormData) {
  const { companyId } = await requirePermission("equipment.manage")
  const customer = await db.customer.findFirst({ where: { id: customerId, companyId } })
  if (!customer) return

  const installedRaw  = formData.get("installedAt") as string
  const warrantyRaw   = formData.get("warrantyExpiry") as string
  const intervalRaw   = formData.get("serviceIntervalDays") as string
  await db.equipment.update({
    where: { id: equipmentId },
    data: {
      type:               formData.get("type") as string,
      brand:              (formData.get("brand") as string) || null,
      model:              (formData.get("model") as string) || null,
      serialNumber:       (formData.get("serialNumber") as string) || null,
      installedAt:        installedRaw ? new Date(installedRaw) : null,
      warrantyExpiry:     warrantyRaw ? new Date(warrantyRaw) : null,
      warrantyProvider:   (formData.get("warrantyProvider") as string) || null,
      warrantyNotes:      (formData.get("warrantyNotes") as string) || null,
      notes:              (formData.get("notes") as string) || null,
      serviceIntervalDays: intervalRaw ? parseInt(intervalRaw, 10) : null,
    },
  })
  revalidatePath(`/customers/${customerId}`)
}

export async function addServiceRecord(equipmentId: string, customerId: string, formData: FormData) {
  const { companyId } = await requirePermission("equipment.manage")
  const customer = await db.customer.findFirst({ where: { id: customerId, companyId } })
  if (!customer) return

  const dateRaw     = formData.get("date") as string
  const date        = dateRaw ? new Date(dateRaw) : new Date()
  const techId      = (formData.get("technicianId") as string) || null
  const laborCost   = parseFloat((formData.get("laborCost") as string) || "0") || 0
  const partsCost   = parseFloat((formData.get("partsCost") as string) || "0") || 0

  await db.equipmentService.create({
    data: {
      equipmentId,
      date,
      description: formData.get("description") as string,
      parts:       (formData.get("parts") as string) || null,
      notes:       (formData.get("notes") as string) || null,
      laborCost,
      partsCost,
      technicianId: techId,
    },
  })

  // Update lastServicedAt on the equipment if this is the most recent service
  const equipment = await db.equipment.findUnique({ where: { id: equipmentId }, select: { lastServicedAt: true } })
  if (!equipment?.lastServicedAt || date > equipment.lastServicedAt) {
    await db.equipment.update({ where: { id: equipmentId }, data: { lastServicedAt: date } })
  }

  revalidatePath(`/customers/${customerId}`)
}

export async function deleteServiceRecord(recordId: string, customerId: string) {
  const { companyId } = await requirePermission("equipment.manage")
  const customer = await db.customer.findFirst({ where: { id: customerId, companyId } })
  if (!customer) return

  const record = await db.equipmentService.findUnique({
    where: { id: recordId },
    select: { equipmentId: true },
  })
  if (!record) return

  await db.equipmentService.delete({ where: { id: recordId } })

  // Recalculate lastServicedAt from remaining records
  const latest = await db.equipmentService.findFirst({
    where: { equipmentId: record.equipmentId },
    orderBy: { date: "desc" },
    select: { date: true },
  })
  await db.equipment.update({
    where: { id: record.equipmentId },
    data: { lastServicedAt: latest?.date ?? null },
  })

  revalidatePath(`/customers/${customerId}`)
}
