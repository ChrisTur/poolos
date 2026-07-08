"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Settings, CreditCard, UserCog, Receipt, Truck } from "lucide-react"

const tabs = [
  { href: "/settings/company",  label: "Company",       icon: Settings },
  { href: "/settings/payments", label: "Payment Links", icon: CreditCard },
  { href: "/settings/users",    label: "Team",          icon: UserCog },
  { href: "/settings/vehicles", label: "Vehicles",      icon: Truck },
  { href: "/settings/billing",  label: "Billing",       icon: Receipt },
]

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <div className="space-y-5">
      {/* Tab bar */}
      <div className="flex gap-1 border-b border-gray-200 pb-0 -mb-1 overflow-x-auto">
        {tabs.map(({ href, label, icon: Icon }) => {
          const active = pathname === href
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
                active
                  ? "border-sky-600 text-sky-600"
                  : "border-transparent text-gray-500 hover:text-gray-800 hover:border-gray-300"
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </Link>
          )
        })}
      </div>

      {children}
    </div>
  )
}
