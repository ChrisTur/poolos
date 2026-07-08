"use client"

import { useTransition, useState, useMemo } from "react"
import { Megaphone, Users, CheckCircle2, AlertCircle } from "lucide-react"
import Button from "@/components/ui/Button"
import { sendUpsellCampaign } from "@/lib/actions/customers"

type Template = { id: string; name: string }

type Customer = {
  id: string
  firstName: string
  lastName: string
  email: string | null
  lastVisitAt: Date | null
}

interface Props {
  customers: Customer[]
  templates: Template[]
}

const PRESETS = [
  { label: "Pool Opening (no visit this year)", sinceDate: () => `${new Date().getFullYear()}-01-01` },
  { label: "Pool Closing (no visit in 60 days)", sinceDate: () => {
    const d = new Date(); d.setDate(d.getDate() - 60); return d.toISOString().split("T")[0]
  }},
  { label: "Inactive (no visit in 90 days)", sinceDate: () => {
    const d = new Date(); d.setDate(d.getDate() - 90); return d.toISOString().split("T")[0]
  }},
  { label: "Custom cutoff date", sinceDate: () => "" },
]

function defaultSubject(preset: string, companyName: string) {
  if (preset.includes("Opening")) return `Time to open your pool — ${companyName}`
  if (preset.includes("Closing")) return `Don't forget to close your pool — ${companyName}`
  return `We'd love to see you — ${companyName}`
}

function defaultBody(preset: string) {
  if (preset.includes("Opening")) {
    return `Hi [FirstName],

Pool season is here! We haven't opened your pool yet this year — let us know if you'd like to schedule your pool opening.

Reply to this email or give us a call and we'll get you on the schedule.

Looking forward to seeing you this season!`
  }
  if (preset.includes("Closing")) {
    return `Hi [FirstName],

As the season winds down, it's time to think about closing your pool. Proper closing prevents damage over the winter and makes opening a breeze next spring.

Reply to this email or give us a call to schedule your pool closing.

Thanks for being a valued customer!`
  }
  return `Hi [FirstName],

We noticed it's been a while since your last service. We'd love to get you back on the schedule and make sure your pool is in great shape.

Reply to this email or give us a call anytime.

Thanks!`
}

export default function UpsellCampaign({ customers, templates }: Props) {
  const [isPending, startTransition] = useTransition()
  const [preset, setPreset]         = useState(PRESETS[0].label)
  const [sinceDate, setSinceDate]   = useState(PRESETS[0].sinceDate())
  const [subject, setSubject]       = useState("")
  const [body, setBody]             = useState("")
  const [result, setResult]         = useState<{ sent: number; skipped: number; error?: string } | null>(null)

  const isCustom = preset === "Custom cutoff date"

  const effectiveDate = useMemo(() => {
    const p = PRESETS.find((p) => p.label === preset)
    return isCustom ? sinceDate : (p?.sinceDate() ?? "")
  }, [preset, sinceDate, isCustom])

  const targets = useMemo(() => {
    if (!effectiveDate) return customers
    const since = new Date(effectiveDate)
    return customers.filter((c) => !c.lastVisitAt || c.lastVisitAt < since)
  }, [customers, effectiveDate])

  const withEmail = useMemo(() => targets.filter((c) => c.email), [targets])

  function handlePreset(label: string) {
    const p = PRESETS.find((p) => p.label === label)!
    setPreset(label)
    if (label !== "Custom cutoff date") setSinceDate(p.sinceDate())
    setSubject("")
    setBody("")
    setResult(null)
  }

  function prefill() {
    setSubject(defaultSubject(preset, "your company"))
    setBody(defaultBody(preset))
  }

  function handleSend() {
    if (!subject.trim() || !body.trim() || !effectiveDate) return
    startTransition(async () => {
      const res = await sendUpsellCampaign(effectiveDate, subject.trim(), body.trim())
      setResult(res)
    })
  }

  return (
    <div className="max-w-2xl space-y-5">
      {/* Preset picker */}
      <div className="rounded-xl border border-gray-200 bg-white divide-y divide-gray-100">
        <div className="px-5 py-4">
          <h2 className="text-sm font-semibold text-gray-900 mb-3">Campaign type</h2>
          <div className="flex flex-wrap gap-2">
            {PRESETS.map((p) => (
              <button
                key={p.label}
                onClick={() => handlePreset(p.label)}
                className={`px-3.5 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  preset === p.label
                    ? "bg-sky-600 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {isCustom && (
            <div className="mt-3 flex items-center gap-3">
              <label className="text-xs font-medium text-gray-700 shrink-0">No visit since</label>
              <input
                type="date"
                value={sinceDate}
                onChange={(e) => setSinceDate(e.target.value)}
                max={new Date().toISOString().split("T")[0]}
                className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>
          )}
        </div>

        {/* Audience preview */}
        <div className="px-5 py-3 flex items-center justify-between gap-3 text-sm">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-sky-500 shrink-0" />
            {withEmail.length === 0 ? (
              <span className="text-gray-400">
                {targets.length === 0
                  ? "No customers match — try a wider date range."
                  : "Matching customers have no email addresses on file."}
              </span>
            ) : (
              <span className="text-gray-700">
                <strong>{withEmail.length}</strong> customer{withEmail.length !== 1 ? "s" : ""} will receive this email
                {targets.length - withEmail.length > 0 && (
                  <span className="text-gray-400"> · {targets.length - withEmail.length} skipped (no email)</span>
                )}
              </span>
            )}
          </div>
          {!subject && !body && withEmail.length > 0 && (
            <button
              onClick={prefill}
              className="text-xs text-sky-600 hover:underline shrink-0"
            >
              Pre-fill message
            </button>
          )}
        </div>
      </div>

      {/* Result */}
      {result ? (
        <div className={`rounded-xl border px-5 py-4 ${result.error && result.sent === 0 ? "bg-red-50 border-red-200" : "bg-green-50 border-green-200"}`}>
          {result.error && result.sent === 0 ? (
            <div className="flex items-start gap-3 text-red-800">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Failed to send</p>
                <p className="text-sm text-red-600 mt-0.5">{result.error}</p>
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-3 text-green-800">
              <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5 text-green-600" />
              <div>
                <p className="font-semibold">Campaign sent!</p>
                <p className="text-sm text-green-700 mt-0.5">
                  Delivered to {result.sent} customer{result.sent !== 1 ? "s" : ""}
                  {result.skipped > 0 && ` · ${result.skipped} skipped`}
                </p>
              </div>
            </div>
          )}
          <button
            onClick={() => setResult(null)}
            className="mt-3 text-sm text-gray-500 hover:text-gray-700 underline underline-offset-2"
          >
            Send another
          </button>
        </div>
      ) : (
        <div className="rounded-xl border border-gray-200 bg-white divide-y divide-gray-100">
          <div className="px-5 py-4 space-y-4">
            <h2 className="text-sm font-semibold text-gray-900">Compose</h2>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-700">Subject</label>
              <input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g. Time to open your pool!"
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-700">Message</label>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={10}
                placeholder="Write your upsell message here…"
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-500 resize-none"
              />
              <p className="text-xs text-gray-400">Tip: Each email is personalised with the customer's first name.</p>
            </div>
          </div>
          <div className="px-5 py-4 flex justify-end">
            <Button
              onClick={handleSend}
              disabled={isPending || !subject.trim() || !body.trim() || withEmail.length === 0 || !effectiveDate}
            >
              <Megaphone className="w-4 h-4" />
              {isPending ? "Sending…" : `Send to ${withEmail.length} customer${withEmail.length !== 1 ? "s" : ""}`}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
