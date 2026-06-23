"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { AlertTriangle, Clock, CreditCard, XCircle } from "lucide-react"

interface PlanData {
  plan: string
  trialEndsAt: string | null   // ISO string
  stripeSubStatus: string | null
}

function daysRemaining(isoDate: string | null): number | null {
  if (!isoDate) return null
  const ms = new Date(isoDate).getTime() - Date.now()
  return Math.ceil(ms / (1000 * 60 * 60 * 24))
}

export default function PlanGate({
  planData,
  children,
}: {
  planData: PlanData
  children: React.ReactNode
}) {
  const pathname = usePathname()

  const isTrial   = planData.plan === "trial"
  const days      = isTrial ? daysRemaining(planData.trialEndsAt) : null
  const isExpired = isTrial && planData.trialEndsAt !== null && (days === null || days <= 0)
  const isPastDue = planData.stripeSubStatus === "past_due"

  // Hard gate when trial is expired — allow billing page through so they can upgrade
  if (isExpired && !pathname.startsWith("/settings/billing")) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
        <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-4">
          <XCircle className="w-6 h-6 text-red-500" />
        </div>
        <h1 className="text-xl font-bold text-gray-900 mb-2">Your trial has ended</h1>
        <p className="text-sm text-gray-500 max-w-sm mb-6">
          Choose a plan to keep access to your routes, customers, invoices, and history.
          Nothing has been deleted.
        </p>
        <Link
          href="/settings/billing"
          className="inline-flex items-center gap-2 bg-sky-600 hover:bg-sky-700 text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-colors"
        >
          <CreditCard className="w-4 h-4" />
          Choose a plan
        </Link>
      </div>
    )
  }

  return (
    <>
      {/* Trial expiring soon banner */}
      {isTrial && days !== null && days > 0 && days <= 7 && (
        <div className={`flex items-center gap-3 px-4 py-2.5 text-sm font-medium -mt-5 sm:-mt-6 mb-5 sm:mb-6 -mx-4 sm:-mx-6 lg:-mx-8 ${
          days <= 3
            ? "bg-red-50 border-b border-red-200 text-red-800"
            : "bg-amber-50 border-b border-amber-200 text-amber-800"
        }`}>
          <Clock className="w-4 h-4 shrink-0" />
          <span className="flex-1">
            Your free trial ends in <strong>{days} {days === 1 ? "day" : "days"}</strong>.
          </span>
          <Link
            href="/settings/billing"
            className={`shrink-0 font-semibold underline underline-offset-2 ${
              days <= 3 ? "text-red-700 hover:text-red-900" : "text-amber-700 hover:text-amber-900"
            }`}
          >
            Upgrade now →
          </Link>
        </div>
      )}

      {/* Past-due payment warning */}
      {isPastDue && (
        <div className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium -mt-5 sm:-mt-6 mb-5 sm:mb-6 -mx-4 sm:-mx-6 lg:-mx-8 bg-amber-50 border-b border-amber-200 text-amber-800">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span className="flex-1">
            Your last payment failed. Please update your billing details to avoid interruption.
          </span>
          <Link
            href="/settings/billing"
            className="shrink-0 font-semibold underline underline-offset-2 text-amber-700 hover:text-amber-900"
          >
            Update billing →
          </Link>
        </div>
      )}

      {children}
    </>
  )
}
