"use client"

import { Plus, Trash2 } from "lucide-react"
import { formatCurrency } from "@/lib/utils"

const SERVICE_DESCRIPTIONS = [
  "Monthly pool service",
  "Weekly pool service",
  "Bi-weekly pool service",
  "Green pool / algae treatment",
  "Shock treatment",
  "Chemical balance adjustment",
  "Filter cleaning / backwash",
  "Filter cartridge replacement",
  "Salt cell cleaning",
  "Pump repair – labor",
  "Drain and refill",
  "Spring opening service",
  "Fall closing service",
  "Equipment inspection",
  "Emergency / on-call service",
  "Parts and materials",
]

export interface LineItem {
  description: string
  quantity: string
  unitPrice: string
}

interface LineItemEditorProps {
  items: LineItem[]
  onAdd: () => void
  onRemove: (i: number) => void
  onUpdate: (i: number, field: keyof LineItem, value: string) => void
  nameSuffix?: string
  colorScheme?: "sky" | "amber"
  withServiceDatalist?: boolean
  totalLabel?: string
  hideTotalWhenZero?: boolean
}

const COLORS = {
  sky:   { ring: "focus:ring-sky-500",   add: "text-sky-600 hover:text-sky-800" },
  amber: { ring: "focus:ring-amber-500", add: "text-amber-600 hover:text-amber-800" },
}

export default function LineItemEditor({
  items,
  onAdd,
  onRemove,
  onUpdate,
  nameSuffix = "",
  colorScheme = "sky",
  withServiceDatalist = false,
  totalLabel = "Total",
  hideTotalWhenZero = false,
}: LineItemEditorProps) {
  const { ring, add } = COLORS[colorScheme]
  const total = items.reduce((sum, item) => sum + (parseFloat(item.quantity) || 0) * (parseFloat(item.unitPrice) || 0), 0)

  return (
    <div>
      {withServiceDatalist && (
        <datalist id="service-descriptions">
          {SERVICE_DESCRIPTIONS.map((d) => <option key={d} value={d} />)}
        </datalist>
      )}

      <div className="space-y-2">
        <div className="hidden sm:grid grid-cols-12 gap-2 text-xs text-gray-500 px-1">
          <span className="col-span-6">Description</span>
          <span className="col-span-2 text-center">Qty</span>
          <span className="col-span-3">Unit Price</span>
        </div>

        {items.map((item, i) => (
          <div key={i} className="flex flex-col sm:grid sm:grid-cols-12 gap-2">
            <input
              list={withServiceDatalist ? "service-descriptions" : undefined}
              name={`description${nameSuffix}`}
              value={item.description}
              onChange={(e) => onUpdate(i, "description", e.target.value)}
              placeholder={withServiceDatalist ? "Description or pick from list…" : "Description"}
              required
              className={`sm:col-span-6 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 ${ring}`}
            />
            <div className="flex gap-2 sm:contents">
              <input
                name={`quantity${nameSuffix}`}
                value={item.quantity}
                onChange={(e) => onUpdate(i, "quantity", e.target.value)}
                type="number"
                min="0.01"
                step="0.01"
                required
                aria-label="Quantity"
                className={`w-20 sm:w-auto sm:col-span-2 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 text-center focus:outline-none focus:ring-2 ${ring}`}
              />
              <input
                name={`unitPrice${nameSuffix}`}
                value={item.unitPrice}
                onChange={(e) => onUpdate(i, "unitPrice", e.target.value)}
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                required
                aria-label="Unit price"
                className={`flex-1 sm:flex-none sm:col-span-3 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 ${ring}`}
              />
              <button
                type="button"
                onClick={() => onRemove(i)}
                disabled={items.length === 1}
                aria-label="Remove line item"
                className="sm:col-span-1 text-gray-300 hover:text-red-500 disabled:opacity-30 transition-colors shrink-0"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={onAdd}
        className={`mt-3 flex items-center gap-1 text-sm ${add}`}
      >
        <Plus className="w-4 h-4" /> Add line item
      </button>

      {(!hideTotalWhenZero || total > 0) && (
        <div className="flex justify-end border-t border-gray-100 pt-4 mt-4">
          <div className="text-right">
            <p className="text-xs text-gray-400 uppercase tracking-wide">{totalLabel}</p>
            <p className="text-2xl font-bold text-gray-900">{formatCurrency(total)}</p>
          </div>
        </div>
      )}
    </div>
  )
}
