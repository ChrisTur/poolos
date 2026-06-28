"use client"

import { Beaker, ChevronDown, ChevronUp, Plus, X } from "lucide-react"

export const UNITS = ["oz", "lbs", "gal", "tablets", "bags", "quarts"] as const

export type ChemicalUsageRow = {
  productName: string
  quantity: string
  unit: string
  unitCost: string
}

export const EMPTY_CHEMICAL_ROW: ChemicalUsageRow = {
  productName: "",
  quantity: "",
  unit: "oz",
  unitCost: "",
}

export default function ChemicalsUsedSection({
  rows,
  open,
  onToggle,
  onAdd,
  onRemove,
  onUpdate,
}: {
  rows: ChemicalUsageRow[]
  open: boolean
  onToggle: () => void
  onAdd: () => void
  onRemove: (i: number) => void
  onUpdate: (i: number, field: keyof ChemicalUsageRow, value: string) => void
}) {
  return (
    <div className="rounded-xl border border-gray-200 overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-3 text-left bg-white hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Beaker className="w-4 h-4 text-gray-400" />
          <span className="text-sm font-medium text-gray-700">Chemicals Used</span>
          {rows.length > 0 && (
            <span className="text-xs font-medium text-sky-700 bg-sky-50 border border-sky-200 rounded-full px-2 py-0.5">
              {rows.length} item{rows.length !== 1 ? "s" : ""}
            </span>
          )}
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
      </button>

      {open && (
        <div className="border-t border-gray-100 px-4 pb-4 pt-3 space-y-3 bg-gray-50">
          {rows.length === 0 && (
            <p className="text-xs text-gray-400 text-center py-2">No chemicals added yet.</p>
          )}
          {rows.map((row, i) => {
            const qty   = parseFloat(row.quantity) || 0
            const cost  = parseFloat(row.unitCost) || 0
            const total = qty * cost
            return (
              <div key={i} className="rounded-lg border border-gray-200 bg-white p-3 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <input
                    type="text"
                    placeholder="e.g. Chlorine tablets"
                    value={row.productName}
                    onChange={(e) => onUpdate(i, "productName", e.target.value)}
                    className="flex-1 rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                  <button
                    type="button"
                    onClick={() => onRemove(i)}
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
                      onChange={(e) => onUpdate(i, "quantity", e.target.value)}
                      className="w-full rounded-lg border border-gray-300 px-2.5 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Unit</label>
                    <select
                      value={row.unit}
                      onChange={(e) => onUpdate(i, "unit", e.target.value)}
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
                      onChange={(e) => onUpdate(i, "unitCost", e.target.value)}
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
            onClick={onAdd}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg border border-dashed border-sky-300 text-sm font-medium text-sky-600 hover:bg-sky-50 active:bg-sky-100 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Chemical
          </button>
        </div>
      )}
    </div>
  )
}
