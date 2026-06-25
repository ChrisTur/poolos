"use client"

import { useActionState } from "react"
import { joinWaitlist } from "@/lib/actions/waitlist"
import { CheckCircle2 } from "lucide-react"

interface Props {
  ctaText?: string
}

export default function WaitlistFormSection({ ctaText = "Join the waitlist" }: Props) {
  const [state, action, pending] = useActionState(
    async (_: unknown, formData: FormData) => joinWaitlist(formData),
    null,
  )

  return (
    <section className="py-16 sm:py-24 bg-white">
      <div className="max-w-xl mx-auto px-4 sm:px-6 text-center">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">{ctaText}</h2>
        <p className="text-gray-400 mb-8">
          Be first to know about new features and availability.
        </p>

        {state?.success ? (
          <div className="flex flex-col items-center gap-3 py-6">
            <CheckCircle2 className="w-12 h-12 text-green-500" />
            <p className="text-base font-semibold text-gray-900">
              {state.alreadyJoined ? "You're already on the list!" : "You're on the list!"}
            </p>
            <p className="text-sm text-gray-400">
              {state.alreadyJoined
                ? "That email is already signed up. We will be in touch."
                : "Thanks for signing up. We will reach out soon."}
            </p>
          </div>
        ) : (
          <form action={action} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <input
              name="email"
              type="email"
              required
              placeholder="you@example.com"
              className="flex-1 rounded-xl border border-gray-300 px-4 py-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
            <button
              type="submit"
              disabled={pending}
              className="shrink-0 bg-sky-600 hover:bg-sky-700 text-white font-semibold px-6 py-3 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {pending ? "Joining…" : ctaText}
            </button>
          </form>
        )}

        {state?.error && (
          <p className="text-sm text-red-600 mt-3">{state.error}</p>
        )}

        <p className="text-xs text-gray-400 mt-4">No spam, ever. Unsubscribe at any time.</p>
      </div>
    </section>
  )
}
