"use client"

import { useState, useEffect } from "react"
import { X, Copy, Check } from "lucide-react"
import type { BannerData } from "@/lib/banners"

const COLORS: Record<string, { bar: string; text: string; pill: string; close: string }> = {
  sky:    { bar: "bg-sky-600",    text: "text-white",       pill: "bg-white/20 hover:bg-white/30 text-white",          close: "text-white/70 hover:text-white" },
  amber:  { bar: "bg-amber-400",  text: "text-amber-950",   pill: "bg-amber-950/10 hover:bg-amber-950/20 text-amber-950", close: "text-amber-800 hover:text-amber-950" },
  green:  { bar: "bg-green-600",  text: "text-white",       pill: "bg-white/20 hover:bg-white/30 text-white",          close: "text-white/70 hover:text-white" },
  purple: { bar: "bg-purple-600", text: "text-white",       pill: "bg-white/20 hover:bg-white/30 text-white",          close: "text-white/70 hover:text-white" },
}

export default function PromoBannerBar({ banner }: { banner: BannerData }) {
  const [visible, setVisible] = useState(true)
  const [copied, setCopied]   = useState(false)

  useEffect(() => {
    if (banner.dismissible && localStorage.getItem(`banner_${banner.id}`)) {
      // Defer state update to avoid synchronous setState-in-effect
      Promise.resolve().then(() => setVisible(false))
    }
  }, [banner.id, banner.dismissible])

  if (!visible) return null

  const c = COLORS[banner.bgColor] ?? COLORS.sky

  function dismiss() {
    if (banner.dismissible) localStorage.setItem(`banner_${banner.id}`, "1")
    setVisible(false)
  }

  function copyCode() {
    if (!banner.code) return
    navigator.clipboard.writeText(banner.code).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className={`${c.bar} ${c.text} text-sm py-2 px-4 flex items-center justify-center gap-2.5 relative`}>
      <span className="leading-snug">{banner.message}</span>

      {banner.code && (
        <button
          onClick={copyCode}
          title="Copy promo code"
          className={`inline-flex items-center gap-1 font-mono font-bold text-xs px-2 py-0.5 rounded-md transition-colors ${c.pill}`}
        >
          {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
          {copied ? "Copied!" : banner.code}
        </button>
      )}

      {banner.dismissible && (
        <button
          onClick={dismiss}
          aria-label="Dismiss banner"
          className={`absolute right-3 top-1/2 -translate-y-1/2 transition-colors ${c.close}`}
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  )
}
