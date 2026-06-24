"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  Users,
  MapPin,
  CalendarDays,
  FileText,
  FileEdit,
  Receipt,
  Waves,
  X,
  Settings,
  UserCog,
  CreditCard,
  LogOut,
  BarChart2,
  Zap,
  ClipboardList,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { logout } from "@/lib/actions/auth"

const nav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/customers", label: "Customers", icon: Users },
  { href: "/routes", label: "Routes", icon: MapPin },
  { href: "/schedule", label: "Schedule", icon: CalendarDays },
  { href: "/invoices", label: "Invoices", icon: FileText },
  { href: "/estimates", label: "Estimates", icon: FileEdit },
  { href: "/expenses",  label: "Expenses",  icon: Receipt },
  { href: "/reports",   label: "Reports",   icon: BarChart2 },
]

const settingsNav = [
  { href: "/settings/company",   label: "Company",   icon: Settings },
  { href: "/settings/checklist", label: "Checklist", icon: ClipboardList },
  { href: "/settings/payments",  label: "Payments",  icon: CreditCard },
  { href: "/settings/users",     label: "Team",      icon: UserCog },
  { href: "/settings/billing",   label: "Billing",   icon: Receipt },
]

interface SidebarProps {
  open: boolean
  onClose: () => void
  planData?: { plan: string; trialEndsAt: string | null }
}

export default function Sidebar({ open, onClose, planData }: SidebarProps) {
  const pathname = usePathname()

  const isTrial = planData?.plan === "trial"
  const trialDaysLeft = planData?.trialEndsAt
    ? Math.ceil((new Date(planData.trialEndsAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-black/40 z-20 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={cn(
          "fixed top-0 left-0 z-30 h-full w-64 bg-sky-900 text-white flex flex-col transition-transform duration-300",
          "lg:relative lg:translate-x-0 lg:z-auto",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Logo */}
        <div className="flex items-center justify-between px-5 py-5 border-b border-sky-800">
          <div className="flex items-center gap-2">
            <Waves className="w-6 h-6 text-sky-300" />
            <span className="font-semibold text-lg tracking-tight">PoolOS</span>
          </div>
          <button onClick={onClose} className="lg:hidden text-sky-300 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nav links */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {nav.map(({ href, label, icon: Icon }) => {
            const active = pathname.startsWith(href)
            return (
              <Link
                key={href}
                href={href}
                onClick={onClose}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  active
                    ? "bg-sky-700 text-white"
                    : "text-sky-200 hover:bg-sky-800 hover:text-white"
                )}
              >
                <Icon className="w-5 h-5 shrink-0" />
                {label}
              </Link>
            )
          })}
        </nav>

        {/* Trial upgrade CTA */}
        {isTrial && (
          <div className="mx-3 mb-3 p-3 rounded-xl bg-gradient-to-br from-sky-800 to-sky-700 border border-sky-600">
            <div className="flex items-center gap-1.5 mb-1">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <p className="text-xs font-semibold text-white">Free Trial</p>
            </div>
            <p className="text-xs text-sky-300 mb-2.5 leading-relaxed">
              {trialDaysLeft !== null && trialDaysLeft > 0
                ? `${trialDaysLeft} day${trialDaysLeft === 1 ? "" : "s"} remaining — upgrade to keep access.`
                : trialDaysLeft !== null && trialDaysLeft <= 0
                ? "Your trial has ended."
                : "Upgrade to unlock all features."}
            </p>
            <Link
              href="/settings/billing"
              onClick={onClose}
              className="block text-center bg-white text-sky-800 text-xs font-bold py-1.5 rounded-lg hover:bg-sky-50 transition-colors"
            >
              Upgrade now →
            </Link>
          </div>
        )}

        {/* Settings nav */}
        <div className="px-3 pb-2 space-y-1 border-t border-sky-800 pt-3">
          {settingsNav.map(({ href, label, icon: Icon }) => {
            const active = pathname.startsWith(href)
            return (
              <Link
                key={href}
                href={href}
                onClick={onClose}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                  active
                    ? "bg-sky-700 text-white"
                    : "text-sky-300 hover:bg-sky-800 hover:text-white"
                )}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {label}
              </Link>
            )
          })}
          <form action={logout}>
            <button
              type="submit"
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-sky-300 hover:bg-sky-800 hover:text-white transition-colors"
            >
              <LogOut className="w-4 h-4 shrink-0" />
              Sign Out
            </button>
          </form>
        </div>

        <div className="px-5 py-3 text-xs text-sky-500 border-t border-sky-800">
          PoolOS
        </div>
      </aside>
    </>
  )
}
