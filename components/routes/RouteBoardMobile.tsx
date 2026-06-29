"use client"

import { useState } from "react"
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  closestCenter,
  type DragStartEvent,
  type DragEndEvent,
} from "@dnd-kit/core"
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import {
  GripVertical, MapPin, ChevronDown, ChevronUp, KeyRound,
  Inbox, ArrowRightLeft, Plus, Check,
} from "lucide-react"
import { moveStopToRoute } from "@/lib/actions/routes"
import type { Route, RouteStop, Customer } from "@/app/generated/prisma/client"

type StopWithCustomer = RouteStop & { customer: Customer }
type RouteWithStops   = Route & { stops: StopWithCustomer[] }

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

// ── Draggable stop row ────────────────────────────────────────────────────────

function SortableStop({
  stop,
  index,
  routes,
  currentRouteId,
  overlay = false,
}: {
  stop: StopWithCustomer
  index: number
  routes: RouteWithStops[]
  currentRouteId: string
  overlay?: boolean
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: stop.id })

  const [moving, setMoving] = useState(false)
  const [showPicker, setShowPicker] = useState(false)
  const [saving, setSaving] = useState(false)

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.35 : 1,
  }

  const otherRoutes = routes.filter((r) => r.id !== currentRouteId)

  async function handleMove(toRouteId: string | null) {
    setShowPicker(false)
    setSaving(true)
    try {
      await moveStopToRoute({
        stopId: stop.id,
        fromRouteId: currentRouteId,
        toRouteId,
        toPosition: toRouteId
          ? (routes.find((r) => r.id === toRouteId)?.stops.length ?? 0)
          : 0,
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      ref={overlay ? undefined : setNodeRef}
      style={overlay ? {} : style}
      className={`relative flex items-center gap-2 rounded-xl border px-3 py-3 text-sm bg-white ${
        overlay
          ? "border-sky-400 shadow-xl ring-2 ring-sky-300"
          : isDragging
          ? "border-dashed border-sky-300"
          : "border-gray-200"
      }`}
    >
      {/* Drag handle */}
      <div
        {...(overlay ? {} : { ...attributes, ...listeners })}
        className="shrink-0 cursor-grab active:cursor-grabbing text-gray-300 touch-none py-1 pr-1 -ml-1"
      >
        <GripVertical className="w-4 h-4" />
      </div>

      {/* Stop number */}
      <span className="w-6 h-6 rounded-full bg-sky-100 text-sky-700 text-[11px] font-bold flex items-center justify-center shrink-0">
        {index + 1}
      </span>

      {/* Customer info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <p className="font-semibold text-gray-900 truncate text-sm">
            {stop.customer.firstName} {stop.customer.lastName}
          </p>
          {stop.customer.accessNotes && (
            <KeyRound className="w-3.5 h-3.5 text-amber-500 shrink-0" />
          )}
        </div>
        {stop.customer.address && (
          <p className="text-xs text-gray-400 truncate flex items-center gap-1 mt-0.5">
            <MapPin className="w-2.5 h-2.5 shrink-0" />
            {stop.customer.address}{stop.customer.city ? `, ${stop.customer.city}` : ""}
          </p>
        )}
        {stop.customer.accessNotes && (
          <p className="text-xs text-amber-700 truncate mt-0.5">{stop.customer.accessNotes}</p>
        )}
      </div>

      {/* Move button */}
      {!overlay && (
        <div className="relative shrink-0">
          <button
            type="button"
            onClick={() => setShowPicker((v) => !v)}
            disabled={saving}
            className="p-2 rounded-lg text-gray-400 hover:text-sky-600 hover:bg-sky-50 active:bg-sky-100 transition-colors"
            aria-label="Move to another route"
          >
            {saving ? (
              <span className="w-4 h-4 border-2 border-sky-400 border-t-transparent rounded-full animate-spin block" />
            ) : (
              <ArrowRightLeft className="w-4 h-4" />
            )}
          </button>

          {showPicker && (
            <div className="absolute right-0 top-full mt-1 z-20 bg-white rounded-xl shadow-lg border border-gray-200 py-1 min-w-[180px]">
              <p className="px-3 py-1.5 text-[11px] font-semibold text-gray-400 uppercase tracking-wide">
                Move to…
              </p>
              {otherRoutes.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => handleMove(r.id)}
                  className="w-full text-left px-3 py-2.5 text-sm text-gray-700 hover:bg-sky-50 hover:text-sky-700 transition-colors"
                >
                  {r.name}
                  {r.dayOfWeek != null && (
                    <span className="text-xs text-gray-400 ml-1">({DAY_NAMES[r.dayOfWeek]})</span>
                  )}
                </button>
              ))}
              <div className="border-t border-gray-100 mt-1 pt-1">
                <button
                  type="button"
                  onClick={() => handleMove(null)}
                  className="w-full text-left px-3 py-2.5 text-sm text-amber-600 hover:bg-amber-50 transition-colors"
                >
                  Remove from route
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Route section ─────────────────────────────────────────────────────────────

function RouteSection({
  route,
  allRoutes,
  defaultOpen = true,
}: {
  route: RouteWithStops
  allRoutes: RouteWithStops[]
  defaultOpen?: boolean
}) {
  const [open, setOpen]   = useState(defaultOpen)
  const [stops, setStops] = useState(route.stops)
  const [activeStop, setActiveStop] = useState<StopWithCustomer | null>(null)
  const [saving, setSaving] = useState(false)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor,   { activationConstraint: { delay: 250, tolerance: 8 } })
  )

  function handleDragStart(event: DragStartEvent) {
    const found = stops.find((s) => s.id === event.active.id)
    if (found) setActiveStop(found)
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    setActiveStop(null)
    if (!over || active.id === over.id) return

    const oldIndex = stops.findIndex((s) => s.id === active.id)
    const newIndex = stops.findIndex((s) => s.id === over.id)
    if (oldIndex === -1 || newIndex === -1) return

    const reordered = arrayMove(stops, oldIndex, newIndex)
    setStops(reordered)

    setSaving(true)
    try {
      await moveStopToRoute({
        stopId: String(active.id),
        toRouteId: route.id,
        toPosition: newIndex,
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="rounded-xl border border-gray-200 overflow-hidden">
      {/* Section header */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3.5 bg-white hover:bg-gray-50 active:bg-gray-100 transition-colors text-left"
      >
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-semibold text-gray-900 truncate">{route.name}</p>
            {saving && (
              <span className="w-3.5 h-3.5 border-2 border-sky-400 border-t-transparent rounded-full animate-spin shrink-0" />
            )}
          </div>
          <p className="text-xs text-gray-400 mt-0.5">
            {route.dayOfWeek != null ? DAY_NAMES[route.dayOfWeek] : "No day"} · {stops.length} stop{stops.length !== 1 ? "s" : ""}
          </p>
        </div>
        {open
          ? <ChevronUp className="w-4 h-4 text-gray-400 shrink-0" />
          : <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />
        }
      </button>

      {/* Stop list */}
      {open && (
        <div className="border-t border-gray-100 bg-gray-50 p-3 space-y-2">
          {stops.length === 0 && (
            <p className="text-xs text-gray-400 text-center py-4">No stops on this route.</p>
          )}
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <SortableContext items={stops.map((s) => s.id)} strategy={verticalListSortingStrategy}>
              {stops.map((stop, i) => (
                <SortableStop
                  key={stop.id}
                  stop={stop}
                  index={i}
                  routes={allRoutes}
                  currentRouteId={route.id}
                />
              ))}
            </SortableContext>
            <DragOverlay>
              {activeStop && (
                <SortableStop
                  stop={activeStop}
                  index={stops.findIndex((s) => s.id === activeStop.id)}
                  routes={allRoutes}
                  currentRouteId={route.id}
                  overlay
                />
              )}
            </DragOverlay>
          </DndContext>
        </div>
      )}
    </div>
  )
}

// ── Unscheduled queue ─────────────────────────────────────────────────────────

function UnscheduledSection({
  customers,
  routes,
}: {
  customers: Customer[]
  routes: RouteWithStops[]
}) {
  const [open, setOpen] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)

  async function handleAdd(customerId: string, routeId: string) {
    setSaving(customerId)
    try {
      const route = routes.find((r) => r.id === routeId)
      await moveStopToRoute({
        customerId,
        toRouteId: routeId,
        toPosition: route?.stops.length ?? 0,
      })
    } finally {
      setSaving(null)
    }
  }

  if (customers.length === 0) return null

  return (
    <div className="rounded-xl border-2 border-amber-200 overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3.5 bg-amber-50 hover:bg-amber-100 active:bg-amber-100 transition-colors text-left"
      >
        <div className="flex items-center gap-2">
          <Inbox className="w-4 h-4 text-amber-500 shrink-0" />
          <p className="font-semibold text-amber-800">Unscheduled</p>
          <span className="text-xs font-semibold text-amber-600 bg-amber-200 rounded-full px-2 py-0.5">
            {customers.length}
          </span>
        </div>
        {open
          ? <ChevronUp className="w-4 h-4 text-amber-400 shrink-0" />
          : <ChevronDown className="w-4 h-4 text-amber-400 shrink-0" />
        }
      </button>

      {open && (
        <div className="border-t border-amber-200 bg-amber-50/50 p-3 space-y-2">
          {customers.map((c) => (
            <div
              key={c.id}
              className="flex items-center gap-3 bg-white rounded-xl border border-amber-200 px-3 py-3"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="font-semibold text-gray-900 text-sm truncate">
                    {c.firstName} {c.lastName}
                  </p>
                  {c.accessNotes && (
                    <KeyRound className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  )}
                </div>
                {c.address && (
                  <p className="text-xs text-gray-400 truncate mt-0.5 flex items-center gap-1">
                    <MapPin className="w-2.5 h-2.5 shrink-0" />
                    {c.address}{c.city ? `, ${c.city}` : ""}
                  </p>
                )}
                {c.accessNotes && (
                  <p className="text-xs text-amber-700 truncate mt-0.5">{c.accessNotes}</p>
                )}
              </div>

              {routes.length > 0 && (
                <div className="shrink-0 flex items-center gap-1">
                  {saving === c.id ? (
                    <span className="w-4 h-4 border-2 border-sky-400 border-t-transparent rounded-full animate-spin block" />
                  ) : (
                    <select
                      defaultValue=""
                      onChange={(e) => {
                        if (e.target.value) handleAdd(c.id, e.target.value)
                        e.target.value = ""
                      }}
                      className="text-xs rounded-lg border border-gray-300 px-2 py-2 text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 cursor-pointer"
                    >
                      <option value="" disabled>Add to route…</option>
                      {routes.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.name}{r.dayOfWeek != null ? ` (${DAY_NAMES[r.dayOfWeek]})` : ""}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Main mobile board ─────────────────────────────────────────────────────────

export default function RouteBoardMobile({
  routes,
  unscheduledCustomers,
}: {
  routes: RouteWithStops[]
  unscheduledCustomers: Customer[]
}) {
  const sortedRoutes = [...routes].sort((a, b) => {
    if (a.dayOfWeek == null && b.dayOfWeek == null) return 0
    if (a.dayOfWeek == null) return 1
    if (b.dayOfWeek == null) return -1
    return a.dayOfWeek - b.dayOfWeek
  })

  return (
    <div className="space-y-3">
      <UnscheduledSection customers={unscheduledCustomers} routes={sortedRoutes} />
      {sortedRoutes.map((route, i) => (
        <RouteSection
          key={route.id}
          route={route}
          allRoutes={sortedRoutes}
          defaultOpen={i === 0}
        />
      ))}
      <p className="text-xs text-gray-400 text-center pt-1">
        Hold and drag stops to reorder · tap <ArrowRightLeft className="w-3 h-3 inline" /> to move between routes
      </p>
    </div>
  )
}
