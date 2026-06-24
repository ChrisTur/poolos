"use server"

import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"
import { db } from "@/lib/db"

export type BannerFormState = { error?: string } | null

async function guardSuperAdmin() {
  const session = await auth()
  if (session?.user?.email !== process.env.SUPER_ADMIN_EMAIL) redirect("/dashboard")
}

function b(val: FormDataEntryValue | null) {
  return val === "on" || val === "true" || val === "1"
}

function bannerData(formData: FormData) {
  const expiresRaw = formData.get("expiresAt") as string
  return {
    message:         ((formData.get("message") as string) ?? "").trim(),
    code:            ((formData.get("code") as string) ?? "").trim() || null,
    active:          b(formData.get("active")),
    dismissible:     b(formData.get("dismissible")),
    showOnMarketing: b(formData.get("showOnMarketing")),
    showInApp:       b(formData.get("showInApp")),
    bgColor:         (formData.get("bgColor") as string) || "sky",
    expiresAt:       expiresRaw ? new Date(expiresRaw) : null,
  }
}

export async function createBanner(
  _: BannerFormState,
  formData: FormData,
): Promise<BannerFormState> {
  await guardSuperAdmin()
  try {
    await db.promoBanner.create({ data: bannerData(formData) })
    revalidatePaths()
  } catch (e: unknown) {
    console.error("createBanner error:", e)
    return { error: e instanceof Error ? e.message : "Failed to create banner — check server logs." }
  }
  redirect("/admin/banners")
}

export async function updateBanner(
  _: BannerFormState,
  formData: FormData,
): Promise<BannerFormState> {
  await guardSuperAdmin()
  const id = formData.get("id") as string
  try {
    await db.promoBanner.update({ where: { id }, data: bannerData(formData) })
    revalidatePaths()
  } catch (e: unknown) {
    console.error("updateBanner error:", e)
    return { error: e instanceof Error ? e.message : "Failed to save banner — check server logs." }
  }
  redirect("/admin/banners")
}

export async function toggleBannerActive(formData: FormData) {
  await guardSuperAdmin()

  const id     = formData.get("id") as string
  const active = formData.get("active") === "true"

  await db.promoBanner.update({ where: { id }, data: { active: !active } })
  revalidatePaths()
}

export async function deleteBanner(formData: FormData) {
  await guardSuperAdmin()

  const id = formData.get("id") as string
  await db.promoBanner.delete({ where: { id } })
  revalidatePaths()
}

function revalidatePaths() {
  revalidatePath("/admin/banners")
  revalidatePath("/")
  revalidatePath("/pricing")
}
