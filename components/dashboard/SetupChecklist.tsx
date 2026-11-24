"use client"

import { dismissOnboarding } from "@/lib/actions/onboarding"
import { CheckCircle2, Circle, ArrowRight, X, PartyPopper } from "lucide-react"
import Link from "next/link"
import Card from "@/components/ui/Card"
import { useActionState } from "react"

export interface SetupStep {
  label: string
  description: string
  href: string
  done: boolean
}

export default function SetupChecklist({ steps }: { steps: SetupStep[] }) {
  const doneCount = steps.filter((s) => s.done).length
  const allDone = doneCount === steps.length
  const pct = Math.round((doneCount / steps.length) * 100)

  const [, dismiss, dismissPending] = useActionState(async () => {
    await dismissOnboarding()
    return null
  }, null)

  if (allDone) {
    return (
      <Card className="border-emerald-100 overflow-hidden">
        <div className="px-4 sm:px-5 py-4 sm:py-5 bg-gradient-to-r from-emerald-50 to-white flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
              <PartyPopper className="w-5 h-5 text-emerald-600" />
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-gray-900 text-sm sm:text-base">You&rsquo;re all set up!</p>
              <p className="text-xs text-gray-500 mt-0.5">Your account is fully configured and ready to go.</p>
            </div>
          </div>
          <form action={dismiss}>
            <button
              type="submit"
              disabled={dismissPending}
              className="shrink-0 text-xs font-medium text-gray-500 hover:text-gray-700 px-3 py-1.5 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors disabled:opacity-50"
            >
              {dismissPending ? "Dismissing…" : "Got it"}
            </button>
          </form>
        </div>
      </Card>
    )
  }

  return (
    <Card className="border-sky-100 overflow-hidden">
      <div className="px-4 sm:px-5 py-3 sm:py-4 border-b border-sky-100 flex items-center justify-between bg-gradient-to-r from-sky-50 to-white">
        <div>
          <h2 className="font-semibold text-gray-900 text-sm sm:text-base">Get started with PoolOS</h2>
          <p className="text-xs text-gray-500 mt-0.5">{doneCount} of {steps.length} steps complete</p>
        </div>
        <form action={dismiss}>
          <button
            type="submit"
            disabled={dismissPending}
            title="Dismiss"
            className="text-gray-300 hover:text-gray-500 p-1.5 rounded-lg transition-colors disabled:opacity-50"
          >
            <X className="w-4 h-4" />
          </button>
        </form>
      </div>

      <div className="h-1 bg-gray-100">
        <div
          className="h-full bg-sky-500 transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>

      <div className="divide-y divide-gray-50">
        {steps.map((step) => (
          <div key={step.label} className="px-4 sm:px-5 py-3.5 flex items-center gap-3">
            {step.done
              ? <CheckCircle2 className="w-5 h-5 text-sky-500 shrink-0" />
              : <Circle className="w-5 h-5 text-gray-200 shrink-0" />
            }
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-medium ${step.done ? "text-gray-400 line-through" : "text-gray-900"}`}>
                {step.label}
              </p>
              {!step.done && (
                <p className="text-xs text-gray-400 mt-0.5">{step.description}</p>
              )}
            </div>
            {!step.done && (
              <Link
                href={step.href}
                className="shrink-0 p-1.5 text-sky-500 hover:text-sky-700 hover:bg-sky-50 rounded-lg transition-colors"
              >
                <ArrowRight className="w-4 h-4" />
              </Link>
            )}
          </div>
        ))}
      </div>
    </Card>
  )
}
