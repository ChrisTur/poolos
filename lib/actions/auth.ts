"use server"

import { db } from "@/lib/db"
import { auth, signIn, signOut } from "@/auth"
import bcrypt from "bcryptjs"
import { redirect } from "next/navigation"
import { resend, FROM, buildPasswordResetHtml } from "@/lib/email"
import crypto from "crypto"
import { rateLimit } from "@/lib/rate-limit"
import { isPasswordBreached } from "@/lib/hibp"
import { authLog } from "@/lib/logger"

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

  if (password.length < 8) return { error: "Password must be at least 8 characters." }
  if (await isPasswordBreached(password)) {
    return { error: "This password has appeared in a known data breach. Please choose a different one." }
  }

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
  const email = (formData.get("email") as string).toLowerCase().trim()
  const password = formData.get("password") as string

  const loginLimit = await rateLimit(`login:${email}`, 5, 15 * 60 * 1000)
  if (!loginLimit.allowed) {
    return { error: "Too many login attempts. Please try again in 15 minutes." }
  }

  const redirectTo = email === process.env.SUPER_ADMIN_EMAIL?.toLowerCase() ? "/admin" : "/dashboard"
  try {
    await signIn("credentials", { email, password, redirectTo })
  } catch (error: unknown) {
    // NextAuth throws NEXT_REDIRECT on success — re-throw so Next.js can redirect
    if ((error as { digest?: string })?.digest?.startsWith("NEXT_REDIRECT")) throw error
    return { error: "Invalid email or password." }
  }
}

export async function logout() {
  await signOut({ redirectTo: "/login" })
}

export async function requestPasswordReset(formData: FormData) {
  const email = (formData.get("email") as string).toLowerCase().trim()

  // Clean up all expired tokens on every reset request
  await db.user.updateMany({
    where: { passwordResetExpiry: { lt: new Date() }, passwordResetToken: { not: null } },
    data: { passwordResetToken: null, passwordResetExpiry: null },
  })

  // Rate-limit by email: max 3 requests per hour (still return success to prevent enumeration)
  const resetLimit = await rateLimit(`reset:${email}`, 3, 60 * 60 * 1000)
  if (!resetLimit.allowed) {
    return { success: true }
  }

  const user = await db.user.findUnique({ where: { email } })
  if (user && user.isActive) {
    const token = crypto.randomBytes(32).toString("hex")
    const expiry = new Date(Date.now() + 60 * 60 * 1000) // 1 hour

    await db.user.update({
      where: { id: user.id },
      data: { passwordResetToken: token, passwordResetExpiry: expiry },
    })

    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password/${token}`
    await resend.emails.send({
      from: FROM,
      to: email,
      subject: "Reset your PoolOS password",
      html: buildPasswordResetHtml(user.firstName, resetUrl),
    })
  }

  // Always return success to avoid revealing whether the email exists
  return { success: true }
}

export async function resetPassword(token: string, formData: FormData) {
  const password = formData.get("password") as string
  const confirm = formData.get("confirm") as string

  if (password !== confirm) return { error: "Passwords don't match." }
  if (password.length < 8) return { error: "Password must be at least 8 characters." }
  if (await isPasswordBreached(password)) {
    return { error: "This password has appeared in a known data breach. Please choose a different one." }
  }

  const user = await db.user.findUnique({ where: { passwordResetToken: token } })

  if (!user || !user.passwordResetExpiry || user.passwordResetExpiry < new Date()) {
    return { error: "This link has expired or is invalid. Please request a new one." }
  }

  const hashed = await bcrypt.hash(password, 12)

  await db.user.update({
    where: { id: user.id },
    data: { password: hashed, passwordResetToken: null, passwordResetExpiry: null },
  })

  return { success: true }
}

export async function changePassword(formData: FormData) {
  const session = await auth()
  if (!session?.user) return { error: "Not authenticated." }

  // Super admin passwords are controlled via environment variables, not the DB
  if ((session.user as unknown as Record<string, unknown>).role === "super_admin") {
    return { error: "Super admin passwords are managed via the SUPER_ADMIN_PASSWORD_HASH environment variable." }
  }

  const password = formData.get("password") as string
  const confirm = formData.get("confirm") as string

  if (password !== confirm) return { error: "Passwords don't match." }
  if (password.length < 8) return { error: "Password must be at least 8 characters." }
  if (await isPasswordBreached(password)) {
    return { error: "This password has appeared in a known data breach. Please choose a different one." }
  }

  const userId = session.user.id
  const userEmail = session.user.email

  // Try id first, then email — both independently so a bad id doesn't block the email path
  let dbUser = userId ? await db.user.findUnique({ where: { id: userId } }) : null
  if (!dbUser && userEmail) {
    dbUser = await db.user.findUnique({ where: { email: userEmail } })
  }
  if (!dbUser) {
    const u = session.user as unknown as Record<string, unknown>
    authLog.error({ userId: userId ?? null, userEmail: userEmail ?? null, role: u.role, companyId: u.companyId }, "changePassword: user not found in DB")
    return { error: "Account not found. Please sign out and sign back in." }
  }

  const hashed = await bcrypt.hash(password, 12)
  await db.user.update({
    where: { id: dbUser.id },
    data: { password: hashed, mustChangePassword: false },
  })

  // requireSession() now checks mustChangePassword from the DB directly,
  // so no sign-out is needed — just redirect to the app.
  redirect("/dashboard")
}
