import { auth } from "@/auth"
import { cookies } from "next/headers"
import { db } from "@/lib/db"
import AppShell from "@/components/layout/AppShell"

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  let viewAsCompany: string | undefined

  const session = await auth()
  if (session?.user?.email === process.env.SUPER_ADMIN_EMAIL) {
    const cookieStore = await cookies()
    const viewAs = cookieStore.get("poolos_view_as")?.value
    if (viewAs) {
      const company = await db.company.findUnique({ where: { id: viewAs }, select: { name: true } })
      viewAsCompany = company?.name
    }
  }

  return <AppShell viewAsCompany={viewAsCompany}>{children}</AppShell>
}
