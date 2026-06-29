"use client"

import { useState, useTransition } from "react"
import { sendTrialConversionEmail } from "@/lib/actions/admin"
import { Mail, Check, AlertCircle } from "lucide-react"

export default function SendTrialEmailButton({ companyId }: { companyId: string }) {
  const [pending, startTransition] = useTransition()
  const [result, setResult] = useState<{ ok: boolean; error?: string } | null>(null)

  if (result?.ok) {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-green-700 font-medium">
        <Check className="w-3.5 h-3.5" /> Sent
      </span>
    )
  }

  return (
    <div className="flex flex-col items-end gap-0.5">
      <button
        onClick={() =>
          startTransition(async () => {
            const r = await sendTrialConversionEmail(companyId)
            setResult(r)
          })
        }
        disabled={pending}
        className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-lg border border-sky-200 text-sky-700 bg-sky-50 hover:bg-sky-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        <Mail className="w-3.5 h-3.5" />
        {pending ? "Sending…" : "Send email"}
      </button>
      {result?.error && (
        <span className="inline-flex items-center gap-1 text-xs text-red-600">
          <AlertCircle className="w-3 h-3" /> {result.error}
        </span>
      )}
    </div>
  )
}
