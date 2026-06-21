"use client"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { logVisit } from "@/lib/actions/routes"
import { getUploadUrl } from "@/lib/actions/attachments"
import Button from "@/components/ui/Button"
import { Camera, X, Loader2, CheckCircle2 } from "lucide-react"
import type { Customer, Route } from "@/app/generated/prisma/client"

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

export default function LogVisitForm({
  customers,
  routes,
}: {
  customers: Customer[]
  routes: Route[]
}) {
  const router = useRouter()
  const formRef = useRef<HTMLFormElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const [status, setStatus]       = useState("completed")
  const [notes, setNotes]         = useState("")
  const [photos, setPhotos]       = useState<File[]>([])
  const [previews, setPreviews]   = useState<string[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone]           = useState(false)
  const [error, setError]         = useState<string | null>(null)

  function applyTemplate(body: string) {
    setNotes(body)
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
    setSubmitting(true)
    setError(null)

    const formData = new FormData(e.currentTarget)

    // Upload photos to GCS, collect keys to include in visit data
    for (const file of photos) {
      try {
        const { url, key } = await getUploadUrl(file.name, file.type)
        const res = await fetch(url, { method: "PUT", body: file, headers: { "Content-Type": file.type } })
        if (res.ok) formData.append("attachmentKey", key)
      } catch {
        // skip failed uploads — visit still saves
      }
    }

    try {
      await logVisit(formData)
      setDone(true)
      setNotes("")
      setPhotos([])
      setPreviews([])
      setStatus("completed")
      formRef.current?.reset()
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
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-sky-500"
        >
          <option value="">Select customer…</option>
          {customers.map((c) => (
            <option key={c.id} value={c.id}>{c.firstName} {c.lastName}</option>
          ))}
        </select>
      </div>

      {/* Route */}
      {routes.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Route</label>
          <select
            name="routeId"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
          >
            <option value="">None</option>
            {routes.map((r) => (
              <option key={r.id} value={r.id}>{r.name}</option>
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
              className={`flex-1 py-2 px-3 rounded-lg border text-sm font-medium transition-all ${
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
        <legend className="text-sm font-medium text-gray-700 mb-2">Chemical Readings</legend>
        <div className="grid grid-cols-2 gap-3">
          {[
            { name: "chlorine",   label: "Chlorine",   step: "0.1", hint: "1.0–3.0 ppm" },
            { name: "ph",         label: "pH",         step: "0.1", hint: "7.2–7.8"     },
            { name: "alkalinity", label: "Alkalinity", step: "1",   hint: "80–120 ppm"  },
            { name: "calcium",    label: "Calcium",    step: "1",   hint: "200–400 ppm" },
          ].map((f) => (
            <div key={f.name}>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                {f.label} <span className="text-gray-400 font-normal">{f.hint}</span>
              </label>
              <input
                name={f.name}
                type="number"
                step={f.step}
                min="0"
                placeholder="—"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>
          ))}
        </div>
      </fieldset>

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
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-sky-600 transition-colors"
        >
          <Camera className="w-4 h-4" />
          {photos.length === 0 ? "Add photos" : `${photos.length} photo${photos.length !== 1 ? "s" : ""} — add more`}
        </button>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <Button type="submit" disabled={submitting} className="w-full">
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
