"use client"

import { useTransition, useState } from "react"
import { startRouteRun, completeRouteRun, addExtraStop, deleteExtraStop } from "@/lib/actions/routeRuns"
import { Play, CheckCircle2, Circle, Clock, Gauge, MapPin, Plus, X, Coffee, Fuel, ShoppingBag, MoreHorizontal } from "lucide-react"

const EXTRA_STOP_TYPES = [
  { value: "lunch",       label: "Lunch break",    icon: Coffee },
  { value: "fuel",        label: "Fuel stop",      icon: Fuel },
  { value: "supply_run",  label: "Supply run",     icon: ShoppingBag },
  { value: "other",       label: "Other",          icon: MoreHorizontal },
]

type Stop = { id: string; position: number; customer: { id: string; firstName: string; lastName: string; address: string; city: string } }
type ExtraStop = { id: string; type: string; label: string; notes: string | null; createdAt: Date }
type Run = {
  id: string
  startedAt: Date
  completedAt: Date | null
  odometerStart: number | null
  odometerEnd: number | null
  notes: string | null
  extraStops: ExtraStop[]
}
type Vehicle = { id: string; name: string; make: string | null; model: string | null; year: number | null }

interface Props {
  routeId: string
  stops: Stop[]
  activeRun: Run | null
  completedVisitCustomerIds: string[]
  vehicles: Vehicle[]
}

function fmt(mins: number) {
  if (mins < 60) return `${mins}m`
  return `${Math.floor(mins / 60)}h ${mins % 60}m`
}

function elapsed(from: Date) {
  return fmt(Math.floor((Date.now() - new Date(from).getTime()) / 60000))
}

function miles(run: Run) {
  if (run.odometerStart == null || run.odometerEnd == null) return null
  return (run.odometerEnd - run.odometerStart).toFixed(1)
}

