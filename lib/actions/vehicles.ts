"use server"

import { db } from "@/lib/db"
import { requirePermission } from "@/lib/session"
import { revalidatePath } from "next/cache"

function parseVehicleFields(formData: FormData) {
  return {
    name:           (formData.get("name") as string).trim(),
    make:           (formData.get("make") as string)?.trim() || null,
    model:          (formData.get("model") as string)?.trim() || null,
    year:           formData.get("year") ? parseInt(formData.get("year") as string) : null,
    licensePlate:   (formData.get("licensePlate") as string)?.trim() || null,
    initialMileage: formData.get("initialMileage") ? parseFloat(formData.get("initialMileage") as string) : null,
    notes:          (formData.get("notes") as string)?.trim() || null,
  }
}

export async function createVehicle(formData: FormData) {
  const { companyId } = await requirePermission("settings.company")
  const fields = parseVehicleFields(formData)
  if (!fields.name) return
  await db.vehicle.create({ data: { companyId, ...fields } })
  revalidatePath("/settings/vehicles")
}

export async function updateVehicle(vehicleId: string, formData: FormData) {
  const { companyId } = await requirePermission("settings.company")
  const vehicle = await db.vehicle.findFirst({ where: { id: vehicleId, companyId } })
  if (!vehicle) return
  const fields = parseVehicleFields(formData)
  if (!fields.name) return
  await db.vehicle.update({ where: { id: vehicleId }, data: fields })
  revalidatePath("/settings/vehicles")
}

export async function toggleVehicleActive(vehicleId: string) {
  const { companyId } = await requirePermission("settings.company")
  const vehicle = await db.vehicle.findFirst({ where: { id: vehicleId, companyId } })
  if (!vehicle) return
  await db.vehicle.update({ where: { id: vehicleId }, data: { isActive: !vehicle.isActive } })
  revalidatePath("/settings/vehicles")
}
