"use client"

import { useState, useCallback } from "react"
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  closestCorners,
  type DragStartEvent,
  type DragOverEvent,
  type DragEndEvent,
} from "@dnd-kit/core"
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { useDroppable } from "@dnd-kit/core"
import { CSS } from "@dnd-kit/utilities"
import { GripVertical, MapPin, User, Inbox } from "lucide-react"
import { moveStopToRoute } from "@/lib/actions/routes"
import type { Route, RouteStop, Customer } from "@/app/generated/prisma/client"

// ── Types ─────────────────────────────────────────────────────────────────────

type StopWithCustomer = RouteStop & { customer: Customer }
type RouteWithStops = Route & { stops: StopWithCustomer[] }

type BoardItem =
  | { kind: "stop"; stop: StopWithCustomer; routeId: string }
  | { kind: "customer"; customer: Customer }

function itemId(item: BoardItem) {
  return item.kind === "stop" ? `stop-${item.stop.id}` : `cust-${item.customer.id}`
}

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]

// ── Draggable stop card ───────────────────────────────────────────────────────

function StopCard({
  item,
  index,
  overlay = false,
}: {
  item: BoardItem
  index: number
  overlay?: boolean
}) {
  const id = itemId(item)
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  }

  const customer = item.kind === "stop" ? item.stop.customer : (item as { kind: "customer"; customer: Customer }).customer
  const address = customer.address ? `${customer.address}, ${customer.city ?? ""}` : null

  return (
    <div
      ref={overlay ? undefined : setNodeRef}
      style={overlay ? {} : style}
      className={`flex items-center gap-2 bg-white rounded-lg border px-3 py-2.5 text-sm ${
        overlay
          ? "border-sky-400 shadow-lg ring-2 ring-sky-300"
          : isDragging
          ? "border-dashed border-sky-300 bg-sky-50"
          : "border-gray-200 hover:border-gray-300"
      }`}
    >
      <div
        {...(overlay ? {} : { ...attributes, ...listeners })}
        className="shrink-0 cursor-grab active:cursor-grabbing text-gray-300 hover:text-gray-400 touch-none"
      >
        <GripVertical className="w-4 h-4" />
      </div>
      {item.kind === "stop" && (
        <span className="w-5 h-5 rounded-full bg-sky-100 text-sky-700 text-[10px] font-bold flex items-center justify-center shrink-0">
          {index + 1}
        </span>
      )}
      {item.kind === "customer" && (
        <User className="w-4 h-4 text-gray-300 shrink-0" />
      )}
      <div className="min-w-0 flex-1">
        <p className="font-medium text-gray-900 truncate text-xs">
          {customer.firstName} {customer.lastName}
        </p>
        {address && (
          <p className="text-[11px] text-gray-400 truncate flex items-center gap-1 mt-0.5">
            <MapPin className="w-2.5 h-2.5 shrink-0" />
            {address}
          </p>
        )}
      </div>
    </div>
  )
}

// ── Droppable route column ────────────────────────────────────────────────────

function RouteColumn({
  route,
  items,
}: {
  route: RouteWithStops
  items: BoardItem[]
}) {
  const { setNodeRef, isOver } = useDroppable({ id: `route-${route.id}` })

  const ids = items.map(itemId)

  return (
    <div className="flex flex-col min-w-[220px] max-w-[260px] flex-shrink-0">
      {/* Column header */}
      <div className="mb-2 px-1">
        <p className="text-xs font-bold text-gray-700 truncate">{route.name}</p>
        <p className="text-[11px] text-gray-400">
          {route.dayOfWeek != null ? DAY_NAMES[route.dayOfWeek] : "Unscheduled"} · {items.length} stops
        </p>
      </div>

      {/* Drop zone */}
      <div
        ref={setNodeRef}
        className={`flex-1 rounded-xl border-2 p-2 space-y-1.5 min-h-[120px] transition-colors ${
          isOver
            ? "border-sky-400 bg-sky-50"
            : "border-gray-200 bg-gray-50"
        }`}
      >
        <SortableContext items={ids} strategy={verticalListSortingStrategy}>
          {items.length === 0 && (
            <p className="text-[11px] text-gray-400 text-center py-6 select-none">Drop stops here</p>
          )}
          {items.map((item, i) => (
            <StopCard key={itemId(item)} item={item} index={i} />
          ))}
        </SortableContext>
      </div>
    </div>
  )
}

