"use client"

import { useActionState } from "react"
import Link from "next/link"
import { requestPasswordReset } from "@/lib/actions/auth"
import Button from "@/components/ui/Button"

export default function ForgotPasswordPage() {
  const [state, action, pending] = useActionState(
    async (_: unknown, formData: FormData) => requestPasswordReset(formData),
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
        <h1 className="text-lg font-bold text-gray-900 mb-2">Check your email</h1>
        <p className="text-sm text-gray-500 mb-6">
          If that email is registered, we've sent a reset link. It expires in 1 hour.
        </p>
        <Link href="/login" className="text-sm text-sky-600 font-medium hover:underline">
          Back to sign in
        </Link>
      </div>
    )
  }

  return (
    <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl p-8">
      <h1 className="text-xl font-bold text-gray-900 mb-1">Forgot your password?</h1>
      <p className="text-sm text-gray-500 mb-6">
        Enter your email and we'll send you a reset link.
      </p>

      <form action={action} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input
            name="email"
            type="email"
            required
            autoComplete="email"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
        </div>

        <Button type="submit" disabled={pending} className="w-full justify-center">
          {pending ? "Sending…" : "Send Reset Link"}
        </Button>
      </form>

      <p className="text-center text-sm text-gray-500 mt-6">
        Remembered it?{" "}
        <Link href="/login" className="text-sky-600 font-medium hover:underline">
          Back to sign in
        </Link>
      </p>
    </div>
  )
}
