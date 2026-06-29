"use client"

import { useState, useTransition, useMemo } from "react"
import { applyPriceIncrease } from "@/lib/actions/priceIncrease"
import { formatCurrency } from "@/lib/utils"
import { CheckCircle2, ChevronRight, DollarSign, Mail, Users } from "lucide-react"
import Card, { CardBody, CardHeader } from "@/components/ui/Card"

type Customer = {
  id: string
  firstName: string
  lastName: string
  email: string | null
  monthlyRate: number
  routeId: string | null
  routeName: string | null
  tagIds: string[]
}

type Route = { id: string; name: string }
type Tag   = { id: string; name: string }

const inputCls = "w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-sky-500"

function computeNewRate(current: number, type: string, amount: number): number {
  if (type === "percent") return Math.round((current * (1 + amount / 100)) * 100) / 100
  if (type === "flat")    return Math.round((current + amount) * 100) / 100
  return Math.round(amount * 100) / 100 // "set"
}

export default function PriceIncreaseWizard({
  customers, routes, tags,
}: {
  customers: Customer[]
  routes: Route[]
  tags: Tag[]
}) {
  // ── Filter state ──────────────────────────────────────────────────────────
  const [filterType, setFilterType]   = useState<"all" | "route" | "tag">("all")
  const [filterRouteId, setFilterRouteId] = useState("")
  const [filterTagId, setFilterTagId]   = useState("")

  // ── Rate change state ─────────────────────────────────────────────────────
  const [changeType, setChangeType] = useState<"percent" | "flat" | "set">("percent")
  const [amount, setAmount]         = useState("")

  // ── Email + confirm state ─────────────────────────────────────────────────
  const [sendEmail, setSendEmail]         = useState(false)
  const [effectiveDate, setEffectiveDate] = useState(() => {
    const d = new Date()
    d.setDate(d.getDate() + 30)
    return d.toISOString().split("T")[0]
  })
  const [note, setNote] = useState("")

  const [done, setDone]   = useState<{ updated: number; emailed: number } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  // ── Derived: filtered customers ───────────────────────────────────────────
  const filtered = useMemo(() => {
    if (filterType === "route")
      return customers.filter((c) => c.routeId === filterRouteId)
    if (filterType === "tag")
      return customers.filter((c) => filterTagId && c.tagIds.includes(filterTagId))
    return customers
  }, [customers, filterType, filterRouteId, filterTagId])

  // ── Derived: preview rows ─────────────────────────────────────────────────
  const amountNum = parseFloat(amount)
  const validAmount = !isNaN(amountNum) && amountNum > 0

  const preview = useMemo(() => {
    if (!validAmount) return []
    return filtered.map((c) => ({
      ...c,
      newRate: computeNewRate(c.monthlyRate, changeType, amountNum),
    }))
  }, [filtered, changeType, amountNum, validAmount])

  const totalOld = preview.reduce((s, r) => s + r.monthlyRate, 0)
  const totalNew = preview.reduce((s, r) => s + r.newRate, 0)
  const withEmail = preview.filter((r) => r.email).length

  function handleApply() {
    if (preview.length === 0) return
    setError(null)
    startTransition(async () => {
      const newRates: Record<string, number> = {}
      preview.forEach((r) => { newRates[r.id] = r.newRate })
      const result = await applyPriceIncrease({
        customerIds: preview.map((r) => r.id),
        newRates,
        sendEmail,
        effectiveDate: new Date(effectiveDate).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }),
        note: note || "Price increase wizard",
      })
      if (result.error) {
        setError(result.error)
      } else {
        setDone({ updated: result.updated, emailed: result.emailed })
      }
    })
  }

  if (done) {
    return (
      <Card>
        <CardBody>
          <div className="text-center py-10 space-y-4">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
            <div>
              <p className="text-xl font-bold text-gray-900">Done!</p>
              <p className="text-sm text-gray-500 mt-1">
                {done.updated} customer{done.updated !== 1 ? "s" : ""} updated
                {done.emailed > 0 && ` · ${done.emailed} notification email${done.emailed !== 1 ? "s" : ""} sent`}
              </p>
            </div>
            <div className="flex gap-3 justify-center">
              <a href="/customers" className="inline-flex items-center gap-2 text-sm font-medium text-sky-600 hover:text-sky-800">
                View customers
              </a>
              <a href="/reports/profitability" className="inline-flex items-center gap-2 text-sm font-medium text-sky-600 hover:text-sky-800">
                Profitability report
              </a>
            </div>
          </div>
        </CardBody>
      </Card>
    )
  }

  return (
    <div className="space-y-5">
      {/* Step 1: Filter */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-sky-600 text-white text-xs font-bold flex items-center justify-center shrink-0">1</span>
            <h2 className="font-semibold text-gray-900 text-sm">Select customers</h2>
          </div>
        </CardHeader>
        <CardBody className="space-y-4">
          <div className="flex gap-2 flex-wrap">
            {(["all", "route", "tag"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setFilterType(t)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                  filterType === t
                    ? "bg-sky-600 text-white border-sky-600"
                    : "bg-white text-gray-600 border-gray-300 hover:border-gray-400"
                }`}
              >
                {t === "all" ? "All active customers" : t === "route" ? "By route" : "By tag"}
              </button>
            ))}
          </div>

          {filterType === "route" && (
            <select value={filterRouteId} onChange={(e) => setFilterRouteId(e.target.value)} className={inputCls}>
              <option value="">Select a route…</option>
              {routes.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
          )}
          {filterType === "tag" && (
            <select value={filterTagId} onChange={(e) => setFilterTagId(e.target.value)} className={inputCls}>
              <option value="">Select a tag…</option>
              {tags.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          )}

          <p className="text-sm text-gray-500 flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5" />
            <span><strong className="text-gray-900">{filtered.length}</strong> customer{filtered.length !== 1 ? "s" : ""} selected</span>
          </p>
        </CardBody>
      </Card>

      {/* Step 2: Rate change */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-sky-600 text-white text-xs font-bold flex items-center justify-center shrink-0">2</span>
            <h2 className="font-semibold text-gray-900 text-sm">Set rate change</h2>
          </div>
        </CardHeader>
        <CardBody className="space-y-4">
          <div className="flex gap-2 flex-wrap">
            {([
              { value: "percent", label: "% increase" },
              { value: "flat",    label: "+ flat amount" },
              { value: "set",     label: "Set to amount" },
            ] as const).map((t) => (
              <button
                key={t.value}
                type="button"
                onClick={() => setChangeType(t.value)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                  changeType === t.value
                    ? "bg-sky-600 text-white border-sky-600"
                    : "bg-white text-gray-600 border-gray-300 hover:border-gray-400"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 max-w-xs">
            <span className="text-gray-500 text-sm">{changeType === "percent" ? "+" : "$"}</span>
            <input
              type="number"
              min="0"
              step={changeType === "percent" ? "0.1" : "1"}
              placeholder={changeType === "percent" ? "e.g. 10" : "e.g. 5"}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className={inputCls}
            />
            {changeType === "percent" && <span className="text-gray-500 text-sm">%</span>}
          </div>
        </CardBody>
      </Card>

      {/* Step 3: Preview */}
      {preview.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-sky-600 text-white text-xs font-bold flex items-center justify-center shrink-0">3</span>
              <h2 className="font-semibold text-gray-900 text-sm">Preview changes</h2>
            </div>
            <div className="text-xs text-gray-500">
              MRR: {formatCurrency(totalOld)} → <span className="font-semibold text-emerald-700">{formatCurrency(totalNew)}</span>
              <span className="ml-2 text-emerald-600">(+{formatCurrency(totalNew - totalOld)}/mo)</span>
            </div>
          </CardHeader>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-xs text-gray-500 uppercase tracking-wide">
                  <th className="px-5 py-2.5 text-left font-medium">Customer</th>
                  <th className="px-5 py-2.5 text-left font-medium hidden sm:table-cell">Route</th>
                  <th className="px-5 py-2.5 text-right font-medium">Current</th>
                  <th className="px-5 py-2.5 text-right font-medium">New rate</th>
                  <th className="px-5 py-2.5 text-right font-medium">Change</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {preview.map((r) => (
                  <tr key={r.id} className="hover:bg-gray-50">
                    <td className="px-5 py-2.5">
                      <p className="font-medium text-gray-900">{r.firstName} {r.lastName}</p>
                      {!r.email && <p className="text-xs text-gray-400">no email</p>}
                    </td>
                    <td className="px-5 py-2.5 text-gray-500 hidden sm:table-cell">{r.routeName ?? "—"}</td>
                    <td className="px-5 py-2.5 text-right text-gray-500">{formatCurrency(r.monthlyRate)}</td>
                    <td className="px-5 py-2.5 text-right font-semibold text-gray-900">{formatCurrency(r.newRate)}</td>
                    <td className="px-5 py-2.5 text-right text-emerald-600 font-medium">
                      +{formatCurrency(r.newRate - r.monthlyRate)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Confirm + email options */}
          <CardBody className="space-y-4 border-t border-gray-100">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Effective date (for email)</label>
                <input type="date" value={effectiveDate} onChange={(e) => setEffectiveDate(e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Internal note (optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Annual increase — inflation adjustment"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className={inputCls}
                />
              </div>
            </div>

            <label className="flex items-start gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={sendEmail}
                onChange={(e) => setSendEmail(e.target.checked)}
                className="w-4 h-4 mt-0.5 rounded border-gray-300 text-sky-600 focus:ring-sky-500"
              />
              <div>
                <p className="text-sm font-medium text-gray-700">Send rate-increase email to customers</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {withEmail} of {preview.length} customer{preview.length !== 1 ? "s" : ""} have an email address
                </p>
              </div>
            </label>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <button
              type="button"
              onClick={handleApply}
              disabled={pending}
              className="inline-flex items-center gap-2 bg-sky-600 hover:bg-sky-700 disabled:opacity-50 text-white font-semibold text-sm px-5 py-2.5 rounded-lg transition-colors"
            >
              {pending ? (
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <DollarSign className="w-4 h-4" />
              )}
              {pending ? "Applying…" : `Apply to ${preview.length} customer${preview.length !== 1 ? "s" : ""}${sendEmail ? ` · send ${withEmail} email${withEmail !== 1 ? "s" : ""}` : ""}`}
            </button>
          </CardBody>
        </Card>
      )}

      {filtered.length > 0 && !validAmount && (
        <p className="text-sm text-gray-400 text-center">Enter an amount above to preview changes.</p>
      )}
      {filtered.length === 0 && filterType !== "all" && (
        <p className="text-sm text-gray-400 text-center">No customers match this filter.</p>
      )}
    </div>
  )
}
