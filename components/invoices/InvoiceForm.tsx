"use client"

import { useState, useActionState } from "react"
import { Plus, Trash2 } from "lucide-react"
import Button from "@/components/ui/Button"
import { formatCurrency } from "@/lib/utils"
import type { Customer } from "@/app/generated/prisma/client"

interface LineItem {
  description: string
  quantity: string
  unitPrice: string
}

interface InvoiceFormProps {
  action: (formData: FormData) => Promise<void>
  customers: Customer[]
  defaultCustomerId?: string
}

export default function InvoiceForm({ action, customers, defaultCustomerId }: InvoiceFormProps) {
  const [items, setItems] = useState<LineItem[]>([{ description: "", quantity: "1", unitPrice: "" }])

  const [, formAction, pending] = useActionState(async (_: unknown, formData: FormData) => {
    await action(formData)
    return null
  }, null)

  const addItem = () => setItems((prev) => [...prev, { description: "", quantity: "1", unitPrice: "" }])
  const removeItem = (i: number) => setItems((prev) => prev.filter((_, idx) => idx !== i))
  const updateItem = (i: number, field: keyof LineItem, value: string) =>
    setItems((prev) => prev.map((item, idx) => (idx === i ? { ...item, [field]: value } : item)))

  const total = items.reduce((sum, item) => {
    const qty = parseFloat(item.quantity) || 0
    const price = parseFloat(item.unitPrice) || 0
    return sum + qty * price
  }, 0)

  // Default due date = 30 days from today
  const defaultDue = new Date()
  defaultDue.setDate(defaultDue.getDate() + 30)
  const defaultDueStr = defaultDue.toISOString().split("T")[0]

  return (
    <form action={formAction} className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Customer *</label>
        <select
          name="customerId"
          required
          defaultValue={defaultCustomerId ?? ""}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
        >
          <option value="">Select customer…</option>
          {customers.map((c) => (
            <option key={c.id} value={c.id}>
              {c.firstName} {c.lastName}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Due Date *</label>
        <input
          name="dueDate"
          type="date"
          required
          defaultValue={defaultDueStr}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
        />
      </div>

      {/* Line items */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Line Items</label>
        <div className="space-y-2">
          <div className="grid grid-cols-12 gap-2 text-xs text-gray-500 px-1">
            <span className="col-span-6">Description</span>
            <span className="col-span-2 text-center">Qty</span>
            <span className="col-span-3">Unit Price</span>
          </div>
          {items.map((item, i) => (
            <div key={i} className="grid grid-cols-12 gap-2 items-center">
              <input
                name="description"
                value={item.description}
                onChange={(e) => updateItem(i, "description", e.target.value)}
                placeholder="Description"
                required
                className="col-span-6 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
              <input
                name="quantity"
                value={item.quantity}
                onChange={(e) => updateItem(i, "quantity", e.target.value)}
                type="number"
                min="0.01"
                step="0.01"
                required
                className="col-span-2 rounded-lg border border-gray-300 px-3 py-2 text-sm text-center focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
              <input
                name="unitPrice"
                value={item.unitPrice}
                onChange={(e) => updateItem(i, "unitPrice", e.target.value)}
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                required
                className="col-span-3 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
              <button
                type="button"
                onClick={() => removeItem(i)}
                disabled={items.length === 1}
                className="col-span-1 text-gray-300 hover:text-red-500 disabled:opacity-30 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={addItem}
          className="mt-2 flex items-center gap-1 text-sm text-sky-600 hover:text-sky-800"
        >
          <Plus className="w-4 h-4" /> Add line item
        </button>
      </div>

      {/* Total */}
      <div className="flex justify-end">
        <div className="text-right">
          <p className="text-sm text-gray-500">Total</p>
          <p className="text-2xl font-bold text-gray-900">{formatCurrency(total)}</p>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
        <textarea
          name="notes"
          rows={2}
          placeholder="Payment instructions, thank you note…"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-sky-500 resize-y"
        />
      </div>

      <div className="flex gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? "Creating…" : "Create Invoice"}
        </Button>
        <Button type="button" variant="secondary" onClick={() => history.back()}>
          Cancel
        </Button>
      </div>
    </form>
  )
}
