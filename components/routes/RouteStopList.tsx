"use client"

import { useState } from "react"
import { GripVertical, Trash2, MapPin } from "lucide-react"
import { removeStopFromRoute, reorderStops } from "@/lib/actions/routes"
import type { RouteStop, Customer } from "@/app/generated/prisma/client"
import Button from "@/components/ui/Button"

type StopWithCustomer = RouteStop & { customer: Customer }

export default function RouteStopList({
  stops,
  routeId,
}: {
  stops: StopWithCustomer[]
  routeId: string
}) {
  const [items, setItems] = useState(stops)
  const [dragging, setDragging] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)

  const handleDragStart = (index: number) => setDragging(index)

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    if (dragging === null || dragging === index) return
    const next = [...items]
    const [moved] = next.splice(dragging, 1)
    next.splice(index, 0, moved)
    setItems(next)
    setDragging(index)
  }

  const handleDrop = async () => {
    if (dragging === null) return
    setDragging(null)
    setSaving(true)
    await reorderStops(routeId, items.map((s) => s.id))
    setSaving(false)
  }

  const handleRemove = async (stopId: string) => {
    setItems((prev) => prev.filter((s) => s.id !== stopId))
    await removeStopFromRoute(stopId, routeId)
  }

  return (
    <div className="space-y-1">
      {saving && <p className="text-xs text-sky-600 px-1">Saving order…</p>}
      {items.length === 0 && (
        <p className="text-sm text-gray-400 py-4 text-center">No stops yet. Add customers below.</p>
      )}
      {items.map((stop, index) => (
        <div
          key={stop.id}
          draggable
          onDragStart={() => handleDragStart(index)}
          onDragOver={(e) => handleDragOver(e, index)}
          onDrop={handleDrop}
          className="flex items-center gap-3 bg-white border border-gray-200 rounded-lg px-3 py-2.5 cursor-grab active:cursor-grabbing group"
        >
          <GripVertical className="w-4 h-4 text-gray-300 shrink-0" />
          <span className="w-6 h-6 rounded-full bg-sky-100 text-sky-700 text-xs font-bold flex items-center justify-center shrink-0">
            {index + 1}
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900">
              {stop.customer.firstName} {stop.customer.lastName}
            </p>
            <p className="text-xs text-gray-400 flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {stop.customer.address}, {stop.customer.city}
            </p>
            {stop.notes && <p className="text-xs text-gray-400 italic">{stop.notes}</p>}
          </div>
          <button
            onClick={() => handleRemove(stop.id)}
            className="text-gray-200 hover:text-red-500 transition-colors shrink-0"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  )
}
