"use client"

import Link from "next/link"
import { Mail, Megaphone } from "lucide-react"

const TABS = [
  { key: "broadcast", label: "Broadcast",       icon: Mail },
  { key: "upsell",    label: "Upsell Campaign",  icon: Megaphone },
]

export default function MessagesNav({ activeTab }: { activeTab: string }) {
  return (
    <div className="flex gap-1 border-b border-gray-200 -mb-1">
      {TABS.map(({ key, label, icon: Icon }) => (
        <Link
          key={key}
          href={`/messages?tab=${key}`}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
            activeTab === key
              ? "border-sky-600 text-sky-600"
              : "border-transparent text-gray-500 hover:text-gray-800 hover:border-gray-300"
          }`}
        >
          <Icon className="w-4 h-4" />
          {label}
        </Link>
      ))}
    </div>
  )
}
