"use client"

import { Suspense } from "react"
import { useActionState } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { login } from "@/lib/actions/auth"
import Button from "@/components/ui/Button"

function LoginForm() {
  const searchParams = useSearchParams()
  const [state, action, pending] = useActionState(
    async (_: unknown, formData: FormData) => login(formData),
    null
  )

  return (
    <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl p-8">
      <h1 className="text-xl font-bold text-gray-900 mb-1">Sign in to PoolOS</h1>
      <p className="text-sm text-gray-500 mb-6">Enter your credentials to continue.</p>

      {searchParams.get("changed") && (
        <div className="mb-4 rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700">
          Password updated successfully. Please sign in with your new password.
        </div>
      )}

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
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-sm font-medium text-gray-700">Password</label>
            <Link href="/forgot-password" className="text-xs text-sky-600 hover:underline">
              Forgot password?
            </Link>
          </div>
          <input
            name="password"
            type="password"
            required
            autoComplete="current-password"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
        </div>

        {state?.error && (
          <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{state.error}</p>
        )}

        <Button type="submit" disabled={pending} className="w-full justify-center">
          {pending ? "Signing in…" : "Sign In"}
        </Button>
      </form>

      <p className="text-center text-sm text-gray-500 mt-6">
        Don&apos;t have an account?{" "}
        <Link href="/register" className="text-sky-600 font-medium hover:underline">
          Sign up free
        </Link>
      </p>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl p-8">
        <div className="h-8 bg-gray-100 rounded animate-pulse mb-4" />
        <div className="space-y-3">
          <div className="h-10 bg-gray-100 rounded animate-pulse" />
          <div className="h-10 bg-gray-100 rounded animate-pulse" />
          <div className="h-10 bg-gray-100 rounded animate-pulse" />
        </div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  )
}
