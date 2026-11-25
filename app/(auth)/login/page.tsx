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

      {searchParams.get("error") && (
        <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {searchParams.get("error")}
        </div>
      )}

      <a
        href="/api/auth/google"
        className="flex w-full items-center justify-center gap-3 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors mb-5"
      >
        <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
        Continue with Google
      </a>

      <div className="relative mb-5">
        <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200" /></div>
        <div className="relative flex justify-center"><span className="bg-white px-3 text-xs text-gray-400">or sign in with email</span></div>
      </div>

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
