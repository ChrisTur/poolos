"use server"

import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"
import { db } from "@/lib/db"

async function requireSuperAdmin() {
  const session = await auth()
  if (session?.user?.email !== process.env.SUPER_ADMIN_EMAIL) redirect("/dashboard")
}

function b(val: FormDataEntryValue | null) {
  return val === "on" || val === "true" || val === "1"
}

export async function createBanner(formData: FormData) {
  await requireSuperAdmin()

  const expiresRaw = formData.get("expiresAt") as string
  await db.promoBanner.create({
    data: {
      message:         (formData.get("message") as string).trim(),
      code:            (formData.get("code") as string)?.trim() || null,
      active:          b(formData.get("active")),
      dismissible:     b(formData.get("dismissible")),
      showOnMarketing: b(formData.get("showOnMarketing")),
      showInApp:       b(formData.get("showInApp")),
      bgColor:         (formData.get("bgColor") as string) || "sky",
      expiresAt:       expiresRaw ? new Date(expiresRaw) : null,
    },
  })

  revalidatePaths()
  redirect("/admin/banners")
}

export async function updateBanner(formData: FormData) {
  await requireSuperAdmin()

  const id = formData.get("id") as string
  const expiresRaw = formData.get("expiresAt") as string

  await db.promoBanner.update({
    where: { id },
    data: {
      message:         (formData.get("message") as string).trim(),
      code:            (formData.get("code") as string)?.trim() || null,
      active:          b(formData.get("active")),
      dismissible:     b(formData.get("dismissible")),
      showOnMarketing: b(formData.get("showOnMarketing")),
      showInApp:       b(formData.get("showInApp")),
      bgColor:         (formData.get("bgColor") as string) || "sky",
      expiresAt:       expiresRaw ? new Date(expiresRaw) : null,
    },
  })

  revalidatePaths()
  redirect("/admin/banners")
}

export async function toggleBannerActive(formData: FormData) {
  await requireSuperAdmin()

  const id     = formData.get("id") as string
  const active = formData.get("active") === "true"

  await db.promoBanner.update({ where: { id }, data: { active: !active } })
  revalidatePaths()
}

export async function deleteBanner(formData: FormData) {
  await requireSuperAdmin()

  const id = formData.get("id") as string
  await db.promoBanner.delete({ where: { id } })
  revalidatePaths()
}

function revalidatePaths() {
  revalidatePath("/admin/banners")
  revalidatePath("/")
  revalidatePath("/pricing")
}
