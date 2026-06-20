"use client"

import { useActionState } from "react"
import { changePassword } from "@/lib/actions/auth"
import Button from "@/components/ui/Button"

export default function ChangePasswordPage() {
  const [state, action, pending] = useActionState(
    async (_: unknown, formData: FormData) => changePassword(formData),
    null
  )

  return (
    <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl p-8">
      <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <svg className="w-6 h-6 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      </div>

      <h1 className="text-xl font-bold text-gray-900 mb-1 text-center">Set a new password</h1>
      <p className="text-sm text-gray-500 mb-6 text-center">
        Your account requires a new password before you can continue.
      </p>

      {state?.error && (
        <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {state.error}
        </div>
      )}

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
          <label className="block text-sm font-medium text-gray-700 mb-1">Confirm password</label>
          <input
            name="confirm"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
        </div>

        <p className="text-xs text-gray-400">
          Minimum 8 characters. Must not be a known breached password.
        </p>

        <Button type="submit" disabled={pending} className="w-full justify-center">
          {pending ? "Saving…" : "Set Password & Continue"}
        </Button>
      </form>
    </div>
  )
}
