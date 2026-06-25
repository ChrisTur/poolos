"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Bell, FileText, MessageSquare, FlaskConical, Building2, Wrench, X } from "lucide-react"
import type { AppNotification, AdminNotification } from "@/lib/notifications"
import { dismissNotification } from "@/lib/actions/notifications"

type AnyNotification = AppNotification | AdminNotification

const ICON_MAP = {
  overdue_invoice: FileText,
  portal_reply:    MessageSquare,
  chemical_alert:  FlaskConical,
  equipment_due:   Wrench,
  new_company:     Building2,
}

const SEVERITY_STYLES: Record<string, string> = {
  red:    "bg-red-50    text-red-600    border-red-100",
  blue:   "bg-blue-50   text-blue-600   border-blue-100",
  amber:  "bg-amber-50  text-amber-600  border-amber-100",
  orange: "bg-orange-50 text-orange-600 border-orange-100",
  // admin (new_company) has no severity — default
  "":     "bg-gray-50   text-gray-500   border-gray-100",
}

const SECTION_LABELS: Record<string, string> = {
  overdue_invoice: "Overdue Invoices",
  portal_reply:    "Unread Replies",
  chemical_alert:  "Chemical Alerts",
  equipment_due:   "Equipment Due",
  new_company:     "New Companies (7 days)",
}

// Which notification types can be dismissed (admin types are not dismissible here)
const DISMISSIBLE_TYPES = new Set(["overdue_invoice", "portal_reply", "chemical_alert", "equipment_due"])

interface Props {
  notifications: AnyNotification[]
  isAdmin?: boolean
}

export default function NotificationBell({ notifications, isAdmin }: Props) {
  const router = useRouter()
  const [open, setOpen]           = useState(false)
  const [locallyDismissed, setLocallyDismissed] = useState<Set<string>>(new Set())
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    if (open) document.addEventListener("mousedown", onClick)
    return () => document.removeEventListener("mousedown", onClick)
  }, [open])

  const handleDismiss = useCallback(async (e: React.MouseEvent, id: string) => {
    e.preventDefault()
    e.stopPropagation()
    setLocallyDismissed((prev) => new Set([...prev, id]))
    await dismissNotification(id)
    router.refresh()
  }, [router])

  const visible = notifications.filter((n) => !locallyDismissed.has(n.id))
  const count   = visible.length

  // Group by type preserving a stable order
  const order = ["overdue_invoice", "portal_reply", "chemical_alert", "equipment_due", "new_company"]
  const grouped = order.reduce<Record<string, AnyNotification[]>>((acc, type) => {
    const items = visible.filter((n) => n.type === type)
    if (items.length) acc[type] = items
    return acc
  }, {})

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative p-2 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
        aria-label={`Notifications${count > 0 ? ` (${count})` : ""}`}
      >
        <Bell className="w-5 h-5" />
        {count > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 leading-none">
            {count > 99 ? "99+" : count}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-gray-200 z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-900">
              Notifications {count > 0 && <span className="text-gray-400 font-normal">({count})</span>}
            </h3>
            <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600 p-1 rounded-lg">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body */}
          <div className="max-h-[420px] overflow-y-auto">
            {count === 0 ? (
              <div className="px-4 py-10 text-center">
                <Bell className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                <p className="text-sm text-gray-400">All clear — no notifications</p>
              </div>
            ) : (
              Object.entries(grouped).map(([type, items]) => (
                <div key={type}>
                  <p className="px-4 pt-3 pb-1 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                    {SECTION_LABELS[type]}
                  </p>
                  {items.map((n) => {
                    const Icon      = ICON_MAP[n.type as keyof typeof ICON_MAP] ?? Bell
                    const severity  = "severity" in n ? n.severity : ""
                    const style     = SEVERITY_STYLES[severity] ?? SEVERITY_STYLES[""]
                    const canDismiss = !isAdmin && DISMISSIBLE_TYPES.has(n.type)

                    return (
                      <div key={n.id} className="group flex items-start gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors">
                        <Link
                          href={n.href}
                          onClick={() => setOpen(false)}
                          className="flex items-start gap-3 flex-1 min-w-0"
                        >
                          <span className={`mt-0.5 p-1.5 rounded-lg border shrink-0 ${style}`}>
                            <Icon className="w-3.5 h-3.5" />
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{n.label}</p>
                            <p className="text-xs text-gray-400 truncate">{n.detail}</p>
                          </div>
                        </Link>
                        {canDismiss && (
                          <button
                            onClick={(e) => handleDismiss(e, n.id)}
                            className="shrink-0 mt-0.5 p-1 rounded-lg text-gray-300 opacity-0 group-hover:opacity-100 hover:text-gray-500 hover:bg-gray-200 transition-all"
                            aria-label="Dismiss notification"
                            title="Dismiss"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    )
                  })}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
