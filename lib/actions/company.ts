"use server"

import { db } from "@/lib/db"
import { requireSession, requireOwner } from "@/lib/session"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import bcrypt from "bcryptjs"

export async function completeOnboarding(formData: FormData) {
  const user = await requireSession()

  await db.company.update({
    where: { id: user.companyId },
    data: {
      phone: (formData.get("phone") as string) || null,
      address: (formData.get("address") as string) || null,
      city: (formData.get("city") as string) || null,
      state: (formData.get("state") as string) || null,
      zip: (formData.get("zip") as string) || null,
      website: (formData.get("website") as string) || null,
    },
  })

  redirect("/dashboard")
}

export async function updateCompany(formData: FormData) {
  const user = await requireOwner()

  await db.company.update({
    where: { id: user.companyId },
    data: {
      name: formData.get("name") as string,
      phone: (formData.get("phone") as string) || null,
      address: (formData.get("address") as string) || null,
      city: (formData.get("city") as string) || null,
      state: (formData.get("state") as string) || null,
      zip: (formData.get("zip") as string) || null,
      website: (formData.get("website") as string) || null,
      bccEmail: (formData.get("bccEmail") as string) || null,
      replyToEmail: (formData.get("replyToEmail") as string) || null,
      defaultDueDays: parseInt((formData.get("defaultDueDays") as string) || "30") || 30,
    },
  })

  revalidatePath("/settings/company")
}

export async function inviteUser(formData: FormData) {
  const owner = await requireOwner()

  const email = (formData.get("email") as string).toLowerCase()
  const existing = await db.user.findUnique({ where: { email } })
  if (existing) redirect("/settings/users?inviteError=exists")

  const tempPassword = Math.random().toString(36).slice(-10)
  const hashed = await bcrypt.hash(tempPassword, 12)

  await db.user.create({
    data: {
      email,
      firstName: formData.get("firstName") as string,
      lastName: formData.get("lastName") as string,
      password: hashed,
      role: (formData.get("role") as string) || "technician",
      companyId: owner.companyId,
    },
  })

  redirect(`/settings/users?invited=${encodeURIComponent(tempPassword)}&for=${encodeURIComponent(email)}`)
}

export async function deactivateUser(userId: string) {
  const owner = await requireOwner()
  const target = await db.user.findUnique({ where: { id: userId } })
  if (!target || target.companyId !== owner.companyId) return
  await db.user.update({ where: { id: userId }, data: { isActive: false } })
  revalidatePath("/settings/users")
}

export async function uploadLogo(formData: FormData) {
  const user = await requireOwner()
  const file = formData.get("logo") as File
  if (!file || file.size === 0) return

  const bytes = await file.arrayBuffer()
  const base64 = Buffer.from(bytes).toString("base64")
  const dataUrl = `data:${file.type};base64,${base64}`

  await db.company.update({ where: { id: user.companyId }, data: { logoUrl: dataUrl } })
  revalidatePath("/settings/company")
}

export async function resetUserPassword(userId: string) {
  const owner = await requireOwner()
  const target = await db.user.findUnique({ where: { id: userId } })
  if (!target || target.companyId !== owner.companyId) return

  const tempPassword = Math.random().toString(36).slice(-10)
  const hashed = await bcrypt.hash(tempPassword, 12)
  await db.user.update({ where: { id: userId }, data: { password: hashed, isActive: true } })
  redirect(`/settings/users?reset=${encodeURIComponent(tempPassword)}&for=${encodeURIComponent(target.email)}`)
}