// ── Unscheduled queue ─────────────────────────────────────────────────────────

function UnscheduledQueue({ customers }: { customers: Customer[] }) {
  const { setNodeRef, isOver } = useDroppable({ id: "unscheduled" })

  const items: BoardItem[] = customers.map((c) => ({ kind: "customer", customer: c }))
  const ids = items.map(itemId)

  return (
    <div className="flex flex-col min-w-[220px] max-w-[260px] flex-shrink-0">
      <div className="mb-2 px-1 flex items-center gap-1.5">
        <Inbox className="w-3.5 h-3.5 text-amber-500" />
        <p className="text-xs font-bold text-amber-700">Unscheduled</p>
        {customers.length > 0 && (
          <span className="text-[10px] font-semibold text-amber-600 bg-amber-100 rounded-full px-1.5 py-0.5">
            {customers.length}
          </span>
        )}
      </div>

      <div
        ref={setNodeRef}
        className={`flex-1 rounded-xl border-2 p-2 space-y-1.5 min-h-[120px] transition-colors ${
          isOver
            ? "border-amber-400 bg-amber-50"
            : "border-amber-200 bg-amber-50/50"
        }`}
      >
        <SortableContext items={ids} strategy={verticalListSortingStrategy}>
          {customers.length === 0 && (
            <p className="text-[11px] text-gray-400 text-center py-6 select-none">All customers scheduled</p>
          )}
          {items.map((item) => (
            <StopCard key={itemId(item)} item={item} index={0} />
          ))}
        </SortableContext>
      </div>
    </div>
  )
}

// ── Main board ────────────────────────────────────────────────────────────────

