"use client"

import { useState } from "react"
import { Trash2, Plus, ChevronDown, ChevronRight, Wrench, AlertTriangle, CheckCircle2 } from "lucide-react"
import Button from "@/components/ui/Button"
import { addEquipment, deleteEquipment, addServiceRecord, deleteServiceRecord } from "@/lib/actions/equipment"
import { formatDate, formatCurrency } from "@/lib/utils"

const EQUIPMENT_TYPES = ["pump", "filter", "heater", "salt_system", "cleaner", "light", "other"]

const SERVICE_INTERVALS = [
  { label: "None", value: "" },
  { label: "Monthly (30 days)",     value: "30"  },
  { label: "Quarterly (90 days)",   value: "90"  },
  { label: "Every 6 months (180)",  value: "180" },
  { label: "Annually (365 days)",   value: "365" },
]

type ServiceRecord = {
  id: string
  date: Date
  description: string
  parts: string | null
  laborCost: number
  partsCost: number
  notes: string | null
  technician: { firstName: string; lastName: string } | null
}

type EquipmentItem = {
  id: string
  type: string
  brand: string | null
  model: string | null
  serialNumber: string | null
  installedAt: Date | null
  warrantyExpiry: Date | null
  warrantyProvider: string | null
  warrantyNotes: string | null
  notes: string | null
  serviceIntervalDays: number | null
  lastServicedAt: Date | null
  serviceRecords: ServiceRecord[]
}

type UserOption = { id: string; firstName: string; lastName: string }

function serviceDueInfo(eq: EquipmentItem): { daysOverdue: number; dueAt: Date } | null {
  if (!eq.serviceIntervalDays) return null
  const reference = eq.lastServicedAt ?? eq.installedAt
  if (!reference) return null
  const dueAt = new Date(reference.getTime() + eq.serviceIntervalDays * 86_400_000)
  const now = new Date()
  const daysOverdue = Math.floor((now.getTime() - dueAt.getTime()) / 86_400_000)
  return { daysOverdue, dueAt }
}

