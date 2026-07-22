"use client"

import Link from "next/link"
import { Waves, RefreshCw } from "lucide-react"

export default function Error({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string }
  unstable_retry: () => void
}) {

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-4 text-center">
      <Link href="/" className="flex items-center gap-2 mb-10">
        <div className="w-8 h-8 rounded-lg bg-sky-600 flex items-center justify-center">
          <Waves className="w-5 h-5 text-white" />
        </div>
        <span className="font-bold text-gray-900 text-lg">PoolOS</span>
      </Link>

      <p className="text-7xl font-extrabold text-gray-200 mb-4">500</p>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Something went wrong</h1>
      <p className="text-gray-500 mb-2 max-w-sm">
        An unexpected error occurred. Our team has been notified. Try refreshing — it often clears itself up.
      </p>
      {error.digest && (
        <p className="text-xs text-gray-400 mb-6 font-mono">Error ID: {error.digest}</p>
      )}

      <div className="flex flex-col sm:flex-row gap-3 mt-2">
        <button
          onClick={() => unstable_retry()}
          className="inline-flex items-center gap-2 bg-sky-600 text-white font-semibold text-sm px-5 py-2.5 rounded-xl hover:bg-sky-700 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Try again
        </button>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 border border-gray-200 text-gray-700 font-semibold text-sm px-5 py-2.5 rounded-xl hover:bg-gray-50 transition-colors"
        >
          Go to dashboard
        </Link>
      </div>
    </div>
  )
}