export default function RouteRunPanel({ routeId, stops, activeRun, completedVisitCustomerIds, vehicles }: Props) {
  const [pending, startTransition] = useTransition()
  const [showExtraForm, setShowExtraForm] = useState(false)
  const [showCompleteForm, setShowCompleteForm] = useState(false)
  const [logFuel, setLogFuel] = useState(false)

  const doneCount = stops.filter((s) => completedVisitCustomerIds.includes(s.customer.id)).length
  const totalCount = stops.length
  const pct = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0

  // ── Not started ────────────────────────────────────────────────────────────
  if (!activeRun) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-5 space-y-4">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-gray-300" />
          <p className="text-sm font-semibold text-gray-500">Route not started</p>
        </div>

        <form action={(fd) => { startTransition(() => startRouteRun(fd)) }} className="space-y-3">
          <input type="hidden" name="routeId" value={routeId} />
          {vehicles.length > 0 && (
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Vehicle (optional)</label>
              <select name="vehicleId"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-sky-500">
                <option value="">No vehicle selected</option>
                {vehicles.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.year ? `${v.year} ` : ""}{v.make ? `${v.make} ` : ""}{v.name}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Starting odometer (optional)</label>
            <div className="flex items-center gap-2">
              <input
                name="odometerStart"
                type="number"
                step="0.1"
                min="0"
                placeholder="e.g. 42150"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
              <span className="text-xs text-gray-400 whitespace-nowrap">mi</span>
            </div>
          </div>
          <button
            type="submit"
            disabled={pending}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-sky-600 text-white text-sm font-bold hover:bg-sky-700 active:bg-sky-800 transition-colors disabled:opacity-50"
          >
            <Play className="w-4 h-4" />
            Start Route
          </button>
        </form>
      </div>
    )
  }

  // ── Completed ──────────────────────────────────────────────────────────────
  if (activeRun.completedAt) {
    const duration = fmt(Math.floor((new Date(activeRun.completedAt).getTime() - new Date(activeRun.startedAt).getTime()) / 60000))
    const mi = miles(activeRun)
    return (
      <div className="rounded-2xl border border-green-200 bg-green-50 p-5 space-y-3">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-green-600" />
          <p className="text-sm font-bold text-green-800">Route complete</p>
        </div>
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="bg-white rounded-xl p-3 border border-green-100">
            <p className="text-lg font-bold text-gray-900">{doneCount}/{totalCount}</p>
            <p className="text-xs text-gray-500 mt-0.5">Stops done</p>
          </div>
          <div className="bg-white rounded-xl p-3 border border-green-100">
            <p className="text-lg font-bold text-gray-900">{duration}</p>
            <p className="text-xs text-gray-500 mt-0.5">Duration</p>
          </div>
          <div className="bg-white rounded-xl p-3 border border-green-100">
            <p className="text-lg font-bold text-gray-900">{mi != null ? `${mi} mi` : "—"}</p>
            <p className="text-xs text-gray-500 mt-0.5">Driven</p>
          </div>
        </div>
        {activeRun.notes && (
          <p className="text-xs text-gray-600 bg-white rounded-lg px-3 py-2 border border-green-100">{activeRun.notes}</p>
        )}
      </div>
    )
  }

  // ── In progress ────────────────────────────────────────────────────────────
  return (
    <div className="rounded-2xl border border-sky-200 bg-sky-50 p-5 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-sky-500 animate-pulse" />
          <p className="text-sm font-bold text-sky-800">Route in progress</p>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-sky-600">
          <Clock className="w-3.5 h-3.5" />
          {elapsed(activeRun.startedAt)}
        </div>
      </div>

      {/* Progress bar */}
      <div className="space-y-2">
        <div className="flex justify-between text-xs font-semibold text-sky-800">
          <span>{doneCount} of {totalCount} stops done</span>
          <span>{pct}%</span>
        </div>
        <div className="h-3 rounded-full bg-sky-200 overflow-hidden">
          <div
            className="h-full rounded-full bg-sky-500 transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {/* Stop list */}
      <div className="space-y-1.5">
        {stops.map((stop, i) => {
          const done = completedVisitCustomerIds.includes(stop.customer.id)
          return (
            <div key={stop.id} className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-colors ${done ? "bg-white/60 text-gray-400 line-through" : "bg-white text-gray-800"}`}>
              {done
                ? <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                : <Circle className="w-4 h-4 text-gray-300 shrink-0" />
              }
              <span className="text-xs font-bold text-gray-400 w-4 shrink-0">{i + 1}</span>
              <div className="min-w-0 flex-1">
                <span className="font-medium">{stop.customer.firstName} {stop.customer.lastName}</span>
                <span className="text-xs text-gray-400 ml-2">{stop.customer.city}</span>
              </div>
            </div>
          )
        })}
      </div>

      {/* Extra stops already logged */}
      {activeRun.extraStops.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-xs font-semibold text-sky-700 uppercase tracking-wide">Extra stops</p>
          {activeRun.extraStops.map((es) => {
            const typeInfo = EXTRA_STOP_TYPES.find((t) => t.value === es.type)
            const Icon = typeInfo?.icon ?? MoreHorizontal
            const deleteAction = deleteExtraStop.bind(null, es.id, routeId)
            return (
              <div key={es.id} className="flex items-center gap-2 px-3 py-2 bg-white rounded-xl text-sm text-gray-700">
                <Icon className="w-4 h-4 text-gray-400 shrink-0" />
                <span className="flex-1 font-medium">{es.label}</span>
                {es.notes && <span className="text-xs text-gray-400 truncate max-w-[120px]">{es.notes}</span>}
                <form action={() => { startTransition(() => deleteAction()) }}>
                  <button type="submit" className="text-gray-300 hover:text-red-400 transition-colors">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </form>
              </div>
            )
          })}
        </div>
      )}

      {/* Add extra stop */}
      {showExtraForm ? (
        <form
          action={(fd) => {
            startTransition(() => addExtraStop(fd))
            setShowExtraForm(false)
          }}
          className="bg-white rounded-xl p-4 space-y-3 border border-sky-200"
        >
          <input type="hidden" name="runId" value={activeRun.id} />
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Stop type</label>
            <div className="grid grid-cols-2 gap-2">
              {EXTRA_STOP_TYPES.map(({ value, label, icon: Icon }) => (
                <label key={value} className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="type" value={value} defaultChecked={value === "lunch"} className="sr-only peer" />
                  <div className="flex items-center gap-2 w-full px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 peer-checked:border-sky-500 peer-checked:bg-sky-50 peer-checked:text-sky-700 transition-colors">
                    <Icon className="w-4 h-4 shrink-0" />
                    {label}
                  </div>
                </label>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Label</label>
            <input name="label" required placeholder="e.g. McDonald's on Camelback"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Notes (optional)</label>
            <input name="notes" placeholder="e.g. 30 min break"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500" />
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={pending}
              className="flex-1 py-2 rounded-lg bg-sky-600 text-white text-sm font-semibold hover:bg-sky-700 disabled:opacity-50">
              Add stop
            </button>
            <button type="button" onClick={() => setShowExtraForm(false)}
              className="px-4 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50">
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <button onClick={() => setShowExtraForm(true)}
          className="w-full flex items-center justify-center gap-2 py-2 rounded-xl border border-dashed border-sky-300 text-sky-600 text-sm font-medium hover:bg-white/60 transition-colors">
          <Plus className="w-4 h-4" />
          Add stop (lunch, fuel, etc.)
        </button>
      )}

      {/* Complete route */}
      {showCompleteForm ? (
        <form
          action={(fd) => {
            startTransition(() => completeRouteRun(fd))
            setShowCompleteForm(false)
          }}
          className="bg-white rounded-xl p-4 space-y-3 border border-green-200"
        >
          <input type="hidden" name="runId" value={activeRun.id} />
          <p className="text-sm font-semibold text-gray-800">Complete route</p>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Ending odometer (optional)</label>
            <div className="flex items-center gap-2">
              <input name="odometerEnd" type="number" step="0.1" min="0"
                placeholder={activeRun.odometerStart ? String(activeRun.odometerStart) : "e.g. 42287"}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500" />
              <span className="text-xs text-gray-400 whitespace-nowrap">mi</span>
            </div>
            {activeRun.odometerStart != null && (
              <p className="text-xs text-gray-400 mt-1">Start: {activeRun.odometerStart.toLocaleString()} mi</p>
            )}
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Notes (optional)</label>
            <textarea name="notes" rows={2} placeholder="Any notes about today's route…"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-sky-500" />
          </div>

          {/* Optional fuel expense */}
          <div className="border-t border-gray-100 pt-3 space-y-2">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input type="checkbox" checked={logFuel} onChange={(e) => setLogFuel(e.target.checked)}
                className="rounded border-gray-300 text-sky-600 focus:ring-sky-500" />
              <span className="text-xs font-medium text-gray-600 flex items-center gap-1.5">
                <Fuel className="w-3.5 h-3.5 text-amber-500" />
                Log a fuel expense
              </span>
            </label>
            {logFuel && (
              <div className="grid grid-cols-2 gap-2 pl-6">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Amount ($)</label>
                  <input name="fuelAmount" type="number" step="0.01" min="0" placeholder="e.g. 68.50"
                    className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Vendor (optional)</label>
                  <input name="fuelVendor" placeholder="e.g. Shell"
                    className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500" />
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <button type="submit" disabled={pending}
              className="flex-1 py-2.5 rounded-xl bg-green-600 text-white text-sm font-bold hover:bg-green-700 disabled:opacity-50">
              Complete route
            </button>
            <button type="button" onClick={() => setShowCompleteForm(false)}
              className="px-4 py-2 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50">
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <button onClick={() => setShowCompleteForm(true)}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-green-600 text-white text-sm font-bold hover:bg-green-700 active:bg-green-800 transition-colors">
          <Gauge className="w-4 h-4" />
          Complete Route
        </button>
      )}
    </div>
  )
}
