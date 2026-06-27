"use server"

import { db } from "@/lib/db"
import { requireSuperAdmin } from "@/lib/session"
import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"
import { PERMISSIONS, type Permission } from "@/lib/permissions"

const ALL_PERMISSION_KEYS = Object.keys(PERMISSIONS) as Permission[]

export async function createRole(formData: FormData) {
  await requireSuperAdmin()

  const name        = (formData.get("name")        as string).trim().toLowerCase().replace(/\s+/g, "_")
  const label       = (formData.get("label")       as string).trim()
  const description = (formData.get("description") as string | null)?.trim() || null
  const permissions = ALL_PERMISSION_KEYS.filter((p) => formData.get(`perm_${p}`) === "on")

  if (!name || !label) return

  await db.role.create({
    data: { name, label, description, isBuiltIn: false, permissions },
  })

  revalidatePath("/admin/roles")
  redirect("/admin/roles")
}

export async function updateRole(id: string, formData: FormData) {
  await requireSuperAdmin()

  const label       = (formData.get("label")       as string).trim()
  const description = (formData.get("description") as string | null)?.trim() || null
  const permissions = ALL_PERMISSION_KEYS.filter((p) => formData.get(`perm_${p}`) === "on")

  await db.role.update({
    where: { id },
    data:  { label, description, permissions },
  })

  revalidatePath("/admin/roles")
  redirect(`/admin/roles/${id}?saved=1`)
}

export async function deleteRole(id: string) {
  await requireSuperAdmin()

  const role = await db.role.findUnique({ where: { id } })
  if (!role || role.isBuiltIn) return

  await db.role.delete({ where: { id } })

  revalidatePath("/admin/roles")
  redirect("/admin/roles")
}
