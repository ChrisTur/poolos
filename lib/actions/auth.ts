"use server"

import { db } from "@/lib/db"
import { signIn, signOut } from "@/auth"
import bcrypt from "bcryptjs"
import { redirect } from "next/navigation"

function slugify(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 50)
}

async function uniqueSlug(base: string) {
  let slug = base
  let i = 1
  while (await db.company.findUnique({ where: { slug } })) {
    slug = `${base}-${i++}`
  }
  return slug
}

export async function registerCompany(formData: FormData) {
  const companyName = formData.get("companyName") as string
  const firstName = formData.get("firstName") as string
  const lastName = formData.get("lastName") as string
  const email = (formData.get("email") as string).toLowerCase()
  const password = formData.get("password") as string

  const existing = await db.user.findUnique({ where: { email } })
  if (existing) return { error: "An account with that email already exists." }

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

  await signIn("credentials", { email, password, redirectTo: "/onboarding" })
}

export async function login(formData: FormData) {
  const email = formData.get("email") as string
  const password = formData.get("password") as string
  try {
    await signIn("credentials", { email, password, redirectTo: "/dashboard" })
  } catch (error: any) {
    // NextAuth throws NEXT_REDIRECT on success — re-throw so Next.js can redirect
    if (error?.digest?.startsWith("NEXT_REDIRECT")) throw error
    return { error: "Invalid email or password." }
  }
}

export async function logout() {
  await signOut({ redirectTo: "/login" })
}
