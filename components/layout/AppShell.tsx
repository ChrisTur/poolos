"use client"

import { useState } from "react"
import { Menu, Waves, Eye, X } from "lucide-react"
import Sidebar from "./Sidebar"
import { stopViewAs } from "@/lib/actions/admin"
import PromoBannerBar from "@/components/PromoBannerBar"
import type { BannerData } from "@/lib/banners"

interface Props {
  children: React.ReactNode
  viewAsCompany?: string
  planData?: { plan: string; trialEndsAt: string | null }
  appBanner?: BannerData | null
}

export default function AppShell({ children, viewAsCompany, planData, appBanner }: Props) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex h-[100dvh] overflow-hidden bg-gray-50">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} planData={planData} />

      <div className="flex-1 flex flex-col min-w-0 overflow-auto">
        {/* Promo banner for trial users */}
        {appBanner && <PromoBannerBar banner={appBanner} />}

        {/* View-as banner */}
        {viewAsCompany && (
          <div className="bg-amber-500 text-white px-4 py-2 flex items-center justify-between gap-3 shrink-0 text-sm">
            <div className="flex items-center gap-2 min-w-0">
              <Eye className="w-4 h-4 shrink-0" />
              <span className="truncate">
                Viewing as <strong>{viewAsCompany}</strong>
              </span>
            </div>
            <form action={stopViewAs}>
              <button
                type="submit"
                className="flex items-center gap-1 text-white/90 hover:text-white font-medium whitespace-nowrap shrink-0"
              >
                <X className="w-3.5 h-3.5" />
                Exit
              </button>
            </form>
          </div>
        )}

        {/* Mobile top bar */}
        <header className="lg:hidden flex items-center gap-3 px-4 py-3 bg-white border-b border-gray-200 shrink-0 sticky top-0 z-10">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-1 -ml-1 text-gray-500 hover:text-gray-900 rounded-lg"
            aria-label="Open menu"
          >
            <Menu className="w-6 h-6" />
          </button>
          <div className="flex items-center gap-1.5">
            <Waves className="w-4 h-4 text-sky-600" />
            <span className="font-semibold text-sky-900 text-sm">PoolOS</span>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-x-hidden">{children}</main>
      </div>
    </div>
  )
}
