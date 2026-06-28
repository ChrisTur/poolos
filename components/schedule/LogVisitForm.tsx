"use client"

import { useState, useMemo, useRef } from "react"
import { useRouter } from "next/navigation"
import { logVisit } from "@/lib/actions/routes"
import { getUploadUrl } from "@/lib/actions/attachments"
import { runDosing } from "@/lib/chemistry"
import Button from "@/components/ui/Button"
import {
  X, Loader2, CheckCircle2,
  AlertTriangle, CheckSquare, Square, Layers,
} from "lucide-react"
import type { Customer, Route, VisitChecklistItem, JobTemplate, JobTemplateStep } from "@/app/generated/prisma/client"
import DosingPanel from "@/components/schedule/DosingPanel"
import ChemicalsUsedSection, {
  type ChemicalUsageRow,
  EMPTY_CHEMICAL_ROW,
} from "@/components/schedule/ChemicalsUsedSection"
import PhotoSection from "@/components/schedule/PhotoSection"

// ── Types ─────────────────────────────────────────────────────────────────────

type ChemFields = {
  chlorine: string; ph: string; alkalinity: string
  calcium: string; cya: string; salt: string
}

const EMPTY_CHEM: ChemFields = { chlorine: "", ph: "", alkalinity: "", calcium: "", cya: "", salt: "" }

const STATUSES = [
  { value: "completed", label: "Completed", color: "bg-green-100 text-green-700 border-green-300 ring-green-400" },
  { value: "skipped",   label: "Skipped",   color: "bg-gray-100  text-gray-600  border-gray-300  ring-gray-400"  },
  { value: "issue",     label: "Issue",     color: "bg-red-100   text-red-700   border-red-300   ring-red-400"   },
]

const NOTE_TEMPLATES = [
  { label: "All clear",        body: "Service completed. All chemical readings within normal range. Pool is clean." },
  { label: "Chemicals added",  body: "Service completed. Added chemicals to balance water. Please avoid swimming for 4 hours." },
  { label: "Filter cleaned",   body: "Service completed. Cleaned and backwashed filter. Emptied skimmer baskets, brushed walls and vacuumed." },
  { label: "No access",        body: "Unable to access pool today. Please ensure gate is unlocked for the next scheduled visit." },
]

const inputCls = "w-full rounded-lg border border-gray-300 px-3 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-500"

// ── Main form ─────────────────────────────────────────────────────────────────

type RouteWithAssignment = Route & { assignedUserId?: string | null }
type UserOption = { id: string; firstName: string; lastName: string }
type CustomerWithEquipment = Customer & { equipment?: { type: string }[] }
type TemplateWithSteps = JobTemplate & { steps: JobTemplateStep[] }

