"use client"

import { useActionState } from "react"
import Link from "next/link"
import { Waves, CheckCircle2 } from "lucide-react"
import { joinWaitlist } from "@/lib/actions/waitlist"

export default function WaitlistPage() {
  const [state, action, pending] = useActionState(
    async (_: unknown, formData: FormData) => joinWaitlist(formData),
    null,
  )

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-sky-600 flex items-center justify-center">
              <Waves className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-gray-900">PoolOS</span>
          </Link>
          <Link href="/" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">
            ← Back to home
          </Link>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 sm:px-6 py-14 sm:py-20">
        {state?.success ? (
          <div className="text-center py-12">
            <CheckCircle2 className="w-14 h-14 text-green-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {state.alreadyJoined ? "Already on the list!" : "You're on the list!"}
            </h1>
            <p className="text-gray-500">
              {state.alreadyJoined
                ? "That email is already signed up. We'll be in touch soon."
                : "Thanks for joining the PoolOS waitlist. We'll reach out as soon as a spot opens up."}
            </p>
          </div>
        ) : (
          <>
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-3">Join the waitlist</h1>
              <p className="text-gray-500">
                PoolOS is growing fast. Enter your email and we will reach out when a spot is available.
              </p>
            </div>

            <form action={action} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name (optional)</label>
                <input
                  name="name"
                  type="text"
                  placeholder="Jane Smith"
                  className="w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Work Email *</label>
                <input
                  name="email"
                  type="email"
                  required
                  placeholder="you@example.com"
                  className="w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              {state?.error && (
                <p className="text-sm text-red-600 bg-red-50 rounded-xl px-3 py-2">{state.error}</p>
              )}

              <button
                type="submit"
                disabled={pending}
                className="w-full bg-sky-600 hover:bg-sky-700 text-white font-semibold py-3 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {pending ? "Joining…" : "Join the waitlist"}
              </button>
            </form>

            <p className="text-center text-xs text-gray-400 mt-4">
              No spam, ever. Unsubscribe at any time.
            </p>
          </>
        )}
      </main>
    </div>
  )
}
