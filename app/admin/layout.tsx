import { auth } from "@/auth"
import { redirect } from "next/navigation"
import AdminShell from "@/components/layout/AdminShell"

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (session?.user?.email !== process.env.SUPER_ADMIN_EMAIL) redirect("/dashboard")

  return <AdminShell>{children}</AdminShell>
}
