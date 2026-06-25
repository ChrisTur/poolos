"use server"

import { requireSuperAdmin } from "@/lib/session"
import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

function featureData(formData: FormData) {
  return {
    title:       ((formData.get("title")       as string) ?? "").trim(),
    description: ((formData.get("description") as string) ?? "").trim(),
    icon:        ((formData.get("icon")        as string) ?? "").trim() || null,
    position:    parseInt((formData.get("position") as string) ?? "0", 10) || 0,
    isActive:    formData.get("isActive") === "on" || formData.get("isActive") === "true",
  }
}

export async function createFeature(formData: FormData) {
  await requireSuperAdmin()
  await db.featureItem.create({ data: featureData(formData) })
  revalidatePath("/admin/features")
  revalidatePath("/features")
  redirect("/admin/features")
}

export async function updateFeature(id: string, formData: FormData) {
  await requireSuperAdmin()
  await db.featureItem.update({ where: { id }, data: featureData(formData) })
  revalidatePath("/admin/features")
  revalidatePath("/features")
  redirect("/admin/features")
}

export async function deleteFeature(formData: FormData) {
  await requireSuperAdmin()
  const id = formData.get("id") as string
  await db.featureItem.delete({ where: { id } })
  revalidatePath("/admin/features")
  revalidatePath("/features")
}

export async function toggleFeatureActive(formData: FormData) {
  await requireSuperAdmin()
  const id     = formData.get("id") as string
  const active = formData.get("active") === "true"
  await db.featureItem.update({ where: { id }, data: { isActive: !active } })
  revalidatePath("/admin/features")
  revalidatePath("/features")
}
