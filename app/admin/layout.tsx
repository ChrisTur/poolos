import { auth } from "@/auth"
import { redirect } from "next/navigation"
import AdminShell from "@/components/layout/AdminShell"
import { getAdminNotifications, type AdminNotification } from "@/lib/notifications"

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (session?.user?.email !== process.env.SUPER_ADMIN_EMAIL) redirect("/dashboard")

  const notifications: AdminNotification[] = await getAdminNotifications()

  return <AdminShell notifications={notifications}>{children}</AdminShell>
}
