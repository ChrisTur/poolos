"use server"

import { db } from "@/lib/db"
import { createSession, setSessionCookie } from "@/lib/auth"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { resend, FROM, buildWelcomeHtml } from "@/lib/email"

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

export async function finishGoogleSignup(formData: FormData) {
  const jar = await cookies()
  const raw = jar.get("google_pending_profile")?.value
  if (!raw) return { error: "Session expired. Please sign in with Google again." }

  let profile: { googleId: string; email: string; firstName: string; lastName: string }
  try {
    profile = JSON.parse(raw)
  } catch {
    return { error: "Invalid session data. Please try again." }
  }

  const companyName    = formData.get("companyName")    as string
  const tcAccepted     = formData.get("tcAccepted")     === "on"
  const marketingOptIn = formData.get("marketingOptIn") === "on"

  if (!companyName?.trim()) return { error: "Company name is required." }
  if (!tcAccepted) return { error: "You must accept the Terms of Service and Privacy Policy to continue." }

  const existing = await db.user.findFirst({
    where: { OR: [{ googleId: profile.googleId }, { email: profile.email }] },
  })
  if (existing) return { error: "An account with that email already exists. Please sign in instead." }

  const slug = await uniqueSlug(slugify(companyName))

  const company = await db.company.create({
    data: {
      name: companyName,
      slug,
      tcAcceptedAt: new Date(),
      marketingOptIn,
      users: {
        create: {
          firstName: profile.firstName,
          lastName:  profile.lastName || "—",
          email:     profile.email,
          googleId:  profile.googleId,
          role:      "owner",
        },
      },
    },
    include: { users: true },
  })

  jar.set("google_pending_profile", "", { maxAge: 0, path: "/" })

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

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://poolos.biz"
  resend.emails.send({
    from: FROM,
    to: user.email,
    subject: "Welcome to PoolOS — let's get you set up",
    html: buildWelcomeHtml({ firstName: user.firstName, appUrl }),
  }).catch(() => {})

  redirect("/onboarding")
}
