"use client"

import { useActionState } from "react"
import { completeOnboarding } from "@/lib/actions/company"
import Button from "@/components/ui/Button"
import { CheckCircle, Building2, MapPin, Phone, Globe } from "lucide-react"

const steps = ["Company details", "Address", "Done"]

export default function OnboardingPage() {
  const [state, action, pending] = useActionState(
    async (_: unknown, formData: FormData) => {
      await completeOnboarding(formData)
      return null
    },
    null
  )

  return (
    <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl p-8">
      {/* Progress */}
      <div className="flex items-center gap-2 mb-8">
        {steps.map((step, i) => (
          <div key={step} className="flex items-center gap-2 flex-1 last:flex-none">
            <div className="flex items-center gap-2 shrink-0">
              <div className="w-7 h-7 rounded-full bg-sky-600 text-white text-xs font-bold flex items-center justify-center">
                {i + 1}
              </div>
              <span className="text-xs font-medium text-gray-600 hidden sm:block">{step}</span>
            </div>
            {i < steps.length - 1 && <div className="flex-1 h-px bg-gray-200" />}
          </div>
        ))}
      </div>

      <h1 className="text-xl font-bold text-gray-900 mb-1">Finish setting up your account</h1>
      <p className="text-sm text-gray-500 mb-6">
        Add your company details so your invoices and documents look professional.
        You can always update these later.
      </p>

      <form action={action} className="space-y-5">
        <div className="space-y-3">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-gray-700">
            <Phone className="w-4 h-4 text-sky-500" /> Contact
          </h2>
          <input
            name="phone"
            type="tel"
            placeholder="Business phone (optional)"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
          <input
            name="website"
            type="url"
            placeholder="Website (optional)"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
        </div>

        <div className="space-y-3">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-gray-700">
            <MapPin className="w-4 h-4 text-sky-500" /> Business Address
          </h2>
          <input
            name="address"
            placeholder="Street address (optional)"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
          <div className="grid grid-cols-3 gap-2">
            <input
              name="city"
              placeholder="City"
              className="col-span-1 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
            <input
              name="state"
              placeholder="ST"
              maxLength={2}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
            <input
              name="zip"
              placeholder="ZIP"
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <Button type="submit" disabled={pending} className="flex-1 justify-center">
            {pending ? "Saving…" : "Finish Setup"}
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={() => window.location.href = "/dashboard"}
          >
            Skip for now
          </Button>
        </div>
      </form>
    </div>
  )
}
