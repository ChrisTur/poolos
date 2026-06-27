"use server"

import { db } from "@/lib/db"
import { getSession, createSession, deleteSession, setSessionCookie, clearSessionCookie, COOKIE_NAME } from "@/lib/auth"
import bcrypt from "bcryptjs"
import { redirect } from "next/navigation"
import { cookies } from "next/headers"
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
  const companyName    = formData.get("companyName")    as string
  const firstName      = formData.get("firstName")      as string
  const lastName       = formData.get("lastName")       as string
  const email          = (formData.get("email") as string).toLowerCase()
  const password       = formData.get("password")       as string
  const refCode        = ((formData.get("ref") as string) ?? "").trim().toUpperCase()
  const tcAccepted     = formData.get("tcAccepted")     === "on"
  const marketingOptIn = formData.get("marketingOptIn") === "on"

  if (!tcAccepted) return { error: "You must accept the Terms of Service and Privacy Policy to continue." }
  if (password.length < 8) return { error: "Password must be at least 8 characters." }
  if (await isPasswordBreached(password)) {
    return { error: "This password has appeared in a known data breach. Please choose a different one." }
  }

  const existing = await db.user.findUnique({ where: { email } })
  if (existing) return { error: "An account with that email already exists." }

  const hashed = await bcrypt.hash(password, 12)
  const slug   = await uniqueSlug(slugify(companyName))

  const company = await db.company.create({
    data: {
      name: companyName,
      slug,
      tcAcceptedAt:   new Date(),
      marketingOptIn,
      users: {
        create: { firstName, lastName, email, password: hashed, role: "owner" },
      },
    },
    include: { users: true },
  })

  if (refCode) {
    const referralCode = await db.referralCode.findUnique({
      where: { code: refCode, isActive: true },
    })
    if (referralCode) {
      await db.referral.create({
        data: { referralCodeId: referralCode.id, email, companyId: company.id, status: "lead" },
      })
    }
  }

  const user = company.users[0]
  const { token, expiresAt } = await createSession({
    userId:             user.id,
    role:               user.role,
    email:              user.email,
    name:               `${user.firstName} ${user.lastName}`,
    companyId:          company.id,
    companyName:        company.name,
    mustChangePassword: false,
  })
  await setSessionCookie(token, expiresAt)
  redirect("/onboarding")
}

export async function login(formData: FormData) {
  const email    = (formData.get("email") as string).toLowerCase().trim()
  const password = formData.get("password") as string

  const loginLimit = await rateLimit(`login:${email}`, 5, 15 * 60 * 1000)
  if (!loginLimit.allowed) {
    return { error: "Too many login attempts. Please try again in 15 minutes." }
  }

  // Super admin — verify against env var hash, no DB record
  if (email === process.env.SUPER_ADMIN_EMAIL?.toLowerCase()) {
    const valid = await bcrypt.compare(password, process.env.SUPER_ADMIN_PASSWORD_HASH ?? "")
    if (!valid) return { error: "Invalid email or password." }

    const { token, expiresAt } = await createSession({
      userId:      null,
      role:        "super_admin",
      email:       process.env.SUPER_ADMIN_EMAIL!,
      name:        "Super Admin",
      companyId:   null,
      companyName: null,
    })
    await setSessionCookie(token, expiresAt)
    redirect("/admin")
  }

  // Company user
  const user = await db.user.findUnique({
    where:   { email },
    include: { company: true },
  })

  if (!user || !user.isActive || !user.company.isActive) {
    return { error: "Invalid email or password." }
  }

  const valid = await bcrypt.compare(password, user.password)
  if (!valid) return { error: "Invalid email or password." }

  const breached = await isPasswordBreached(password)
  await db.user.update({
    where: { id: user.id },
    data: {
      lastLoginAt: new Date(),
      ...(breached && !user.mustChangePassword ? { mustChangePassword: true } : {}),
    },
  })

  const { token, expiresAt } = await createSession({
    userId:             user.id,
    role:               user.role,
    email:              user.email,
    name:               `${user.firstName} ${user.lastName}`,
    companyId:          user.companyId,
    companyName:        user.company.name,
    mustChangePassword: user.mustChangePassword || breached,
  })
  await setSessionCookie(token, expiresAt)
  redirect("/dashboard")
}

export async function logout() {
  const jar = await cookies()
  const token = jar.get(COOKIE_NAME)?.value
  if (token) await deleteSession(token)
  await clearSessionCookie()
  redirect("/login")
}

export async function requestPasswordReset(formData: FormData) {
  const email = (formData.get("email") as string).toLowerCase().trim()

  await db.user.updateMany({
    where: { passwordResetExpiry: { lt: new Date() }, passwordResetToken: { not: null } },
    data:  { passwordResetToken: null, passwordResetExpiry: null },
  })

  const resetLimit = await rateLimit(`reset:${email}`, 3, 60 * 60 * 1000)
  if (!resetLimit.allowed) {
    return { success: true }
  }

  const user = await db.user.findUnique({ where: { email } })
  if (user && user.isActive) {
    const token  = crypto.randomBytes(32).toString("hex")
    const expiry = new Date(Date.now() + 60 * 60 * 1000)

    await db.user.update({
      where: { id: user.id },
      data:  { passwordResetToken: token, passwordResetExpiry: expiry },
    })

    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password/${token}`
    await resend.emails.send({
      from:    FROM,
      to:      email,
      subject: "Reset your PoolOS password",
      html:    buildPasswordResetHtml(user.firstName, resetUrl),
    })
  }

  return { success: true }
}

export async function resetPassword(token: string, formData: FormData) {
  const password = formData.get("password") as string
  const confirm  = formData.get("confirm")  as string

  if (password !== confirm) return { error: "Passwords don't match." }
  if (password.length < 8)  return { error: "Password must be at least 8 characters." }
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
    data:  { password: hashed, passwordResetToken: null, passwordResetExpiry: null },
  })

  return { success: true }
}

export async function changePassword(formData: FormData) {
  const session = await getSession()
  if (!session) return { error: "Not authenticated." }

  if (session.role === "super_admin") {
    return { error: "Super admin passwords are managed via the SUPER_ADMIN_PASSWORD_HASH environment variable." }
  }

  const password = formData.get("password") as string
  const confirm  = formData.get("confirm")  as string

  if (password !== confirm) return { error: "Passwords don't match." }
  if (password.length < 8)  return { error: "Password must be at least 8 characters." }
  if (await isPasswordBreached(password)) {
    return { error: "This password has appeared in a known data breach. Please choose a different one." }
  }

  const userId    = session.userId
  const userEmail = session.email

  let dbUser = userId ? await db.user.findUnique({ where: { id: userId } }) : null
  if (!dbUser && userEmail) {
    dbUser = await db.user.findUnique({ where: { email: userEmail } })
  }
  if (!dbUser) {
    authLog.error({ userId, userEmail, role: session.role, companyId: session.companyId }, "changePassword: user not found in DB")
    return { error: "Account not found. Please sign out and sign back in." }
  }

  const hashed = await bcrypt.hash(password, 12)
  await db.user.update({
    where: { id: dbUser.id },
    data:  { password: hashed, mustChangePassword: false },
  })

  redirect("/dashboard")
}
