import { dismissOnboarding } from "@/lib/actions/onboarding"
import { CheckCircle2, Circle, ArrowRight, X } from "lucide-react"
import Link from "next/link"
import Card from "@/components/ui/Card"

export interface SetupStep {
  label: string
  description: string
  href: string
  done: boolean
}

export default function SetupChecklist({ steps }: { steps: SetupStep[] }) {
  const doneCount = steps.filter((s) => s.done).length
  if (doneCount === steps.length) return null

  const pct = Math.round((doneCount / steps.length) * 100)

  return (
    <Card className="border-sky-100 overflow-hidden">
      <div className="px-4 sm:px-5 py-3 sm:py-4 border-b border-sky-100 flex items-center justify-between bg-gradient-to-r from-sky-50 to-white">
        <div>
          <h2 className="font-semibold text-gray-900 text-sm sm:text-base">Get started with PoolOS</h2>
          <p className="text-xs text-gray-500 mt-0.5">{doneCount} of {steps.length} steps complete</p>
        </div>
        <form action={dismissOnboarding}>
          <button
            type="submit"
            title="Dismiss"
            className="text-gray-300 hover:text-gray-500 p-1.5 rounded-lg transition-colors"
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
