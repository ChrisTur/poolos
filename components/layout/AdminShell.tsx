"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Menu, X, Waves, LayoutDashboard, Building2, Users, BarChart2, CreditCard, Megaphone, Inbox, Settings, ListChecks, Zap, BookOpen, Gift, LogOut, LifeBuoy } from "lucide-react"
import { cn } from "@/lib/utils"
import NotificationBell from "./NotificationBell"
import type { AdminNotification } from "@/lib/notifications"
import { logout } from "@/lib/actions/auth"

const platformNav = [
  { href: "/admin",           label: "Overview",  icon: LayoutDashboard },
  { href: "/admin/companies", label: "Companies", icon: Building2 },
  { href: "/admin/users",     label: "Users",     icon: Users },
  { href: "/admin/plans",     label: "Plans",     icon: CreditCard },
  { href: "/admin/support",   label: "Support",   icon: LifeBuoy },
  { href: "/admin/contact",   label: "Inbox",     icon: Inbox },
  { href: "/admin/reports",   label: "Reports",   icon: BarChart2 },
]

const marketingNav = [
  { href: "/admin/site-config", label: "Site Config", icon: Settings },
  { href: "/admin/waitlist",    label: "Waitlist",    icon: ListChecks },
  { href: "/admin/features",    label: "Features",    icon: Zap },
  { href: "/admin/blog",        label: "Blog",        icon: BookOpen },
  { href: "/admin/banners",     label: "Banners",     icon: Megaphone },
  { href: "/admin/referrals",   label: "Referrals",   icon: Gift },
]

function NavLink({ href, label, icon: Icon, pathname, onClose, exact = false }: {
  href: string; label: string; icon: React.ElementType; pathname: string; onClose: () => void; exact?: boolean
}) {
  const active = exact ? pathname === href : (pathname === href || pathname.startsWith(href + "/") || pathname.startsWith(href))
  return (
    <Link
      href={href}
      onClick={onClose}
      className={cn(
        "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
        active ? "bg-gray-700 text-white" : "text-gray-300 hover:bg-gray-800 hover:text-white"
      )}
    >
      <Icon className="w-4 h-4 shrink-0" />
      {label}
    </Link>
  )
}

function AdminSidebar({ pathname, onClose }: { pathname: string; onClose: () => void }) {
  return (
    <aside className="w-56 bg-gray-900 text-white flex flex-col h-full">
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800">
        <div className="flex items-center gap-2">
          <Waves className="w-5 h-5 text-sky-400" />
          <div>
            <span className="font-bold text-sm">PoolOS</span>
            <p className="text-xs text-gray-400 leading-none">Super Admin</p>
          </div>
        </div>
        <button onClick={onClose} className="lg:hidden text-gray-400 hover:text-white">
          <X className="w-5 h-5" />
        </button>
      </div>

      <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">
        {platformNav.map((item) => (
          <NavLink key={item.href} {...item} pathname={pathname} onClose={onClose} exact={item.href === "/admin"} />
        ))}

        <p className="px-3 pt-4 pb-1 text-xs font-semibold text-gray-500 uppercase tracking-wider">Marketing</p>
        {marketingNav.map((item) => (
          <NavLink key={item.href} {...item} pathname={pathname} onClose={onClose} />
        ))}
      </nav>

      <div className="px-3 py-3 border-t border-gray-800 space-y-1">
        <Link
          href="/dashboard"
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-400 hover:bg-gray-800 hover:text-white transition-colors"
        >
          ← Back to app
        </Link>
        <form action={logout}>
          <button
            type="submit"
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-400 hover:bg-gray-800 hover:text-white transition-colors"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            Sign Out
          </button>
        </form>
      </div>
    </aside>
  )
}

export default function AdminShell({ children, notifications = [] }: { children: React.ReactNode; notifications?: AdminNotification[] }) {
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
        {/* Desktop notification bar */}
        <div className="hidden lg:flex items-center justify-end px-8 pt-5 pb-0 shrink-0">
          <NotificationBell notifications={notifications} />
        </div>

        {/* Mobile header */}
        <header className="lg:hidden flex items-center gap-3 px-4 py-3 bg-gray-900 text-white shrink-0 sticky top-0 z-10">
          <button
            onClick={() => setOpen(true)}
            className="p-1 -ml-1 text-gray-400 hover:text-white rounded-lg"
            aria-label="Open menu"
          >
            <Menu className="w-6 h-6" />
          </button>
          <div className="flex items-center gap-2 flex-1">
            <Waves className="w-4 h-4 text-sky-400" />
            <span className="font-bold text-sm">PoolOS</span>
            <span className="text-gray-400 text-xs">Admin</span>
          </div>
          <NotificationBell notifications={notifications} />
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  )
}
