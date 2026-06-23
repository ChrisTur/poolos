import Link from "next/link"
import { Waves, ArrowLeft } from "lucide-react"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Page Not Found — PoolOS",
}

export default function NotFound() {
  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-4 text-center">
      <Link href="/" className="flex items-center gap-2 mb-10">
        <div className="w-8 h-8 rounded-lg bg-sky-600 flex items-center justify-center">
          <Waves className="w-5 h-5 text-white" />
        </div>
        <span className="font-bold text-gray-900 text-lg">PoolOS</span>
      </Link>

      <p className="text-7xl font-extrabold text-sky-600 mb-4">404</p>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Page not found</h1>
      <p className="text-gray-500 mb-8 max-w-sm">
        That page doesn't exist or has been moved. Check the URL or head back to safety.
      </p>

      <div className="flex flex-col sm:flex-row gap-3">
        <Link
          href="/"
          className="inline-flex items-center gap-2 bg-sky-600 text-white font-semibold text-sm px-5 py-2.5 rounded-xl hover:bg-sky-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to home
        </Link>
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
