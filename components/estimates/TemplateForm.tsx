"use client"

import { useState, useActionState } from "react"
import { Plus, Trash2 } from "lucide-react"
import Button from "@/components/ui/Button"
import { formatCurrency } from "@/lib/utils"

interface LineItem {
  description: string
  quantity: string
  unitPrice: string
}

interface TemplateFormProps {
  action: (formData: FormData) => Promise<void>
  initialName?: string
  initialDescription?: string
  initialItems?: LineItem[]
  submitLabel?: string
}

export default function TemplateForm({
  action,
  initialName = "",
  initialDescription = "",
  initialItems,
  submitLabel = "Save Template",
}: TemplateFormProps) {
  const [items, setItems] = useState<LineItem[]>(
    initialItems ?? [{ description: "", quantity: "1", unitPrice: "" }]
  )

  const [, formAction, pending] = useActionState(async (_: unknown, formData: FormData) => {
    await action(formData)
    return null
  }, null)

  const addItem    = () => setItems((prev) => [...prev, { description: "", quantity: "1", unitPrice: "" }])
  const removeItem = (i: number) => setItems((prev) => prev.filter((_, idx) => idx !== i))
  const updateItem = (i: number, field: keyof LineItem, value: string) =>
    setItems((prev) => prev.map((item, idx) => (idx === i ? { ...item, [field]: value } : item)))

  const total = items.reduce((sum, item) => {
    return sum + (parseFloat(item.quantity) || 0) * (parseFloat(item.unitPrice) || 0)
  }, 0)

  return (
    <form action={formAction} className="space-y-5">
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Template Name *</label>
          <input
            name="name"
            required
            defaultValue={initialName}
            placeholder="e.g. Pool Opening, Filter Replacement"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description <span className="font-normal text-gray-400">(optional)</span>
          </label>
          <input
            name="description"
            defaultValue={initialDescription}
            placeholder="Short description shown when selecting"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Line Items</label>
        <div className="space-y-2">
          <div className="hidden sm:grid grid-cols-12 gap-2 text-xs text-gray-500 px-1">
            <span className="col-span-6">Description</span>
            <span className="col-span-2 text-center">Qty</span>
            <span className="col-span-3">Unit Price</span>
          </div>

          {items.map((item, i) => (
            <div key={i} className="flex flex-col sm:grid sm:grid-cols-12 gap-2">
              <input
                name="description[]"
                value={item.description}
                onChange={(e) => updateItem(i, "description", e.target.value)}
                placeholder="Description"
                required
                className="sm:col-span-6 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
              <div className="flex gap-2 sm:contents">
                <input
                  name="quantity[]"
                  value={item.quantity}
                  onChange={(e) => updateItem(i, "quantity", e.target.value)}
                  type="number"
                  min="0.01"
                  step="0.01"
                  required
                  aria-label="Quantity"
                  className="w-20 sm:w-auto sm:col-span-2 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 text-center focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
                <input
                  name="unitPrice[]"
                  value={item.unitPrice}
                  onChange={(e) => updateItem(i, "unitPrice", e.target.value)}
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  required
                  aria-label="Unit price"
                  className="flex-1 sm:flex-none sm:col-span-3 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
                <button
                  type="button"
                  onClick={() => removeItem(i)}
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
          onClick={addItem}
          className="mt-3 flex items-center gap-1 text-sm text-amber-600 hover:text-amber-800"
        >
          <Plus className="w-4 h-4" /> Add line item
        </button>
      </div>

      {total > 0 && (
        <div className="flex justify-end border-t border-gray-100 pt-3">
          <div className="text-right">
            <p className="text-xs text-gray-400 uppercase tracking-wide">Template Total</p>
            <p className="text-2xl font-bold text-gray-900">{formatCurrency(total)}</p>
          </div>
        </div>
      )}

      <div className="flex gap-3">
        <Button type="submit" disabled={pending} className="bg-amber-600 hover:bg-amber-700 focus:ring-amber-500">
          {pending ? "Saving…" : submitLabel}
        </Button>
        <Button type="button" variant="secondary" onClick={() => history.back()}>
          Cancel
        </Button>
      </div>
    </form>
  )
}
