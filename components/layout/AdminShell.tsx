"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Menu, X, Waves, LayoutDashboard, Building2, Users, BarChart2, CreditCard, Megaphone, Inbox } from "lucide-react"
import { cn } from "@/lib/utils"

const nav = [
  { href: "/admin",           label: "Overview",  icon: LayoutDashboard },
  { href: "/admin/companies", label: "Companies", icon: Building2 },
  { href: "/admin/users",     label: "Users",     icon: Users },
  { href: "/admin/plans",     label: "Plans",     icon: CreditCard },
  { href: "/admin/banners",   label: "Banners",   icon: Megaphone },
  { href: "/admin/contact",   label: "Inbox",     icon: Inbox },
  { href: "/admin/reports",   label: "Reports",   icon: BarChart2 },
]

function AdminSidebar({ pathname, onClose }: { pathname: string; onClose: () => void }) {
  return (
    <aside className="w-56 bg-gray-900 text-white flex flex-col h-full">
      <div className="flex items-center justify-between px-5 py-5 border-b border-gray-800">
        <div className="flex items-center gap-2">
          <Waves className="w-5 h-5 text-sky-400" />
          <div>
            <span className="font-bold text-sm">PoolOS</span>
            <p className="text-xs text-gray-400 leading-none">Admin</p>
          </div>
        </div>
        <button onClick={onClose} className="lg:hidden text-gray-400 hover:text-white">
          <X className="w-5 h-5" />
        </button>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1">
        {nav.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== "/admin" && pathname.startsWith(href))
          return (
            <Link
              key={href}
              href={href}
              onClick={onClose}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                active
                  ? "bg-gray-700 text-white"
                  : "text-gray-300 hover:bg-gray-800 hover:text-white"
              )}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {label}
            </Link>
          )
        })}
      </nav>
      <div className="px-5 py-4 border-t border-gray-800">
        <Link href="/dashboard" className="text-xs text-gray-400 hover:text-white transition-colors">
          ← Back to app
        </Link>
      </div>
    </aside>
  )
}

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  return (
    <div className="flex h-[100dvh] overflow-hidden bg-gray-50">
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-black/50 z-20 lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Mobile slide-in sidebar */}
      <div className={cn(
        "fixed inset-y-0 left-0 z-30 transition-transform duration-300 lg:hidden",
        open ? "translate-x-0" : "-translate-x-full"
      )}>
        <AdminSidebar pathname={pathname} onClose={() => setOpen(false)} />
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:flex shrink-0">
        <AdminSidebar pathname={pathname} onClose={() => setOpen(false)} />
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-auto">
        {/* Mobile header */}
        <header className="lg:hidden flex items-center gap-3 px-4 py-3 bg-gray-900 text-white shrink-0 sticky top-0 z-10">
          <button
            onClick={() => setOpen(true)}
            className="p-1 -ml-1 text-gray-400 hover:text-white rounded-lg"
            aria-label="Open menu"
          >
            <Menu className="w-6 h-6" />
          </button>
          <div className="flex items-center gap-2">
            <Waves className="w-4 h-4 text-sky-400" />
            <span className="font-bold text-sm">PoolOS</span>
            <span className="text-gray-400 text-xs">Admin</span>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  )
}
