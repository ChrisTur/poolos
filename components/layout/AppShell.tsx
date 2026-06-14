"use client"

import { useState } from "react"
import { Menu, Waves } from "lucide-react"
import Sidebar from "./Sidebar"

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex h-[100dvh] overflow-hidden bg-gray-50">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col min-w-0 overflow-auto">
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
