import { getSession, type SessionUser } from "@/lib/auth"
import { db } from "@/lib/db"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"

export type { SessionUser }

// requireSession() always redirects before returning if companyId could be null
export type AppSession = SessionUser & { companyId: string; companyName: string }

export async function requireSession(): Promise<AppSession> {
  const session = await getSession()
  if (!session) redirect("/login")

  // Super admin viewing as a company — swap in the company identity
  if (session.role === "super_admin") {
    const jar = await cookies()
    const viewAs = jar.get("poolos_view_as")?.value
    if (!viewAs) redirect("/admin")

    const company = await db.company.findUnique({ where: { id: viewAs } })
    if (!company) redirect("/admin")

    return { ...session, companyId: company.id, companyName: company.name, role: "owner" }
  }

  // Re-check DB for account status and forced password change on every request
  if (session.userId) {
    const dbUser = await db.user.findUnique({
      where:  { id: session.userId },
      select: { mustChangePassword: true, isActive: true },
    })
    if (!dbUser?.isActive) redirect("/login")
    if (dbUser?.mustChangePassword) redirect("/change-password")
  }

  return session as AppSession
}

export async function requireOwner(): Promise<AppSession> {
  const user = await requireSession()
  if (user.role !== "owner") redirect("/dashboard")
  return user
}

export async function requireAdmin(): Promise<AppSession> {
  const user = await requireSession()
  if (user.role !== "owner" && user.role !== "admin") redirect("/dashboard")
  return user
}

export async function requireSuperAdmin(): Promise<SessionUser> {
  const session = await getSession()
  if (!session || session.role !== "super_admin") redirect("/dashboard")
  return session
}
