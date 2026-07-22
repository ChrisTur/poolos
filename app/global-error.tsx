"use client"

import { RefreshCw } from "lucide-react"
import "./globals.css"

export default function GlobalError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string }
  unstable_retry: () => void
}) {

  return (
    <html lang="en">
      <body className="min-h-screen bg-white flex flex-col items-center justify-center px-4 text-center font-sans">
        <div className="w-8 h-8 rounded-lg bg-sky-600 flex items-center justify-center mb-10 mx-auto">
          <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
            <path d="M2 6c.6.5 1.2 1 2.5 1C7 7 7 5 9.5 5c2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1" />
            <path d="M2 12c.6.5 1.2 1 2.5 1C7 13 7 11 9.5 11c2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1" />
            <path d="M2 18c.6.5 1.2 1 2.5 1C7 19 7 17 9.5 17c2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1" />
          </svg>
        </div>
        <p className="text-7xl font-extrabold text-gray-200 mb-4">500</p>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Something went wrong</h1>
        <p className="text-gray-500 mb-6 max-w-sm">
          An unexpected error occurred. Try refreshing the page.
        </p>
        {error.digest && (
          <p className="text-xs text-gray-400 mb-4 font-mono">Error ID: {error.digest}</p>
        )}
        <button
          onClick={() => unstable_retry()}
          className="inline-flex items-center gap-2 bg-sky-600 text-white font-semibold text-sm px-5 py-2.5 rounded-xl hover:bg-sky-700"
        >
          <RefreshCw className="w-4 h-4" />
          Try again
        </button>
      </body>
    </html>
  )
}
