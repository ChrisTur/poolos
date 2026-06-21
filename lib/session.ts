import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { cookies } from "next/headers"
import { db } from "@/lib/db"

export async function requireSession() {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const user = session.user

  // Super admin: check for view-as cookie to impersonate a company
  if (user.email === process.env.SUPER_ADMIN_EMAIL) {
    const cookieStore = await cookies()
    const viewAs = cookieStore.get("poolos_view_as")?.value
    if (viewAs) {
      const company = await db.company.findUnique({ where: { id: viewAs } })
      if (company) {
        return { ...user, companyId: company.id, companyName: company.name, role: "owner" }
      }
    }
    // Super admin with no view-as session belongs in /admin, not the app
    redirect("/admin")
  }

  // Check mustChangePassword from the DB — the JWT value can be stale after
  // a password change, so the DB is the authoritative source.
  if (user.id) {
    const dbUser = await db.user.findUnique({
      where: { id: user.id },
      select: { mustChangePassword: true },
    })
    if (dbUser?.mustChangePassword) redirect("/change-password")
  } else if ((user as any).mustChangePassword) {
    redirect("/change-password")
  }

  return user
}

export async function requireOwner() {
  const user = await requireSession()
  if (user.role !== "owner") redirect("/dashboard")
  return user
}
