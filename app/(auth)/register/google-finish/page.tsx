"use client"

import { useActionState } from "react"
import Link from "next/link"
import { finishGoogleSignup } from "@/lib/actions/auth-google"
import Button from "@/components/ui/Button"

export default function GoogleFinishPage() {
  const [state, action, pending] = useActionState(
    async (_: unknown, formData: FormData) => finishGoogleSignup(formData),
    null
  )

  return (
    <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">
      <h1 className="text-xl font-bold text-gray-900 mb-1">One more step</h1>
      <p className="text-sm text-gray-500 mb-6">
        Enter your company name to finish setting up your PoolOS account.
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
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
        </div>

        <div className="flex items-start gap-3 pt-1">
          <input
            id="tcAccepted"
            name="tcAccepted"
            type="checkbox"
            required
            className="mt-0.5 h-4 w-4 rounded border-gray-300 text-sky-600 focus:ring-sky-500 shrink-0 cursor-pointer"
          />
          <label htmlFor="tcAccepted" className="text-xs text-gray-600 leading-relaxed cursor-pointer">
            I agree to the PoolOS{" "}
            <Link href="/terms" target="_blank" className="text-sky-600 hover:underline font-medium">Terms of Service</Link>
            {" "}and{" "}
            <Link href="/privacy" target="_blank" className="text-sky-600 hover:underline font-medium">Privacy Policy</Link>. *
          </label>
        </div>

        <div className="flex items-start gap-3">
          <input
            id="marketingOptIn"
            name="marketingOptIn"
            type="checkbox"
            defaultChecked
            className="mt-0.5 h-4 w-4 rounded border-gray-300 text-sky-600 focus:ring-sky-500 shrink-0 cursor-pointer"
          />
          <label htmlFor="marketingOptIn" className="text-xs text-gray-600 leading-relaxed cursor-pointer">
            Send me product updates and tips from PoolOS.
          </label>
        </div>

        {state?.error && (
          <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{state.error}</p>
        )}

        <Button type="submit" disabled={pending} className="w-full justify-center mt-2">
          {pending ? "Creating account…" : "Finish Setup"}
        </Button>
      </form>
    </div>
  )
}
