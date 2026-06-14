"use client"

import { useActionState } from "react"
import Link from "next/link"
import { registerCompany } from "@/lib/actions/auth"
import Button from "@/components/ui/Button"

export default function RegisterPage() {
  const [state, action, pending] = useActionState(
    async (_: unknown, formData: FormData) => registerCompany(formData),
    null
  )

  return (
    <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">
      <h1 className="text-xl font-bold text-gray-900 mb-1">Create your PoolOS account</h1>
      <p className="text-sm text-gray-500 mb-6">
        Set up your pool company in minutes. Free to get started.
      </p>

      <form action={action} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Company Name *
          </label>
          <input
            name="companyName"
            required
            placeholder="Sunshine Pool Service"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
            <input
              name="firstName"
              required
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
            <input
              name="lastName"
              required
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Work Email *</label>
          <input
            name="email"
            type="email"
            required
            autoComplete="email"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
          <input
            name="password"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            placeholder="At least 8 characters"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
        </div>

        {state?.error && (
          <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{state.error}</p>
        )}

        <Button type="submit" disabled={pending} className="w-full justify-center mt-2">
          {pending ? "Creating account…" : "Create Account"}
        </Button>
      </form>

      <p className="text-center text-xs text-gray-400 mt-4">
        By signing up you agree to our terms of service.
      </p>

      <p className="text-center text-sm text-gray-500 mt-3">
        Already have an account?{" "}
        <Link href="/login" className="text-sky-600 font-medium hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  )
}
