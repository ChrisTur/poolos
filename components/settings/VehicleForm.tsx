"use client"

import { useState } from "react"
import Button from "@/components/ui/Button"

// ── Make / model catalogue ──────────────────────────────────────────────────
export const VEHICLE_CATALOGUE: Record<string, string[]> = {
  "Ford": [
    "F-150", "F-250 Super Duty", "F-350 Super Duty",
    "Ranger", "Maverick",
    "Transit 150", "Transit 250", "Transit 350",
    "Transit Connect", "E-350",
  ],
  "Chevrolet": [
    "Silverado 1500", "Silverado 2500HD", "Silverado 3500HD",
    "Colorado",
    "Express 1500", "Express 2500", "Express 3500",
  ],
  "GMC": [
    "Sierra 1500", "Sierra 2500HD", "Sierra 3500HD",
    "Canyon",
    "Savana 1500", "Savana 2500", "Savana 3500",
  ],
  "RAM": [
    "1500", "2500", "3500",
    "ProMaster 1500", "ProMaster 2500", "ProMaster 3500",
    "ProMaster City",
  ],
  "Toyota": ["Tacoma", "Tundra", "Sequoia", "Hilux"],
  "Nissan": [
    "Frontier", "Titan",
    "NV1500", "NV2500", "NV3500", "NV200",
  ],
  "Honda": ["Ridgeline"],
  "Mercedes-Benz": [
    "Sprinter 1500", "Sprinter 2500", "Sprinter 3500",
    "Metris",
  ],
  "Isuzu": ["NQR", "NPR", "NRR"],
  "Volkswagen": ["Transporter", "Crafter"],
  "Other": [],
}

const MAKES = Object.keys(VEHICLE_CATALOGUE)
const CURRENT_YEAR = new Date().getFullYear()
const YEARS = Array.from({ length: 36 }, (_, i) => CURRENT_YEAR + 1 - i) // next year → 1990

const inputCls = "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-sky-500"

interface Props {
  action: (formData: FormData) => void | Promise<void>
  defaults?: {
    name?: string
    make?: string | null
    model?: string | null
    year?: number | null
    licensePlate?: string | null
    initialMileage?: number | null
    notes?: string | null
  }
  submitLabel?: string
}

export default function VehicleForm({ action, defaults = {}, submitLabel = "Save" }: Props) {
  const [make,  setMake]  = useState(defaults.make  ?? "")
  const [model, setModel] = useState(defaults.model ?? "")

  const modelOptions = make && make !== "Other" ? (VEHICLE_CATALOGUE[make] ?? []) : []

  function handleMakeChange(val: string) {
    setMake(val)
    setModel("")
  }

  return (
    <form action={action} className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {/* Name */}
      <div className="col-span-2 sm:col-span-3">
        <label className="block text-xs font-medium text-gray-600 mb-1">Name / Label *</label>
        <input
          name="name"
          required
          defaultValue={defaults.name ?? ""}
          placeholder="e.g. Truck 1"
          className={inputCls}
        />
      </div>

      {/* Make */}
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Make</label>
        <select
          name="make"
          value={make}
          onChange={(e) => handleMakeChange(e.target.value)}
          className={inputCls}
        >
          <option value="">Select make…</option>
          {MAKES.map((m) => <option key={m} value={m}>{m}</option>)}
        </select>
      </div>

      {/* Model */}
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Model</label>
        {modelOptions.length > 0 ? (
          <select
            name="model"
            value={model}
            onChange={(e) => setModel(e.target.value)}
            className={inputCls}
          >
            <option value="">Select model…</option>
            {modelOptions.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
        ) : (
          <input
            name="model"
            value={model}
            onChange={(e) => setModel(e.target.value)}
            placeholder={make ? "Enter model" : "Select make first"}
            className={inputCls}
          />
        )}
      </div>

      {/* Year */}
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Year</label>
        <select name="year" defaultValue={defaults.year ?? ""} className={inputCls}>
          <option value="">—</option>
          {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>

      {/* License plate */}
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">License Plate</label>
        <input
          name="licensePlate"
          defaultValue={defaults.licensePlate ?? ""}
          placeholder="ABC-1234"
          className={inputCls}
        />
      </div>

      {/* Initial mileage */}
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Starting Odometer (mi)</label>
        <input
          name="initialMileage"
          type="number"
          step="1"
          min="0"
          defaultValue={defaults.initialMileage ?? ""}
          placeholder="e.g. 42000"
          className={inputCls}
        />
      </div>

      {/* Notes */}
      <div className="col-span-2 sm:col-span-1">
        <label className="block text-xs font-medium text-gray-600 mb-1">Notes</label>
        <input
          name="notes"
          defaultValue={defaults.notes ?? ""}
          placeholder="Optional"
          className={inputCls}
        />
      </div>

      <div className="col-span-2 sm:col-span-3 flex justify-end pt-1">
        <Button type="submit" size="sm">{submitLabel}</Button>
      </div>
    </form>
  )
}
