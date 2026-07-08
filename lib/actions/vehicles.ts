"use server"

import { db } from "@/lib/db"
import { requirePermission } from "@/lib/session"
import { revalidatePath } from "next/cache"

export async function createVehicle(formData: FormData) {
  const { companyId } = await requirePermission("settings.company")
  const name         = (formData.get("name") as string).trim()
  const make         = (formData.get("make") as string)?.trim() || null
  const model        = (formData.get("model") as string)?.trim() || null
  const yearRaw      = formData.get("year") as string
  const year         = yearRaw ? parseInt(yearRaw) : null
  const licensePlate = (formData.get("licensePlate") as string)?.trim() || null
  const notes        = (formData.get("notes") as string)?.trim() || null

  if (!name) return

  await db.vehicle.create({ data: { companyId, name, make, model, year, licensePlate, notes } })
  revalidatePath("/settings/vehicles")
}

export async function updateVehicle(vehicleId: string, formData: FormData) {
  const { companyId } = await requirePermission("settings.company")
  const vehicle = await db.vehicle.findFirst({ where: { id: vehicleId, companyId } })
  if (!vehicle) return

  const name         = (formData.get("name") as string).trim()
  const make         = (formData.get("make") as string)?.trim() || null
  const model        = (formData.get("model") as string)?.trim() || null
  const yearRaw      = formData.get("year") as string
  const year         = yearRaw ? parseInt(yearRaw) : null
  const licensePlate = (formData.get("licensePlate") as string)?.trim() || null
  const notes        = (formData.get("notes") as string)?.trim() || null

  if (!name) return

  await db.vehicle.update({ where: { id: vehicleId }, data: { name, make, model, year, licensePlate, notes } })
  revalidatePath("/settings/vehicles")
}

export async function toggleVehicleActive(vehicleId: string) {
  const { companyId } = await requirePermission("settings.company")
  const vehicle = await db.vehicle.findFirst({ where: { id: vehicleId, companyId } })
  if (!vehicle) return
  await db.vehicle.update({ where: { id: vehicleId }, data: { isActive: !vehicle.isActive } })
  revalidatePath("/settings/vehicles")
}
