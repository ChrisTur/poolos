import { getSession, type SessionUser } from "@/lib/auth"
import { db } from "@/lib/db"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { cache } from "react"
import type { Permission } from "@/lib/permissions"

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

// Cache role permissions per request to avoid N+1 DB hits
const fetchRolePermissions = cache(async (roleName: string): Promise<Set<string>> => {
  const role = await db.role.findUnique({
    where: { name: roleName },
    select: { permissions: true },
  })
  return new Set(role?.permissions ?? [])
})

export async function requirePermission(permission: Permission): Promise<AppSession> {
  const session = await requireSession()
  // requireSession() swaps super_admin view-as to role:"owner" which has all permissions
  const permissions = await fetchRolePermissions(session.role)
  if (!permissions.has(permission)) redirect("/dashboard")
  return session
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
