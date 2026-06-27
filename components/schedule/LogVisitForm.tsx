"use client"

import { useState, useMemo, useRef } from "react"
import { useRouter } from "next/navigation"
import { logVisit } from "@/lib/actions/routes"
import { getUploadUrl } from "@/lib/actions/attachments"
import { runDosing, type DoseResult } from "@/lib/chemistry"
import Button from "@/components/ui/Button"
import {
  Camera, X, Loader2, CheckCircle2, FlaskConical,
  ChevronDown, ChevronUp, AlertTriangle, CheckSquare, Square, Plus, Beaker,
} from "lucide-react"
import type { Customer, Route, VisitChecklistItem } from "@/app/generated/prisma/client"

// ── Types ─────────────────────────────────────────────────────────────────────

type ChemFields = {
  chlorine: string; ph: string; alkalinity: string
  calcium: string; cya: string; salt: string
}

const EMPTY_CHEM: ChemFields = { chlorine: "", ph: "", alkalinity: "", calcium: "", cya: "", salt: "" }

type ChemicalUsageRow = {
  productName: string
  quantity: string
  unit: string
  unitCost: string
}

const UNITS = ["oz", "lbs", "gal", "tablets", "bags", "quarts"] as const

const EMPTY_CHEMICAL_ROW: ChemicalUsageRow = {
  productName: "",
  quantity: "",
  unit: "oz",
  unitCost: "",
}

// ── Constants ─────────────────────────────────────────────────────────────────

const STATUSES = [
  { value: "completed", label: "Completed", color: "bg-green-100 text-green-700 border-green-300 ring-green-400" },
  { value: "skipped",   label: "Skipped",   color: "bg-gray-100  text-gray-600  border-gray-300  ring-gray-400"  },
  { value: "issue",     label: "Issue",     color: "bg-red-100   text-red-700   border-red-300   ring-red-400"   },
]

const TEMPLATES = [
  { label: "All clear",        body: "Service completed. All chemical readings within normal range. Pool is clean." },
  { label: "Chemicals added",  body: "Service completed. Added chemicals to balance water. Please avoid swimming for 4 hours." },
  { label: "Filter cleaned",   body: "Service completed. Cleaned and backwashed filter. Emptied skimmer baskets, brushed walls and vacuumed." },
  { label: "No access",        body: "Unable to access pool today. Please ensure gate is unlocked for the next scheduled visit." },
]

const inputCls = "w-full rounded-lg border border-gray-300 px-3 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-500"

// ── Dosing summary (compact inline display) ───────────────────────────────────

function DosingPanel({ results }: { results: DoseResult[] }) {
  const [open, setOpen] = useState(true)
  const outOfRange = results.filter((r) => r.status !== "ok")
  const inRange    = results.filter((r) => r.status === "ok")

  return (
    <div className="rounded-xl border border-sky-200 bg-sky-50 overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-2.5 text-left"
      >
        <div className="flex items-center gap-2">
          <FlaskConical className="w-4 h-4 text-sky-600" />
          <span className="text-sm font-semibold text-sky-900">Dosing Recommendations</span>
          {outOfRange.length === 0
            ? <span className="text-xs font-medium text-green-700 bg-green-100 px-2 py-0.5 rounded-full">All in range</span>
            : <span className="text-xs font-medium text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">{outOfRange.length} need attention</span>}
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-sky-600" /> : <ChevronDown className="w-4 h-4 text-sky-600" />}
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-2 border-t border-sky-200">
          {outOfRange.map((r) => (
            <div key={r.key} className={`rounded-lg px-3 py-2.5 border ${r.status === "low" ? "bg-amber-50 border-amber-200" : "bg-red-50 border-red-200"}`}>
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="text-xs font-semibold text-gray-800">{r.label}</span>
                <span className={`text-xs font-bold ${r.status === "low" ? "text-amber-700" : "text-red-700"}`}>
                  {r.current}{r.unit ? ` ${r.unit}` : ""} {r.status === "low" ? "▼ Low" : "▲ High"}
                </span>
              </div>
              {r.actions.slice(0, 1).map((a, i) => (
                <p key={i} className="text-xs text-gray-700">
                  <span className="font-medium">{a.chemical}</span>
                  {a.amount && <span className="ml-1 font-bold text-sky-700">{a.amount}</span>}
                  {a.note && <span className="ml-1 text-gray-500">— {a.note}</span>}
                </p>
              ))}
              {r.actions.length > 1 && (
                <p className="text-xs text-gray-400 mt-1">or {r.actions.slice(1).map(a => a.chemical).join(" / ")}</p>
              )}
            </div>
          ))}
          {inRange.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {inRange.map((r) => (
                <span key={r.key} className="inline-flex items-center gap-1 text-xs text-green-700 bg-green-50 border border-green-200 rounded-full px-2 py-0.5">
                  <CheckCircle2 className="w-3 h-3" />{r.label}
                </span>
              ))}
            </div>
          )}
          <p className="text-xs text-gray-400 pt-1">
            Based on {results[0] ? "entered readings" : "—"}. Always follow product directions and retest before swimming.
          </p>
        </div>
      )}
    </div>
  )
}

