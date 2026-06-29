"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  Users,
  CalendarDays,
  MapPin,
  AlertTriangle,
  MoreHorizontal,
} from "lucide-react"
import { cn } from "@/lib/utils"

type Tab = { href: string; label: string; icon: React.ElementType; match?: string }

const ownerTabs: Tab[] = [
  { href: "/dashboard",  label: "Dashboard", icon: LayoutDashboard },
  { href: "/customers",  label: "Customers",  icon: Users },
  { href: "/schedule",   label: "Schedule",   icon: CalendarDays },
  { href: "/routes",     label: "Routes",     icon: MapPin },
]

const techTabs: Tab[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/schedule",  label: "Schedule",  icon: CalendarDays },
  { href: "/routes",    label: "Routes",    icon: MapPin },
  { href: "/issues",    label: "Issues",    icon: AlertTriangle },
]

interface Props {
  userRole?: string
  onMoreClick: () => void
}

export default function BottomNav({ userRole, onMoreClick }: Props) {
  const pathname = usePathname()
  const tabs = userRole === "technician" ? techTabs : ownerTabs

  return (
    <nav
      className="lg:hidden fixed bottom-0 inset-x-0 z-20 bg-white border-t border-gray-200 flex items-stretch"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      {tabs.map(({ href, label, icon: Icon }) => {
        const active = pathname === href || pathname.startsWith(href + "/")
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex-1 flex flex-col items-center justify-center gap-0.5 py-2 text-[10px] font-medium transition-colors min-w-0",
              active ? "text-sky-600" : "text-gray-400 active:text-gray-600"
            )}
          >
            <Icon className={cn("w-5 h-5 shrink-0", active && "stroke-[2.25px]")} />
            <span className="truncate w-full text-center leading-none">{label}</span>
          </Link>
        )
      })}

      <button
        type="button"
        onClick={onMoreClick}
        className="flex-1 flex flex-col items-center justify-center gap-0.5 py-2 text-[10px] font-medium text-gray-400 active:text-gray-600 transition-colors"
      >
        <MoreHorizontal className="w-5 h-5 shrink-0" />
        <span className="leading-none">More</span>
      </button>
    </nav>
  )
}
