"use client"

import { useState, useEffect, useActionState } from "react"
import { Plus, Trash2, Sparkles } from "lucide-react"
import Button from "@/components/ui/Button"
import { formatCurrency } from "@/lib/utils"
import type { Customer } from "@/app/generated/prisma/client"

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
  const [selectedCustomerId, setSelectedCustomerId] = useState(defaultCustomerId ?? "")
  const [items, setItems] = useState<LineItem[]>([{ description: "", quantity: "1", unitPrice: "" }])

  const [, formAction, pending] = useActionState(async (_: unknown, formData: FormData) => {
    await action(formData)
    return null
  }, null)

  // Auto-populate first item on mount if defaultCustomerId has a monthly rate
  useEffect(() => {
    if (!defaultCustomerId) return
    const customer = customers.find((c) => c.id === defaultCustomerId)
    if (customer?.monthlyRate && items[0].description === "" && items[0].unitPrice === "") {
      setItems([{ description: "Monthly pool service", quantity: "1", unitPrice: customer.monthlyRate.toString() }])
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleCustomerChange = (id: string) => {
    setSelectedCustomerId(id)
    const customer = customers.find((c) => c.id === id)
    // Only auto-fill if the first line item is still blank
    if (customer?.monthlyRate && items[0].description === "" && items[0].unitPrice === "") {
      setItems((prev) => {
        const next = [...prev]
        next[0] = { description: "Monthly pool service", quantity: "1", unitPrice: customer.monthlyRate!.toString() }
        return next
      })
    }
  }

  const addItem = () => setItems((prev) => [...prev, { description: "", quantity: "1", unitPrice: "" }])
  const removeItem = (i: number) => setItems((prev) => prev.filter((_, idx) => idx !== i))
  const updateItem = (i: number, field: keyof LineItem, value: string) =>
    setItems((prev) => prev.map((item, idx) => (idx === i ? { ...item, [field]: value } : item)))

  const total = items.reduce((sum, item) => {
    return sum + (parseFloat(item.quantity) || 0) * (parseFloat(item.unitPrice) || 0)
  }, 0)

  const defaultDue = new Date()
  defaultDue.setDate(defaultDue.getDate() + 30)
  const defaultDueStr = defaultDue.toISOString().split("T")[0]

  const selectedCustomer = customers.find((c) => c.id === selectedCustomerId)

  return (
    <form action={formAction} className="space-y-6">
      {/* Customer */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Customer *</label>
        <select
          name="customerId"
          required
          value={selectedCustomerId}
          onChange={(e) => handleCustomerChange(e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
        >
          <option value="">Select customer…</option>
          {customers.map((c) => (
            <option key={c.id} value={c.id}>
              {c.firstName} {c.lastName}
              {c.monthlyRate ? ` — $${c.monthlyRate}/mo` : ""}
            </option>
          ))}
        </select>
        {selectedCustomer?.monthlyRate && items[0].description === "" && (
          <button
            type="button"
            onClick={() =>
              setItems((prev) => {
                const next = [...prev]
                next[0] = { description: "Monthly pool service", quantity: "1", unitPrice: selectedCustomer.monthlyRate!.toString() }
                return next
              })
            }
            className="mt-1.5 flex items-center gap-1 text-xs text-sky-600 hover:text-sky-800"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Pre-fill monthly service (${selectedCustomer.monthlyRate})
          </button>
        )}
      </div>

      {/* Due date */}
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

        {/* Datalist for description suggestions */}
        <datalist id="service-descriptions">
          {SERVICE_DESCRIPTIONS.map((d) => (
            <option key={d} value={d} />
          ))}
        </datalist>

        <div className="space-y-2">
          {/* Column headers — hidden on mobile */}
          <div className="hidden sm:grid grid-cols-12 gap-2 text-xs text-gray-500 px-1">
            <span className="col-span-6">Description</span>
            <span className="col-span-2 text-center">Qty</span>
            <span className="col-span-3">Unit Price</span>
          </div>

          {items.map((item, i) => (
            <div key={i} className="flex flex-col sm:grid sm:grid-cols-12 gap-2">
              {/* Description with datalist */}
              <input
                list="service-descriptions"
                name="description"
                value={item.description}
                onChange={(e) => updateItem(i, "description", e.target.value)}
                placeholder="Description or pick from list…"
                required
                className="sm:col-span-6 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
              <div className="flex gap-2 sm:contents">
                <input
                  name="quantity"
                  value={item.quantity}
                  onChange={(e) => updateItem(i, "quantity", e.target.value)}
                  type="number"
                  min="0.01"
                  step="0.01"
                  required
                  aria-label="Quantity"
                  className="w-20 sm:w-auto sm:col-span-2 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 text-center focus:outline-none focus:ring-2 focus:ring-sky-500"
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
                  aria-label="Unit price"
                  className="flex-1 sm:flex-none sm:col-span-3 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
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
          className="mt-3 flex items-center gap-1 text-sm text-sky-600 hover:text-sky-800"
        >
          <Plus className="w-4 h-4" /> Add line item
        </button>
      </div>

      {/* Total */}
      <div className="flex justify-end border-t border-gray-100 pt-4">
        <div className="text-right">
          <p className="text-xs text-gray-400 uppercase tracking-wide">Total</p>
          <p className="text-2xl font-bold text-gray-900">{formatCurrency(total)}</p>
        </div>
      </div>

      {/* Notes */}
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
