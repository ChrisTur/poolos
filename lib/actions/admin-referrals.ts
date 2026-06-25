"use server"

import { requireSuperAdmin } from "@/lib/session"
import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"

export async function createReferralCode(formData: FormData) {
  await requireSuperAdmin()

  const code   = ((formData.get("code")   as string) ?? "").trim().toUpperCase()
  const label  = ((formData.get("label")  as string) ?? "").trim() || null
  const reward = ((formData.get("reward") as string) ?? "").trim() || "1 free month"

  if (!code) {
    // Can't return errors from direct form actions — just silently skip
    return
  }

  await db.referralCode.create({ data: { code, label, reward } })
  revalidatePath("/admin/referrals")
}

export async function toggleReferralCode(formData: FormData) {
  await requireSuperAdmin()
  const id       = formData.get("id") as string
  const isActive = formData.get("active") === "true"
  await db.referralCode.update({ where: { id }, data: { isActive: !isActive } })
  revalidatePath("/admin/referrals")
}

export async function deleteReferralCode(formData: FormData) {
  await requireSuperAdmin()
  const id = formData.get("id") as string
  await db.referralCode.delete({ where: { id } })
  revalidatePath("/admin/referrals")
}
