"use client"

import { useState, useEffect } from "react"
import Script from "next/script"
import Link from "next/link"

const GA_ID       = "G-9DHZQXE2YH"
const CONSENT_KEY = "cookie_consent"

type ConsentValue = "accepted" | "declined"

// Cookies persist longer and survive more browser configs than localStorage.
// We write both; read cookie first, fall back to localStorage.
function readConsent(): ConsentValue | null {
  try {
    const match = document.cookie.match(/(?:^|;\s*)cookie_consent=([^;]+)/)
    if (match) return match[1] as ConsentValue
  } catch { /* blocked */ }
  try {
    const val = localStorage.getItem(CONSENT_KEY)
    if (val === "accepted" || val === "declined") return val
  } catch { /* blocked */ }
  return null
}

function writeConsent(value: ConsentValue) {
  try {
    const expires = new Date()
    expires.setFullYear(expires.getFullYear() + 1)
    document.cookie = `${CONSENT_KEY}=${value}; expires=${expires.toUTCString()}; path=/; SameSite=Lax`
  } catch { /* blocked */ }
  try {
    localStorage.setItem(CONSENT_KEY, value)
  } catch { /* blocked */ }
}

export default function CookieConsent() {
  const [consent, setConsent] = useState<ConsentValue | null>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const stored = readConsent()
    if (stored) {
      setConsent(stored)
      return
    }
    // Small delay so the banner doesn't flash in before the page paints.
    const t = setTimeout(() => setVisible(true), 600)
    return () => clearTimeout(t)
  }, [])

  const choose = (value: ConsentValue) => {
    writeConsent(value)
    setConsent(value)
    setVisible(false)
  }

  return (
    <>
      {/* Inject GA only after explicit acceptance */}
      {consent === "accepted" && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
            strategy="afterInteractive"
          />
          <Script id="gtag-init" strategy="afterInteractive">{`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${GA_ID}', { anonymize_ip: true });
          `}</Script>
        </>
      )}

      {/* Consent banner */}
      {visible && (
        <div className="fixed bottom-0 left-0 right-0 z-50 p-4 sm:p-5 bg-gray-950/95 backdrop-blur-sm border-t border-gray-800 shadow-2xl">
          <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <p className="flex-1 text-sm text-gray-300 leading-relaxed">
              We use cookies to measure how visitors use our site (Google Analytics). No personal data
              is sold. See our{" "}
              <Link href="/privacy" className="underline text-gray-200 hover:text-white">
                Privacy Policy
              </Link>{" "}
              for details.
            </p>
            <div className="flex gap-2 shrink-0">
              <button
                onClick={() => choose("declined")}
                className="px-4 py-2 rounded-lg text-sm font-medium text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
              >
                Decline
              </button>
              <button
                onClick={() => choose("accepted")}
                className="px-4 py-2 rounded-lg text-sm font-semibold bg-sky-600 text-white hover:bg-sky-500 transition-colors"
              >
                Accept cookies
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
