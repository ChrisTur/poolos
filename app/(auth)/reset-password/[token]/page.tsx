"use client"

import { useActionState } from "react"
import Link from "next/link"
import { resetPassword } from "@/lib/actions/auth"
import Button from "@/components/ui/Button"
import { use } from "react"

export default function ResetPasswordPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params)

  const [state, action, pending] = useActionState(
    async (_: unknown, formData: FormData) => resetPassword(token, formData),
    null
  )

  if (state?.success) {
    return (
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl p-8 text-center">
        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-lg font-bold text-gray-900 mb-2">Password updated</h1>
        <p className="text-sm text-gray-500 mb-6">
          Your password has been changed. Sign in with your new password.
        </p>
        <Link
          href="/login"
          className="inline-block bg-sky-500 text-white text-sm font-semibold px-5 py-2.5 rounded-lg hover:bg-sky-600 transition-colors"
        >
          Sign in
        </Link>
      </div>
    )
  }

  return (
    <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl p-8">
      <h1 className="text-xl font-bold text-gray-900 mb-1">Set a new password</h1>
      <p className="text-sm text-gray-500 mb-6">Choose a password with at least 8 characters.</p>

      <form action={action} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">New password</label>
          <input
            name="password"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Confirm new password</label>
          <input
            name="confirm"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
        </div>

        {state?.error && (
          <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{state.error}</p>
        )}

        <Button type="submit" disabled={pending} className="w-full justify-center">
          {pending ? "Updating…" : "Update Password"}
        </Button>
      </form>

      <p className="text-center text-sm text-gray-500 mt-6">
        <Link href="/forgot-password" className="text-sky-600 font-medium hover:underline">
          Request a new link
        </Link>
      </p>
    </div>
  )
}