function EquipmentRow({
  eq,
  customerId,
  users,
}: {
  eq: EquipmentItem
  customerId: string
  users: UserOption[]
}) {
  const [open, setOpen] = useState(false)
  const [addingRecord, setAddingRecord] = useState(false)

  const delEquipAction    = deleteEquipment.bind(null, eq.id, customerId)
  const addRecordAction   = addServiceRecord.bind(null, eq.id, customerId)

  const due = serviceDueInfo(eq)
  const isOverdue = due && due.daysOverdue >= 0

  const eqLabel = [eq.brand, eq.model].filter(Boolean).join(" ") || eq.type.replace("_", " ")

  return (
    <div className="border border-gray-100 rounded-lg overflow-hidden">
      {/* Header row */}
      <div className="flex items-start gap-2 px-3 py-2.5">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="mt-0.5 text-gray-400 hover:text-gray-700 shrink-0"
        >
          {open
            ? <ChevronDown className="w-3.5 h-3.5" />
            : <ChevronRight className="w-3.5 h-3.5" />}
        </button>

        <div className="flex-1 min-w-0 text-sm">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-medium text-gray-900 capitalize">
              {eq.type.replace("_", " ")}
            </p>
            {isOverdue && (
              <span className="inline-flex items-center gap-1 text-xs font-medium text-orange-700 bg-orange-50 border border-orange-200 rounded-full px-2 py-0.5">
                <AlertTriangle className="w-3 h-3" />
                {due!.daysOverdue === 0 ? "Due today" : `${due!.daysOverdue}d overdue`}
              </span>
            )}
            {due && !isOverdue && (
              <span className="inline-flex items-center gap-1 text-xs text-green-600 bg-green-50 border border-green-200 rounded-full px-2 py-0.5">
                <CheckCircle2 className="w-3 h-3" />
                Due {formatDate(due.dueAt)}
              </span>
            )}
          </div>
          {eqLabel !== eq.type.replace("_", " ") && (
            <p className="text-xs text-gray-500">{eqLabel}</p>
          )}
          {eq.serialNumber && <p className="text-xs text-gray-400">S/N: {eq.serialNumber}</p>}
          {eq.installedAt && (
            <p className="text-xs text-gray-400">Installed {formatDate(eq.installedAt)}</p>
          )}
          {eq.warrantyExpiry && (() => {
            const expired = new Date(eq.warrantyExpiry) < new Date()
            return (
              <p className={`text-xs mt-0.5 ${expired ? "text-red-500" : "text-gray-400"}`}>
                Warranty {expired ? "expired" : "until"} {formatDate(eq.warrantyExpiry)}
                {eq.warrantyProvider && ` · ${eq.warrantyProvider}`}
              </p>
            )
          })()}
          {eq.serviceIntervalDays && (
            <p className="text-xs text-gray-400 mt-0.5">
              Service every {eq.serviceIntervalDays} days
              {eq.lastServicedAt && ` · Last: ${formatDate(eq.lastServicedAt)}`}
            </p>
          )}
          {eq.notes && <p className="text-xs text-gray-400 mt-0.5 italic">{eq.notes}</p>}
        </div>

        <form action={delEquipAction}>
          <button type="submit" className="text-gray-300 hover:text-red-500 transition-colors mt-0.5 shrink-0">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>

      {/* Expanded: service history */}
      {open && (
        <div className="border-t border-gray-100 bg-gray-50 px-3 py-2.5 space-y-3">
          {/* Service records list */}
          {eq.serviceRecords.length > 0 ? (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Service History</p>
              {eq.serviceRecords.map((rec) => {
                const delRecAction = deleteServiceRecord.bind(null, rec.id, customerId)
                const totalCost = rec.laborCost + rec.partsCost
                return (
                  <div key={rec.id} className="flex items-start gap-2 bg-white rounded-lg p-2.5 border border-gray-100 text-xs">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-gray-700">{formatDate(rec.date)}</span>
                        {rec.technician && (
                          <span className="text-gray-400">{rec.technician.firstName} {rec.technician.lastName}</span>
                        )}
                        {totalCost > 0 && (
                          <span className="text-gray-400">{formatCurrency(totalCost)}</span>
                        )}
                      </div>
                      <p className="text-gray-700 mt-0.5">{rec.description}</p>
                      {rec.parts && <p className="text-gray-400 mt-0.5">Parts: {rec.parts}</p>}
                      {rec.notes && <p className="text-gray-400 mt-0.5 italic">{rec.notes}</p>}
                    </div>
                    <form action={delRecAction}>
                      <button type="submit" className="text-gray-300 hover:text-red-500 transition-colors shrink-0 mt-0.5">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </form>
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="text-xs text-gray-400">No service records yet.</p>
          )}

          {/* Add service record */}
          {addingRecord ? (
            <form
              action={async (fd) => {
                await addRecordAction(fd)
                setAddingRecord(false)
              }}
              className="space-y-2 pt-2 border-t border-gray-200"
            >
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Add Service Record</p>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-gray-500">Date *</label>
                  <input
                    name="date"
                    type="date"
                    required
                    defaultValue={new Date().toISOString().split("T")[0]}
                    className="w-full mt-0.5 rounded-lg border border-gray-300 px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
                {users.length > 0 && (
                  <div>
                    <label className="text-xs text-gray-500">Technician</label>
                    <select
                      name="technicianId"
                      className="w-full mt-0.5 rounded-lg border border-gray-300 px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-sky-500"
                    >
                      <option value="">—</option>
                      {users.map((u) => (
                        <option key={u.id} value={u.id}>{u.firstName} {u.lastName}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
              <input
                name="description"
                required
                placeholder="Description of work performed *"
                className="w-full rounded-lg border border-gray-300 px-2 py-1.5 text-xs placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
              <input
                name="parts"
                placeholder="Parts used (optional)"
                className="w-full rounded-lg border border-gray-300 px-2 py-1.5 text-xs placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-gray-500">Labor cost ($)</label>
                  <input
                    name="laborCost"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    className="w-full mt-0.5 rounded-lg border border-gray-300 px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500">Parts cost ($)</label>
                  <input
                    name="partsCost"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    className="w-full mt-0.5 rounded-lg border border-gray-300 px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>
              <input
                name="notes"
                placeholder="Notes (optional)"
                className="w-full rounded-lg border border-gray-300 px-2 py-1.5 text-xs placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
              <div className="flex gap-2">
                <Button type="submit" size="sm">
                  <Plus className="w-3.5 h-3.5" /> Save
                </Button>
                <button
                  type="button"
                  onClick={() => setAddingRecord(false)}
                  className="text-xs text-gray-400 hover:text-gray-700"
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <button
              type="button"
              onClick={() => setAddingRecord(true)}
              className="flex items-center gap-1.5 text-xs text-sky-600 hover:text-sky-800 font-medium"
            >
              <Plus className="w-3.5 h-3.5" />
              Add service record
            </button>
          )}
        </div>
      )}
    </div>
  )
}

export default function EquipmentCard({
  customerId,
  equipment,
  users = [],
}: {
  customerId: string
  equipment: EquipmentItem[]
  users?: UserOption[]
}) {
  const [showAddForm, setShowAddForm] = useState(false)

  const addEquipAction = addEquipment.bind(null, customerId)

  return (
    <div className="space-y-3">
      {/* Equipment list */}
      {equipment.length > 0 && (
        <div className="space-y-2">
          {equipment.map((eq) => (
            <EquipmentRow key={eq.id} eq={eq} customerId={customerId} users={users} />
          ))}
        </div>
      )}

      {equipment.length === 0 && !showAddForm && (
        <p className="text-xs text-gray-400">No equipment added yet.</p>
      )}

      {/* Add equipment */}
      {showAddForm ? (
        <form
          action={async (fd) => {
            await addEquipAction(fd)
            setShowAddForm(false)
          }}
          className="space-y-2 pt-2 border-t border-gray-100"
        >
          <p className="text-xs font-medium text-gray-500">Add Equipment</p>
          <select
            name="type"
            required
            className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
          >
            <option value="">Type…</option>
            {EQUIPMENT_TYPES.map((t) => (
              <option key={t} value={t}>{t.replace("_", " ").replace(/\b\w/g, (c) => c.toUpperCase())}</option>
            ))}
          </select>
          <div className="grid grid-cols-2 gap-2">
            <input name="brand" placeholder="Brand" className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-sky-500" />
            <input name="model" placeholder="Model" className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-sky-500" />
          </div>
          <input name="serialNumber" placeholder="Serial # (optional)" className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-sky-500" />
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-gray-500">Install date</label>
              <input name="installedAt" type="date" className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 mt-0.5" />
            </div>
            <div>
              <label className="text-xs text-gray-500">Warranty expiry</label>
              <input name="warrantyExpiry" type="date" className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 mt-0.5" />
            </div>
          </div>
          <input name="warrantyProvider" placeholder="Warranty provider (optional)" className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-sky-500" />
          <input name="warrantyNotes" placeholder="Warranty notes (optional)" className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-sky-500" />
          <div>
            <label className="text-xs text-gray-500">Service interval</label>
            <select
              name="serviceIntervalDays"
              className="w-full mt-0.5 rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
            >
              {SERVICE_INTERVALS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          <input name="notes" placeholder="General notes (optional)" className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-sky-500" />
          <div className="flex gap-2">
            <Button type="submit" size="sm" variant="secondary">
              <Plus className="w-3.5 h-3.5" /> Add
            </Button>
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="text-xs text-gray-400 hover:text-gray-700"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <button
          type="button"
          onClick={() => setShowAddForm(true)}
          className="flex items-center gap-1.5 text-xs text-sky-600 hover:text-sky-800 font-medium"
        >
          <Wrench className="w-3.5 h-3.5" />
          Add equipment
        </button>
      )}
    </div>
  )
}