export default function LogVisitForm({
  customers,
  routes,
  checklistItems = [],
  users = [],
  jobTemplates = [],
}: {
  customers: CustomerWithEquipment[]
  routes: RouteWithAssignment[]
  checklistItems?: VisitChecklistItem[]
  users?: UserOption[]
  jobTemplates?: TemplateWithSteps[]
}) {
  const router  = useRouter()
  const formRef = useRef<HTMLFormElement>(null)

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
  const [chemOpen,        setChemOpen]        = useState(false)
  const [chemicalRows,    setChemicalRows]    = useState<ChemicalUsageRow[]>([])
  const [templateId,      setTemplateId]      = useState("")
  const [templateChecked, setTemplateChecked] = useState<Set<string>>(new Set())

  const selectedCustomer = customers.find((c) => c.id === customerId) ?? null
  const poolVolume = selectedCustomer?.poolSize ? parseFloat(selectedCustomer.poolSize) : null
  const hasSaltSystem = selectedCustomer?.equipment?.some((e) => e.type === "salt_system") ?? false
  const inferredSaltwater = hasSaltSystem || (selectedCustomer?.poolType?.toLowerCase().includes("salt") ?? false)

  function handleCustomerChange(id: string) {
    setCustomerId(id)
    const c = customers.find((x) => x.id === id)
    const saltEquipment = c?.equipment?.some((e) => e.type === "salt_system") ?? false
    if (saltEquipment || c?.poolType?.toLowerCase().includes("salt")) setSaltwater(true)
    else setSaltwater(false)
  }

  function handleRouteChange(routeId: string) {
    setSelectedRoute(routeId)
    if (routeId) {
      const route = routes.find((r) => r.id === routeId)
      if (route?.assignedUserId) setTechnicianId(route.assignedUserId)
    }
  }

  const dosingResults = useMemo(() => {
    const fc  = parseFloat(chem.chlorine)
    const ph  = parseFloat(chem.ph)
    const ta  = parseFloat(chem.alkalinity)
    const ch  = parseFloat(chem.calcium)
    const cya = parseFloat(chem.cya)
    const sl  = parseFloat(chem.salt)
    const entered = [fc, ph, ta, ch, cya].filter((v) => !isNaN(v) && v > 0)
    if (entered.length < 2) return null
    return runDosing({
      volume:   poolVolume && !isNaN(poolVolume) ? poolVolume : 15000,
      fc:       isNaN(fc)  ? 0 : fc,
      ph:       isNaN(ph)  ? 0 : ph,
      ta:       isNaN(ta)  ? 0 : ta,
      ch:       isNaN(ch)  ? 0 : ch,
      cya:      isNaN(cya) ? 0 : cya,
      salt:     isNaN(sl)  ? 0 : sl,
      saltwater,
    })
  }, [chem, saltwater, poolVolume])

  const activeChecklist = status === "completed"
    ? checklistItems.filter((item) => !item.customerId || item.customerId === customerId)
    : []
  const checklistComplete = activeChecklist.every((item) => checked.has(item.id))

  const selectedTemplate = jobTemplates.find((t) => t.id === templateId) ?? null
  const templateStepsComplete = !selectedTemplate || selectedTemplate.steps.every((s) => templateChecked.has(s.id))
  const allComplete = checklistComplete && templateStepsComplete

  function selectJobTemplate(id: string) {
    setTemplateId(id)
    setTemplateChecked(new Set())
    const t = jobTemplates.find((tmpl) => tmpl.id === id)
    if (t?.defaultNotes && !notes.trim()) setNotes(t.defaultNotes)
  }

  function toggleCheck(id: string) {
    setChecked((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function toggleTemplateCheck(id: string) {
    setTemplateChecked((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function addPhotos(files: File[]) {
    setPhotos((p) => [...p, ...files])
    setPreviews((p) => [...p, ...files.map((f) => URL.createObjectURL(f))])
  }

  function removePhoto(i: number) {
    URL.revokeObjectURL(previews[i])
    setPhotos((p) => p.filter((_, idx) => idx !== i))
    setPreviews((p) => p.filter((_, idx) => idx !== i))
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

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!allComplete) return
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
      setTemplateId("")
      setTemplateChecked(new Set())
      setChemicalRows([])
      setChemOpen(false)
      formRef.current?.reset()
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

      {/* Job type / template picker */}
      {jobTemplates.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Job type</label>
          {selectedTemplate ? (
            <div className="flex items-center gap-2 rounded-lg border border-sky-300 bg-sky-50 px-3 py-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-sky-900">{selectedTemplate.name}</p>
                {selectedTemplate.description && (
                  <p className="text-xs text-sky-600 mt-0.5">{selectedTemplate.description}</p>
                )}
                {selectedTemplate.estimatedMinutes && (
                  <p className="text-xs text-sky-500 mt-0.5">~{selectedTemplate.estimatedMinutes} min</p>
                )}
              </div>
              <button
                type="button"
                onClick={() => { setTemplateId(""); setTemplateChecked(new Set()) }}
                className="shrink-0 text-sky-400 hover:text-sky-700 transition-colors"
                aria-label="Clear template"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {jobTemplates.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => selectJobTemplate(t.id)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm text-gray-700 hover:border-sky-400 hover:bg-sky-50 hover:text-sky-700 active:bg-sky-100 transition-colors"
                >
                  <Layers className="w-3.5 h-3.5 text-gray-400" />
                  {t.name}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

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

      {/* Status */}
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
            { name: "chlorine",   label: "Free Chlorine",    step: "0.1", hint: "1–3 ppm"       },
            { name: "ph",         label: "pH",               step: "0.1", hint: "7.2–7.6"       },
            { name: "alkalinity", label: "Total Alk.",       step: "1",   hint: "80–120 ppm"    },
            { name: "calcium",    label: "Calcium Hard.",    step: "1",   hint: "200–400 ppm"   },
            { name: "cya",        label: "CYA / Stabilizer", step: "1",   hint: "30–50 ppm"     },
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

      {dosingResults && <DosingPanel results={dosingResults} />}

      {/* Pre-completion checklist */}
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
                    {isChecked ? <CheckSquare className="w-6 h-6" /> : <Square className="w-6 h-6" />}
                  </div>
                  <span className={`text-sm font-medium flex-1 leading-snug ${isChecked ? "text-green-800" : "text-gray-700"}`}>
                    {item.label}
                  </span>
                  {isChecked && (
                    <span className="shrink-0 text-xs font-semibold text-green-600 bg-green-100 rounded-full px-2 py-0.5">Done</span>
                  )}
                </div>
              )
            })}
          </div>
        </fieldset>
      )}

      {/* Template job steps */}
      {selectedTemplate && selectedTemplate.steps.length > 0 && (
        <fieldset className="space-y-2">
          <legend className="text-sm font-medium text-gray-700 flex items-center gap-2">
            <Layers className="w-4 h-4 text-sky-500" />
            {selectedTemplate.name} steps
            {!templateStepsComplete && (
              <span className="text-xs font-normal text-amber-600 flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" />
                Required before submitting
              </span>
            )}
          </legend>
          <div className="rounded-xl border border-sky-200 divide-y divide-sky-100 overflow-hidden">
            {selectedTemplate.steps.map((step) => {
              const isChecked = templateChecked.has(step.id)
              return (
                <div
                  key={step.id}
                  role="checkbox"
                  aria-checked={isChecked}
                  tabIndex={0}
                  onClick={() => toggleTemplateCheck(step.id)}
                  onKeyDown={(e) => (e.key === " " || e.key === "Enter") && toggleTemplateCheck(step.id)}
                  className={`flex items-center gap-3 px-4 py-4 cursor-pointer select-none transition-colors active:opacity-70 ${
                    isChecked ? "bg-sky-50" : "bg-white hover:bg-gray-50 active:bg-gray-100"
                  }`}
                >
                  <div className={`shrink-0 transition-colors ${isChecked ? "text-sky-500" : "text-gray-300"}`}>
                    {isChecked ? <CheckSquare className="w-6 h-6" /> : <Square className="w-6 h-6" />}
                  </div>
                  <span className={`text-sm font-medium flex-1 leading-snug ${isChecked ? "text-sky-800" : "text-gray-700"}`}>
                    {step.label}
                  </span>
                  {isChecked && (
                    <span className="shrink-0 text-xs font-semibold text-sky-600 bg-sky-100 rounded-full px-2 py-0.5">Done</span>
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
          {NOTE_TEMPLATES.map((t) => (
            <button
              key={t.label}
              type="button"
              onClick={() => setNotes(t.body)}
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

      <ChemicalsUsedSection
        rows={chemicalRows}
        open={chemOpen}
        onToggle={() => setChemOpen((v) => !v)}
        onAdd={() => { setChemicalRows((prev) => [...prev, { ...EMPTY_CHEMICAL_ROW }]); setChemOpen(true) }}
        onRemove={(i) => setChemicalRows((prev) => prev.filter((_, idx) => idx !== i))}
        onUpdate={(i, field, value) => setChemicalRows((prev) => prev.map((row, idx) => idx === i ? { ...row, [field]: value } : row))}
      />

      <PhotoSection
        photos={photos}
        previews={previews}
        onAdd={addPhotos}
        onRemove={removePhoto}
      />

      {error && <p className="text-sm text-red-600">{error}</p>}

      {!allComplete && (activeChecklist.length > 0 || (selectedTemplate && selectedTemplate.steps.length > 0)) && (
        <p className="text-xs text-center text-amber-600">
          {!checklistComplete && !templateStepsComplete
            ? "Complete the checklist and job steps above to submit"
            : !checklistComplete
            ? `Check off all ${activeChecklist.length} checklist items to submit`
            : "Complete all job steps above to submit"}
        </p>
      )}

      <Button
        type="submit"
        disabled={submitting || !allComplete}
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
