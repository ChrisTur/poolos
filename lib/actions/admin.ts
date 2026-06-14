"use server"

import { auth } from "@/auth"
import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import bcrypt from "bcryptjs"

async function requireSuperAdmin() {
  const session = await auth()
  if (session?.user?.email !== process.env.SUPER_ADMIN_EMAIL) redirect("/dashboard")
  return session!
}

function slugify(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 50)
}

async function uniqueSlug(base: string) {
  let slug = base, i = 1
  while (await db.company.findUnique({ where: { slug } })) slug = `${base}-${i++}`
  return slug
}

export async function toggleCompany(id: string, isActive: boolean) {
  await requireSuperAdmin()
  await db.company.update({ where: { id }, data: { isActive } })
  revalidatePath("/admin/companies")
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

  await db.company.create({
    data: {
      name: companyName,
      slug,
      users: {
        create: { firstName, lastName, email, password: hashed, role: "owner" },
      },
    },
  })

  redirect("/admin/companies?created=1")
}