export default function RouteBoard({
  routes: initialRoutes,
  unscheduledCustomers: initialUnscheduled,
}: {
  routes: RouteWithStops[]
  unscheduledCustomers: Customer[]
}) {
  // Local state for optimistic updates
  const [routes, setRoutes] = useState(initialRoutes)
  const [unscheduled, setUnscheduled] = useState(initialUnscheduled)
  const [activeItem, setActiveItem] = useState<BoardItem | null>(null)
  const [saving, setSaving] = useState(false)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor,   { activationConstraint: { delay: 250, tolerance: 8 } })
  )

  // Build a flat map: itemId → { item, routeId | "unscheduled" }
  function findContainer(id: string): string | null {
    for (const route of routes) {
      if (route.stops.some((s) => `stop-${s.id}` === id)) return route.id
    }
    if (unscheduled.some((c) => `cust-${c.id}` === id)) return "unscheduled"
    // Also check container IDs directly
    if (id === "unscheduled") return "unscheduled"
    for (const route of routes) {
      if (id === `route-${route.id}`) return route.id
    }
    return null
  }

  function handleDragStart(event: DragStartEvent) {
    const id = String(event.active.id)
    for (const route of routes) {
      const stop = route.stops.find((s) => `stop-${s.id}` === id)
      if (stop) { setActiveItem({ kind: "stop", stop, routeId: route.id }); return }
    }
    const cust = unscheduled.find((c) => `cust-${c.id}` === id)
    if (cust) setActiveItem({ kind: "customer", customer: cust })
  }

  function handleDragOver(event: DragOverEvent) {
    const { active, over } = event
    if (!over) return

    const activeId = String(active.id)
    const overId   = String(over.id)

    const activeContainer = findContainer(activeId)
    let   overContainer   = findContainer(overId)
    // If dropped onto a route-X container directly
    if (!overContainer && overId.startsWith("route-")) overContainer = overId.replace("route-", "")

    if (!activeContainer || !overContainer || activeContainer === overContainer) return

    setRoutes((prev) => {
      const next = prev.map((r) => ({ ...r, stops: [...r.stops] }))

      if (activeContainer === "unscheduled") {
        // Moving from unscheduled into a route
        const cust = unscheduled.find((c) => `cust-${c.id}` === activeId)
        if (!cust) return prev

        const destRoute = next.find((r) => r.id === overContainer)
        if (!destRoute) return prev

        const overIndex = destRoute.stops.findIndex((s) => `stop-${s.id}` === overId)
        const insertAt  = overIndex >= 0 ? overIndex : destRoute.stops.length

        // Fake stop for optimistic UI
        const fakeStop: StopWithCustomer = {
          id:         `new-${cust.id}`,
          position:   insertAt,
          notes:      null,
          routeId:    destRoute.id,
          customerId: cust.id,
          customer:   cust,
        }
        destRoute.stops.splice(insertAt, 0, fakeStop)
        setUnscheduled((u) => u.filter((c) => c.id !== cust.id))

      } else if (overContainer === "unscheduled") {
        // Moving from route to unscheduled
        const srcRoute = next.find((r) => r.id === activeContainer)
        if (!srcRoute) return prev
        const stop = srcRoute.stops.find((s) => `stop-${s.id}` === activeId)
        if (!stop) return prev
        srcRoute.stops = srcRoute.stops.filter((s) => `stop-${s.id}` !== activeId)
        setUnscheduled((u) => [...u, stop.customer])

      } else {
        // Route → route
        const srcRoute  = next.find((r) => r.id === activeContainer)
        const destRoute = next.find((r) => r.id === overContainer)
        if (!srcRoute || !destRoute) return prev

        const stop = srcRoute.stops.find((s) => `stop-${s.id}` === activeId)
        if (!stop) return prev

        srcRoute.stops  = srcRoute.stops.filter((s) => `stop-${s.id}` !== activeId)
        const overIndex = destRoute.stops.findIndex((s) => `stop-${s.id}` === overId)
        const insertAt  = overIndex >= 0 ? overIndex : destRoute.stops.length
        destRoute.stops.splice(insertAt, 0, { ...stop, routeId: destRoute.id })
      }
      return next
    })
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    setActiveItem(null)
    if (!over) return

    const activeId = String(active.id)
    const overId   = String(over.id)

    const activeContainer = findContainer(activeId) // use pre-drag container from active.data if needed
    let   overContainer   = findContainer(overId)
    if (!overContainer && overId.startsWith("route-")) overContainer = overId.replace("route-", "")
    if (!overContainer && overId === "unscheduled")    overContainer = "unscheduled"

    // Determine toRouteId and toPosition from current (optimistic) state
    let toRouteId: string | null = overContainer === "unscheduled" ? null : (overContainer ?? null)
    if (toRouteId?.startsWith("route-")) toRouteId = toRouteId.replace("route-", "")

    let toPosition = 0
    if (toRouteId) {
      const destRoute = routes.find((r) => r.id === toRouteId)
      if (destRoute) {
        const idx = destRoute.stops.findIndex((s) => `stop-${s.id}` === activeId || s.id === `new-${activeItem?.kind === "customer" ? (activeItem as { kind: "customer"; customer: Customer }).customer.id : ""}`)
        toPosition = idx >= 0 ? idx : destRoute.stops.length
      }
    }

    setSaving(true)
    try {
      if (activeId.startsWith("stop-")) {
        const stopId = activeId.replace("stop-", "")
        await moveStopToRoute({ stopId, toRouteId, toPosition })
      } else if (activeId.startsWith("cust-") && toRouteId) {
        const custId = activeId.replace("cust-", "")
        await moveStopToRoute({ customerId: custId, toRouteId, toPosition })
      }
    } finally {
      setSaving(false)
    }
  }

  // Sort routes: by day of week, nulls last
  const sortedRoutes = [...routes].sort((a, b) => {
    if (a.dayOfWeek == null && b.dayOfWeek == null) return 0
    if (a.dayOfWeek == null) return 1
    if (b.dayOfWeek == null) return -1
    return a.dayOfWeek - b.dayOfWeek
  })

  return (
    <div className="relative">
      {saving && (
        <div className="absolute top-0 right-0 z-10 text-xs text-sky-600 font-medium bg-white/80 px-2 py-1 rounded-lg">
          Saving…
        </div>
      )}

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-4 overflow-x-auto pb-4">
          {/* Unscheduled queue — always first */}
          <UnscheduledQueue customers={unscheduled} />

          {/* Divider */}
          <div className="w-px bg-gray-200 flex-shrink-0 self-stretch" />

          {/* Route columns */}
          {sortedRoutes.map((route) => {
            const items: BoardItem[] = route.stops.map((stop) => ({
              kind: "stop",
              stop,
              routeId: route.id,
            }))
            return <RouteColumn key={route.id} route={route} items={items} />
          })}
        </div>

        <DragOverlay>
          {activeItem && (
            <StopCard item={activeItem} index={0} overlay />
          )}
        </DragOverlay>
      </DndContext>

      <p className="text-xs text-gray-400 mt-3">
        Drag stops between columns to reassign routes. Drag to <strong>Unscheduled</strong> to remove from all routes.
      </p>
    </div>
  )
}
