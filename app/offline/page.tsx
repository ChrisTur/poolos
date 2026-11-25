"use client"

export default function OfflinePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white px-6 text-center">
      <svg
        className="w-16 h-16 text-sky-400 mb-6"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.5}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
        />
      </svg>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">You&rsquo;re offline</h1>
      <p className="text-gray-500 text-sm max-w-xs">
        No internet connection. Some pages you&rsquo;ve visited recently are still available. Check back when you&rsquo;re online.
      </p>
      <button
        onClick={() => window.location.reload()}
        className="mt-6 px-5 py-2.5 rounded-xl bg-sky-600 text-white text-sm font-semibold hover:bg-sky-700 transition-colors"
      >
        Try again
      </button>
    </div>
  )
}
