import { auth } from "@/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Waves, Building2, Users, LayoutDashboard } from "lucide-react"

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (session?.user?.email !== process.env.SUPER_ADMIN_EMAIL) redirect("/dashboard")

  const nav = [
    { href: "/admin", label: "Overview", icon: LayoutDashboard },
    { href: "/admin/companies", label: "Companies", icon: Building2 },
    { href: "/admin/users", label: "Users", icon: Users },
  ]

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <aside className="w-56 bg-gray-900 text-white flex flex-col shrink-0">
        <div className="flex items-center gap-2 px-5 py-5 border-b border-gray-800">
          <Waves className="w-5 h-5 text-sky-400" />
          <div>
            <span className="font-bold text-sm">PoolOS</span>
            <p className="text-xs text-gray-400 leading-none">Admin</p>
          </div>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {nav.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href}
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-300 hover:bg-gray-800 hover:text-white transition-colors">
              <Icon className="w-4 h-4 shrink-0" />
              {label}
            </Link>
          ))}
        </nav>
        <div className="px-5 py-3 border-t border-gray-800">
          <Link href="/dashboard" className="text-xs text-gray-400 hover:text-white">
            ← Back to app
          </Link>
        </div>
      </aside>
      <main className="flex-1 overflow-auto p-8">{children}</main>
    </div>
  )
}