// ── Main form ─────────────────────────────────────────────────────────────────

type RouteWithAssignment = Route & { assignedUserId?: string | null }
type UserOption = { id: string; firstName: string; lastName: string }
type CustomerWithEquipment = Customer & { equipment?: { type: string }[] }

export default function LogVisitForm({
  customers,
  routes,
  checklistItems = [],
  users = [],
}: {
  customers: CustomerWithEquipment[]
  routes: RouteWithAssignment[]
  checklistItems?: VisitChecklistItem[]
  users?: UserOption[]
}) {
  const router  = useRouter()
  const formRef = useRef<HTMLFormElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const [customerId,    setCustomerId]    = useState("")
  const [selectedRoute, setSelectedRoute] = useState("")
  const [technicianId,  setTechnicianId]  = useState("")
  const [status,        setStatus]        = useState("completed")
  const [saltwater,     setSaltwater]     = useState(false)
  const [chem,          setChem]          = useState<ChemFields>(EMPTY_CHEM)
  const [notes,         setNotes]         = useState("")
  const [photos,        setPhotos]        = useState<File[]>([])
  const [previews,      setPreviews]      = useState<string[]>([])
  const [checked,       setChecked]       = useState<Set<string>>(new Set())
  const [submitting,    setSubmitting]    = useState(false)
  const [done,          setDone]          = useState(false)
  const [error,         setError]         = useState<string | null>(null)
  const [chemOpen,      setChemOpen]      = useState(false)
  const [chemicalRows,  setChemicalRows]  = useState<ChemicalUsageRow[]>([])

  // Derive selected customer's pool info
  const selectedCustomer = customers.find((c) => c.id === customerId) ?? null
  const poolVolume = selectedCustomer?.poolSize ? parseFloat(selectedCustomer.poolSize) : null
  const hasSaltSystem = selectedCustomer?.equipment?.some((e) => e.type === "salt_system") ?? false
  const inferredSaltwater = hasSaltSystem || (selectedCustomer?.poolType?.toLowerCase().includes("salt") ?? false)

  // Auto-set saltwater when customer changes
  function handleCustomerChange(id: string) {
    setCustomerId(id)
    const c = customers.find((x) => x.id === id)
    const saltEquipment = c?.equipment?.some((e) => e.type === "salt_system") ?? false
    if (saltEquipment || c?.poolType?.toLowerCase().includes("salt")) setSaltwater(true)
    else setSaltwater(false)
  }

  // Pre-fill assigned tech when route changes
  function handleRouteChange(routeId: string) {
    setSelectedRoute(routeId)
    if (routeId) {
      const route = routes.find((r) => r.id === routeId)
      if (route?.assignedUserId) setTechnicianId(route.assignedUserId)
    }
  }

  // Run dosing calculation whenever readings or pool info change
  const dosingResults = useMemo<DoseResult[] | null>(() => {
    const fc  = parseFloat(chem.chlorine)
    const ph  = parseFloat(chem.ph)
    const ta  = parseFloat(chem.alkalinity)
    const ch  = parseFloat(chem.calcium)
    const cya = parseFloat(chem.cya)
    const sl  = parseFloat(chem.salt)

    // Need at least 2 readings for a useful calculation
    const entered = [fc, ph, ta, ch, cya].filter((v) => !isNaN(v) && v > 0)
    if (entered.length < 2) return null

    return runDosing({
      volume:    poolVolume && !isNaN(poolVolume) ? poolVolume : 15000,
      fc:        isNaN(fc)  ? 0 : fc,
      ph:        isNaN(ph)  ? 0 : ph,
      ta:        isNaN(ta)  ? 0 : ta,
      ch:        isNaN(ch)  ? 0 : ch,
      cya:       isNaN(cya) ? 0 : cya,
      salt:      isNaN(sl)  ? 0 : sl,
      saltwater,
    })
  }, [chem, saltwater, poolVolume])

  // Checklist: global items + items specific to the selected customer
  const activeChecklist = status === "completed"
    ? checklistItems.filter((item) => !item.customerId || item.customerId === customerId)
    : []
  const checklistComplete = activeChecklist.every((item) => checked.has(item.id))

  function toggleCheck(id: string) {
    setChecked((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function applyTemplate(body: string) { setNotes(body) }

  function addChemicalRow() {
    setChemicalRows((prev) => [...prev, { ...EMPTY_CHEMICAL_ROW }])
    setChemOpen(true)
  }

  function removeChemicalRow(i: number) {
    setChemicalRows((prev) => prev.filter((_, idx) => idx !== i))
  }

  function updateChemicalRow(i: number, field: keyof ChemicalUsageRow, value: string) {
    setChemicalRows((prev) => prev.map((row, idx) => idx === i ? { ...row, [field]: value } : row))
  }

  function computedChemicalUsages() {
    return chemicalRows
      .filter((r) => r.productName.trim() && parseFloat(r.quantity) > 0)
      .map((r) => {
        const qty  = parseFloat(r.quantity) || 0
        const cost = parseFloat(r.unitCost) || 0
        return {
          productName: r.productName.trim(),
          quantity:    qty,
          unit:        r.unit,
          unitCost:    cost,
          totalCost:   parseFloat((qty * cost).toFixed(2)),
        }
      })
  }

  function addPhotos(files: FileList | null) {
    if (!files) return
    const next = Array.from(files)
    setPhotos((p) => [...p, ...next])
    setPreviews((p) => [...p, ...next.map((f) => URL.createObjectURL(f))])
    if (fileRef.current) fileRef.current.value = ""
  }

  function removePhoto(i: number) {
    URL.revokeObjectURL(previews[i])
    setPhotos((p) => p.filter((_, idx) => idx !== i))
    setPreviews((p) => p.filter((_, idx) => idx !== i))
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!checklistComplete) return
    setSubmitting(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    formData.set("saltwater", String(saltwater))
    formData.set("chemicalUsages", JSON.stringify(computedChemicalUsages()))

    for (const file of photos) {
      try {
        const { url, key } = await getUploadUrl(file.name, file.type)
        const res = await fetch(url, { method: "PUT", body: file, headers: { "Content-Type": file.type } })
        if (res.ok) formData.append("attachmentKey", key)
      } catch { /* skip failed uploads */ }
    }

    try {
      await logVisit(formData)
      setDone(true)
      setNotes("")
      setPhotos([])
      setPreviews([])
      setStatus("completed")
      setChem(EMPTY_CHEM)
      setChecked(new Set())
      setChemicalRows([])
      setChemOpen(false)
      formRef.current?.reset()
      // Re-detect saltwater from customer after reset
      if (customerId) handleCustomerChange(customerId)
      router.refresh()
      setTimeout(() => setDone(false), 3000)
    } catch {
      setError("Failed to log visit. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-5">

      {/* Customer */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Customer *</label>
        <select
          name="customerId"
          required
          value={customerId}
          onChange={(e) => handleCustomerChange(e.target.value)}
          className={inputCls}
        >
          <option value="">Select customer…</option>
          {customers.map((c) => (
            <option key={c.id} value={c.id}>{c.firstName} {c.lastName}</option>
          ))}
        </select>
        {selectedCustomer?.poolSize && (
          <p className="text-xs text-gray-400 mt-1">
            Pool: {parseFloat(selectedCustomer.poolSize).toLocaleString()} gal
            {selectedCustomer.poolType && ` · ${selectedCustomer.poolType}`}
          </p>
        )}
      </div>

      {/* Route */}
      {routes.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Route</label>
          <select
            name="routeId"
            value={selectedRoute}
            onChange={(e) => handleRouteChange(e.target.value)}
            className={inputCls}
          >
            <option value="">None</option>
            {routes.map((r) => (
              <option key={r.id} value={r.id}>{r.name}</option>
            ))}
          </select>
        </div>
      )}

      {/* Technician */}
      {users.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Technician</label>
          <select
            name="technicianId"
            value={technicianId}
            onChange={(e) => setTechnicianId(e.target.value)}
            className={inputCls}
          >
            <option value="">Unassigned</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>{u.firstName} {u.lastName}</option>
            ))}
          </select>
        </div>
      )}

      {/* Status toggle */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
        <input type="hidden" name="status" value={status} />
        <div className="flex gap-2">
          {STATUSES.map((s) => (
            <button
              key={s.value}
              type="button"
              onClick={() => setStatus(s.value)}
              className={`flex-1 py-3 px-3 rounded-lg border text-sm font-medium transition-all ${
                status === s.value
                  ? `${s.color} ring-2`
                  : "bg-white text-gray-500 border-gray-200 hover:border-gray-300"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Chemical readings */}
      <fieldset>
        <div className="flex items-center justify-between mb-2">
          <legend className="text-sm font-medium text-gray-700">Chemical Readings</legend>
          {!poolVolume && (
            <span className="text-xs text-gray-400">Add pool size on customer profile for accurate dosing</span>
          )}
        </div>

        {/* Saltwater toggle */}
        <label className="flex items-center gap-3 mb-3 cursor-pointer select-none rounded-lg px-1 py-2 -mx-1 hover:bg-gray-50 active:bg-gray-100 transition-colors">
          <input
            type="checkbox"
            checked={saltwater}
            onChange={(e) => setSaltwater(e.target.checked)}
            className="w-5 h-5 rounded border-gray-300 text-sky-600 focus:ring-sky-500 shrink-0 cursor-pointer"
          />
          <span className="text-sm text-gray-700 flex-1">Saltwater pool</span>
          {inferredSaltwater && !saltwater && (
            <span className="text-xs text-amber-600">(detected from pool type)</span>
          )}
        </label>

        <div className="grid grid-cols-2 gap-3">
          {[
            { name: "chlorine",   label: "Free Chlorine", step: "0.1", hint: "1–3 ppm"    },
            { name: "ph",         label: "pH",            step: "0.1", hint: "7.2–7.6"    },
            { name: "alkalinity", label: "Total Alk.",    step: "1",   hint: "80–120 ppm" },
            { name: "calcium",    label: "Calcium Hard.", step: "1",   hint: "200–400 ppm"},
            { name: "cya",        label: "CYA / Stabilizer", step: "1", hint: "30–50 ppm"},
            ...(saltwater ? [{ name: "salt", label: "Salt Level", step: "10", hint: "2700–3400 ppm" }] : []),
          ].map((f) => (
            <div key={f.name}>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                {f.label} <span className="text-gray-400 font-normal">{f.hint}</span>
              </label>
              <input
                name={f.name}
                type="number"
                inputMode="decimal"
                step={f.step}
                min="0"
                placeholder="—"
                value={chem[f.name as keyof ChemFields] ?? ""}
                onChange={(e) => setChem((prev) => ({ ...prev, [f.name]: e.target.value }))}
                className={inputCls}
              />
            </div>
          ))}
        </div>
      </fieldset>

      {/* Dosing recommendations — shown once 2+ readings are entered */}
      {dosingResults && <DosingPanel results={dosingResults} />}

      {/* Checklist — only shown for "completed" visits */}
      {activeChecklist.length > 0 && (
        <fieldset className="space-y-2">
          <legend className="text-sm font-medium text-gray-700 flex items-center gap-2">
            Pre-completion checklist
            {!checklistComplete && (
              <span className="text-xs font-normal text-amber-600 flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" />
                Required before submitting
              </span>
            )}
          </legend>
          <div className="rounded-xl border border-gray-200 divide-y divide-gray-100 overflow-hidden">
            {activeChecklist.map((item) => {
              const isChecked = checked.has(item.id)
              return (
                <div
                  key={item.id}
                  role="checkbox"
                  aria-checked={isChecked}
                  tabIndex={0}
                  onClick={() => toggleCheck(item.id)}
                  onKeyDown={(e) => (e.key === " " || e.key === "Enter") && toggleCheck(item.id)}
                  className={`flex items-center gap-3 px-4 py-4 cursor-pointer select-none transition-colors active:opacity-70 ${
                    isChecked ? "bg-green-50" : "bg-white hover:bg-gray-50 active:bg-gray-100"
                  }`}
                >
                  <div className={`shrink-0 transition-colors ${isChecked ? "text-green-500" : "text-gray-300"}`}>
                    {isChecked
                      ? <CheckSquare className="w-6 h-6" />
                      : <Square className="w-6 h-6" />}
                  </div>
                  <span className={`text-sm font-medium flex-1 leading-snug ${isChecked ? "text-green-800" : "text-gray-700"}`}>
                    {item.label}
                  </span>
                  {isChecked && (
                    <span className="shrink-0 text-xs font-semibold text-green-600 bg-green-100 rounded-full px-2 py-0.5">
                      Done
                    </span>
                  )}
                </div>
              )
            })}
          </div>
        </fieldset>
      )}

      {/* Message / Notes */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-gray-700">Message to customer</label>
        </div>
        <div className="flex flex-wrap gap-1.5 mb-2">
          {TEMPLATES.map((t) => (
            <button
              key={t.label}
              type="button"
              onClick={() => applyTemplate(t.body)}
              className="text-xs px-2.5 py-1 rounded-full border border-sky-200 bg-sky-50 text-sky-700 hover:bg-sky-100 transition-colors"
            >
              {t.label}
            </button>
          ))}
        </div>
        <textarea
          name="notes"
          rows={3}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Notes or message for the customer…"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-500 resize-none"
        />
      </div>

      {/* Chemicals Used */}
      <div className="rounded-xl border border-gray-200 overflow-hidden">
        <button
          type="button"
          onClick={() => setChemOpen((v) => !v)}
          className="w-full flex items-center justify-between px-4 py-3 text-left bg-white hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Beaker className="w-4 h-4 text-gray-400" />
            <span className="text-sm font-medium text-gray-700">Chemicals Used</span>
            {chemicalRows.length > 0 && (
              <span className="text-xs font-medium text-sky-700 bg-sky-50 border border-sky-200 rounded-full px-2 py-0.5">
                {chemicalRows.length} item{chemicalRows.length !== 1 ? "s" : ""}
              </span>
            )}
          </div>
          {chemOpen ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
        </button>

        {chemOpen && (
          <div className="border-t border-gray-100 px-4 pb-4 pt-3 space-y-3 bg-gray-50">
            {chemicalRows.length === 0 && (
              <p className="text-xs text-gray-400 text-center py-2">No chemicals added yet.</p>
            )}
            {chemicalRows.map((row, i) => {
              const qty  = parseFloat(row.quantity) || 0
              const cost = parseFloat(row.unitCost) || 0
              const total = qty * cost
              return (
                <div key={i} className="rounded-lg border border-gray-200 bg-white p-3 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <input
                      type="text"
                      placeholder="e.g. Chlorine tablets"
                      value={row.productName}
                      onChange={(e) => updateChemicalRow(i, "productName", e.target.value)}
                      className="flex-1 rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-500"
                    />
                    <button
                      type="button"
                      onClick={() => removeChemicalRow(i)}
                      className="shrink-0 text-gray-400 hover:text-red-500 transition-colors"
                      aria-label="Remove row"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Qty</label>
                      <input
                        type="number"
                        inputMode="decimal"
                        min="0"
                        step="0.01"
                        placeholder="0"
                        value={row.quantity}
                        onChange={(e) => updateChemicalRow(i, "quantity", e.target.value)}
                        className="w-full rounded-lg border border-gray-300 px-2.5 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Unit</label>
                      <select
                        value={row.unit}
                        onChange={(e) => updateChemicalRow(i, "unit", e.target.value)}
                        className="w-full rounded-lg border border-gray-300 px-2.5 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
                      >
                        {UNITS.map((u) => (
                          <option key={u} value={u}>{u}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Unit cost $</label>
                      <input
                        type="number"
                        inputMode="decimal"
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                        value={row.unitCost}
                        onChange={(e) => updateChemicalRow(i, "unitCost", e.target.value)}
                        className="w-full rounded-lg border border-gray-300 px-2.5 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
                      />
                    </div>
                  </div>
                  {cost > 0 && qty > 0 && (
                    <p className="text-xs text-gray-500 text-right">
                      Total: <span className="font-semibold text-gray-700">${total.toFixed(2)}</span>
                    </p>
                  )}
                </div>
              )
            })}
            <button
              type="button"
              onClick={addChemicalRow}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg border border-dashed border-sky-300 text-sm font-medium text-sky-600 hover:bg-sky-50 active:bg-sky-100 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Chemical
            </button>
          </div>
        )}
      </div>

      {/* Photos */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Photos</label>
        {previews.length > 0 && (
          <div className="grid grid-cols-3 gap-2 mb-2">
            {previews.map((src, i) => (
              <div key={i} className="relative rounded-lg overflow-hidden aspect-square bg-gray-100">
                <img src={src} alt="" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => removePhoto(i)}
                  className="absolute top-1 right-1 bg-black/60 rounded-full p-0.5 text-white hover:bg-red-600 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          multiple
          capture="environment"
          className="hidden"
          onChange={(e) => addPhotos(e.target.files)}
        />
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-dashed border-gray-300 text-sm font-medium text-gray-500 hover:border-sky-400 hover:text-sky-600 hover:bg-sky-50 active:bg-sky-100 transition-colors"
        >
          <Camera className="w-5 h-5" />
          {photos.length === 0 ? "Add photos" : `${photos.length} photo${photos.length !== 1 ? "s" : ""} · tap to add more`}
        </button>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {/* Submit — disabled until checklist complete */}
      {activeChecklist.length > 0 && !checklistComplete && (
        <p className="text-xs text-center text-amber-600">
          Check off all {activeChecklist.length} items above to submit
        </p>
      )}

      <Button
        type="submit"
        disabled={submitting || !checklistComplete}
        className="w-full"
      >
        {submitting ? (
          <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</>
        ) : done ? (
          <><CheckCircle2 className="w-4 h-4" /> Logged!</>
        ) : (
          "Log Visit"
        )}
      </Button>
    </form>
  )
}
