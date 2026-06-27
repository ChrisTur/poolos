"use server"

import { db } from "@/lib/db"
import { requireSuperAdmin } from "@/lib/session"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { cookies } from "next/headers"
import bcrypt from "bcryptjs"

function slugify(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 50)
}

async function uniqueSlug(base: string) {
  let slug = base, i = 1
  while (await db.company.findUnique({ where: { slug } })) slug = `${base}-${i++}`
  return slug
}

export async function startViewAs(id: string) {
  await requireSuperAdmin()
  const cookieStore = await cookies()
  cookieStore.set("poolos_view_as", id, {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 8, // 8 hours
    path: "/",
  })
  // Bust the router cache so the (app) layout re-fetches with the new cookie.
  // Without this, Next.js may serve a stale layout that was rendered before
  // view-as was started, and the "Viewing as …" banner won't appear.
  revalidatePath("/", "layout")
  redirect("/dashboard")
}

export async function stopViewAs() {
  const cookieStore = await cookies()
  cookieStore.delete("poolos_view_as")
  revalidatePath("/", "layout")
  redirect("/admin/companies")
}

export async function deleteCompany(id: string) {
  await requireSuperAdmin()
  await db.company.delete({ where: { id } })
  redirect("/admin/companies")
}

export async function toggleCompany(id: string, isActive: boolean) {
  await requireSuperAdmin()
  await db.company.update({ where: { id }, data: { isActive } })
  revalidatePath("/admin/companies")
}

export async function adminUpdateCompany(id: string, formData: FormData) {
  await requireSuperAdmin()
  await db.company.update({
    where: { id },
    data: {
      name: formData.get("name") as string,
      phone: (formData.get("phone") as string) || null,
      address: (formData.get("address") as string) || null,
      city: (formData.get("city") as string) || null,
      state: (formData.get("state") as string) || null,
      zip: (formData.get("zip") as string) || null,
      website: (formData.get("website") as string) || null,
    },
  })
  revalidatePath(`/admin/companies/${id}`)
}

export async function adminUploadLogo(id: string, formData: FormData) {
  await requireSuperAdmin()
  const file = formData.get("logo") as File
  if (!file || file.size === 0) return

  const bytes = await file.arrayBuffer()
  const base64 = Buffer.from(bytes).toString("base64")
  const dataUrl = `data:${file.type};base64,${base64}`

  await db.company.update({ where: { id }, data: { logoUrl: dataUrl } })
  revalidatePath(`/admin/companies/${id}`)
}

export async function adminResetPassword(companyId: string, userId: string, formData: FormData) {
  await requireSuperAdmin()
  const password = formData.get("password") as string
  if (!password || password.length < 6) redirect(`/admin/companies/${companyId}?resetError=1`)
  const hashed = await bcrypt.hash(password, 12)
  await db.user.update({ where: { id: userId, companyId }, data: { password: hashed } })
  redirect(`/admin/companies/${companyId}?reset=${userId}`)
}

export async function adminUpdatePlan(id: string, formData: FormData) {
  await requireSuperAdmin()
  const plan         = (formData.get("plan") as string) || "trial"
  const trialEndsAt  = formData.get("trialEndsAt") as string
  const planNote     = (formData.get("planNote") as string) || null

  await db.company.update({
    where: { id },
    data: {
      plan,
      trialEndsAt:   trialEndsAt ? new Date(trialEndsAt) : null,
      planNote,
      planUpdatedAt: new Date(),
    },
  })
  revalidatePath(`/admin/companies/${id}`)
  revalidatePath("/admin/companies")
  redirect(`/admin/companies/${id}?planSaved=1`)
}

export async function adminCreateCompany(formData: FormData) {
  await requireSuperAdmin()

  const companyName = formData.get("companyName") as string
  const firstName = formData.get("firstName") as string
  const lastName = formData.get("lastName") as string
  const email = (formData.get("email") as string).toLowerCase().trim()
  const password = formData.get("password") as string

  const existing = await db.user.findUnique({ where: { email } })
  if (existing) redirect("/admin/companies?error=email_exists")

  const hashed = await bcrypt.hash(password, 12)
  const slug = await uniqueSlug(slugify(companyName))

  const plan = (formData.get("plan") as string) || "trial"
  const trialEndsAt = plan === "trial" ? (() => { const d = new Date(); d.setDate(d.getDate() + 14); return d })() : null

  await db.company.create({
    data: {
      name: companyName,
      slug,
      plan,
      trialEndsAt,
      users: {
        create: { firstName, lastName, email, password: hashed, role: "owner" },
      },
    },
  })

  redirect("/admin/companies?created=1")
}
