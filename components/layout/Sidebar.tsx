"use client"

import { useMemo } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { logout } from "@/lib/actions/auth"
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
  Mail,
  LifeBuoy,
  AlertTriangle,
} from "lucide-react"
import { cn } from "@/lib/utils"

type NavItem = { href: string; label: string; icon: React.ElementType; permission?: string }

const operationsNav: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/customers", label: "Customers", icon: Users,          permission: "customers.view" },
  { href: "/messages",  label: "Messages",  icon: Mail,           permission: "messages.view" },
  { href: "/routes",    label: "Routes",    icon: MapPin,         permission: "routes.view" },
  { href: "/schedule",  label: "Schedule",  icon: CalendarDays,   permission: "schedule.view" },
  { href: "/issues",    label: "Issues",    icon: AlertTriangle,  permission: "issues.view" },
]

const billingNav: NavItem[] = [
  { href: "/invoices",  label: "Invoices",  icon: FileText,  permission: "invoices.view" },
  { href: "/estimates", label: "Estimates", icon: FileEdit,  permission: "estimates.view" },
  { href: "/expenses",  label: "Expenses",  icon: Receipt,   permission: "expenses.view" },
  { href: "/reports",   label: "Reports",   icon: BarChart2, permission: "reports.view" },
]

// Equipment Management routes — add new items here as they're built
const equipmentNav: NavItem[] = []

const settingsNav: NavItem[] = [
  { href: "/settings/company",   label: "Company",   icon: Settings,     permission: "settings.company" },
  { href: "/settings/checklist", label: "Checklist", icon: ClipboardList,permission: "settings.checklist" },
  { href: "/settings/payments",  label: "Payments",  icon: CreditCard,   permission: "settings.payments" },
  { href: "/settings/users",     label: "Team",      icon: UserCog,      permission: "settings.team" },
  { href: "/settings/billing",   label: "Billing",   icon: Receipt,      permission: "settings.billing" },
  { href: "/support",            label: "Support",   icon: LifeBuoy,     permission: "support.view" },
]

const ALL_GROUPS = [
  { label: "Operations",           items: operationsNav },
  { label: "Billing",              items: billingNav },
  { label: "Equipment Management", items: equipmentNav },
]

interface SidebarProps {
  open: boolean
  onClose: () => void
  planData?: { plan: string; trialEndsAt: string | null }
  userName?: string
  userEmail?: string
  userRole?: string
  userPermissions?: string[]
}

export default function Sidebar({ open, onClose, planData, userName, userEmail, userRole, userPermissions = [] }: SidebarProps) {
  const permSet = new Set(userPermissions)
  const firstName = userName?.split(" ")[0] ?? ""
  const initials = userName
    ? userName.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase()
    : "?"
  const pathname = usePathname()

  const isTrial = planData?.plan === "trial"
  const trialEndsAt = planData?.trialEndsAt ?? null
  const trialDaysLeft = useMemo(() => {
    if (!trialEndsAt) return null
    // eslint-disable-next-line react-hooks/purity
    return Math.ceil((new Date(trialEndsAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
  }, [trialEndsAt])

  // Technicians lead with Operations; owners/supervisors lead with Billing
  // Filter items within each group based on permissions
  const groups = useMemo(() => {
    const ordered = userRole === "technician"
      ? ALL_GROUPS
      : [ALL_GROUPS[1], ALL_GROUPS[0], ALL_GROUPS[2]]
    return ordered
      .map((g) => ({
        ...g,
        items: g.items.filter((item) => !item.permission || permSet.has(item.permission)),
      }))
      .filter((g) => g.items.length > 0)
  }, [userRole, permSet])

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
        {/* Logo + greeting */}
        <div className="px-5 py-4 border-b border-sky-800">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Waves className="w-5 h-5 text-sky-300" />
              <span className="font-semibold text-base tracking-tight">PoolOS</span>
            </div>
            <button onClick={onClose} className="lg:hidden text-sky-300 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>
          {firstName && (
            <p className="text-sm text-sky-300">Hey, {firstName} 👋</p>
          )}
        </div>

        {/* Grouped nav */}
        <nav className="flex-1 min-h-0 overflow-y-auto px-3 py-4">
          {groups.map((group, i) => (
            <div key={group.label}>
              <p className={cn(
                "px-3 pb-2 text-xs font-semibold text-sky-400 uppercase tracking-wider",
                i === 0 ? "pt-0" : "pt-5"
              )}>
                {group.label}
              </p>
              <div className="space-y-0.5">
                {group.items.map(({ href, label, icon: Icon }) => {
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
              </div>
            </div>
          ))}
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
        <div className="px-3 pb-2 border-t border-sky-800 pt-3">
          <p className="px-3 pb-2 text-xs font-semibold text-sky-400 uppercase tracking-wider">Settings</p>
          <div className="space-y-0.5">
            {settingsNav.filter((item) => !item.permission || permSet.has(item.permission)).map(({ href, label, icon: Icon }) => {
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
          </div>
        </div>

        {/* User profile + sign out */}
        <div className="px-3 py-3 border-t border-sky-800">
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-sky-800/50">
            <div className="w-8 h-8 rounded-full bg-sky-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{userName ?? "Account"}</p>
              {userEmail && <p className="text-xs text-sky-400 truncate">{userEmail}</p>}
            </div>
            <form action={logout}>
              <button
                type="submit"
                title="Sign out"
                className="text-sky-400 hover:text-white transition-colors p-1 rounded"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      </aside>
    </>
  )
}
