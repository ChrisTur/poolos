"use client"

import { useState, useEffect, useActionState } from "react"
import { Plus, Trash2, Sparkles } from "lucide-react"
import Button from "@/components/ui/Button"
import CustomerCombobox from "@/components/ui/CustomerCombobox"
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

export const SERVICE_TYPES = [
  { value: "monthly",      label: "Monthly Pool Service" },
  { value: "repair",       label: "Repair / Service Work" },
  { value: "equipment",    label: "Equipment / Parts" },
  { value: "chemical",     label: "Chemical Treatment" },
  { value: "installation", label: "Installation" },
  { value: "other",        label: "Other" },
]

interface InvoiceFormProps {
  action: (formData: FormData) => Promise<void>
  customers: Customer[]
  defaultCustomerId?: string
  defaultDueDays?: number
  initialDueDate?: string
  initialNotes?: string
  initialItems?: LineItem[]
  initialServiceType?: string
  hideCustomerSelect?: boolean
  submitLabel?: string
}

function calcDueDate(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return d.toISOString().split("T")[0]
}

export default function InvoiceForm({
  action,
  customers,
  defaultCustomerId,
  defaultDueDays = 30,
  initialDueDate,
  initialNotes,
  initialItems,
  initialServiceType,
  hideCustomerSelect = false,
  submitLabel,
}: InvoiceFormProps) {
  const [selectedCustomerId, setSelectedCustomerId] = useState(defaultCustomerId ?? "")
  const [serviceType, setServiceType] = useState(initialServiceType ?? "")
  const [items, setItems] = useState<LineItem[]>(
    initialItems ?? [{ description: "", quantity: "1", unitPrice: "" }]
  )
  const [dueDate, setDueDate] = useState(
    initialDueDate ?? calcDueDate(defaultDueDays)
  )

  const [, formAction, pending] = useActionState(async (_: unknown, formData: FormData) => {
    await action(formData)
    return null
  }, null)

  const isMonthlyType = (type: string) => type === "monthly" || type === ""

  // Auto-populate first item and due date on mount if a customer is pre-selected
  useEffect(() => {
    if (!defaultCustomerId || initialItems) return
    const customer = customers.find((c) => c.id === defaultCustomerId)
    if (!customer) return
    // Defer state updates to avoid synchronous setState-in-effect
    Promise.resolve().then(() => {
      if (isMonthlyType(initialServiceType ?? "") && customer.monthlyRate && items[0].description === "" && items[0].unitPrice === "") {
        setItems([{ description: "Monthly pool service", quantity: "1", unitPrice: customer.monthlyRate.toString() }])
      }
      if (!initialDueDate) {
        setDueDate(calcDueDate(customer.dueDays ?? defaultDueDays))
      }
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleServiceTypeChange = (type: string) => {
    setServiceType(type)
    if (!isMonthlyType(type)) {
      // Clear auto-filled monthly item when switching to a non-monthly service type
      setItems((prev) => {
        if (prev.length === 1 && prev[0].description === "Monthly pool service") {
          return [{ description: "", quantity: "1", unitPrice: "" }]
        }
        return prev
      })
    } else if (type === "monthly") {
      // Switching back to monthly — re-fill if item is still blank and customer has a rate
      const customer = customers.find((c) => c.id === selectedCustomerId)
      if (customer?.monthlyRate) {
        setItems((prev) => {
          if (prev.length === 1 && prev[0].description === "" && prev[0].unitPrice === "") {
            return [{ description: "Monthly pool service", quantity: "1", unitPrice: customer.monthlyRate!.toString() }]
          }
          return prev
        })
      }
    }
  }

  const handleCustomerChange = (id: string) => {
    setSelectedCustomerId(id)
    const customer = customers.find((c) => c.id === id)
    if (isMonthlyType(serviceType) && customer?.monthlyRate && items[0].description === "" && items[0].unitPrice === "") {
      setItems((prev) => {
        const next = [...prev]
        next[0] = { description: "Monthly pool service", quantity: "1", unitPrice: customer.monthlyRate!.toString() }
        return next
      })
    }
    setDueDate(calcDueDate(customer?.dueDays ?? defaultDueDays))
  }

  const addItem = () => setItems((prev) => [...prev, { description: "", quantity: "1", unitPrice: "" }])
  const removeItem = (i: number) => setItems((prev) => prev.filter((_, idx) => idx !== i))
  const updateItem = (i: number, field: keyof LineItem, value: string) =>
    setItems((prev) => prev.map((item, idx) => (idx === i ? { ...item, [field]: value } : item)))

  const total = items.reduce((sum, item) => {
    return sum + (parseFloat(item.quantity) || 0) * (parseFloat(item.unitPrice) || 0)
  }, 0)

  const selectedCustomer = customers.find((c) => c.id === selectedCustomerId)
  const label = submitLabel ?? (hideCustomerSelect ? "Update Invoice" : "Create Invoice")

  return (
    <form action={formAction} className="space-y-6">
      {/* Customer selector — hidden in edit mode */}
      {!hideCustomerSelect && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Customer *</label>
          {customers.length > 15 ? (
            <CustomerCombobox
              customers={customers}
              defaultCustomerId={defaultCustomerId}
              required
              onChange={(id) => handleCustomerChange(id)}
            />
          ) : (
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
          )}
          {selectedCustomer?.monthlyRate && isMonthlyType(serviceType) && items[0].description === "" && (
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
      )}

      {/* Service Type */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Service Type</label>
        <select
          name="serviceType"
          value={serviceType}
          onChange={(e) => handleServiceTypeChange(e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
        >
          <option value="">Select type…</option>
          {SERVICE_TYPES.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
      </div>

      {/* Due date */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Due Date *</label>
        <input
          name="dueDate"
          type="date"
          required
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
        />
        {selectedCustomer?.dueDays && (
          <p className="text-xs text-gray-400 mt-1">
            Defaulting to {selectedCustomer.dueDays} days (this customer&apos;s setting).
          </p>
        )}
      </div>

      {/* Line items */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Line Items</label>

        <datalist id="service-descriptions">
          {SERVICE_DESCRIPTIONS.map((d) => (
            <option key={d} value={d} />
          ))}
        </datalist>

        <div className="space-y-2">
          <div className="hidden sm:grid grid-cols-12 gap-2 text-xs text-gray-500 px-1">
            <span className="col-span-6">Description</span>
            <span className="col-span-2 text-center">Qty</span>
            <span className="col-span-3">Unit Price</span>
          </div>

          {items.map((item, i) => (
            <div key={i} className="flex flex-col sm:grid sm:grid-cols-12 gap-2">
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
          defaultValue={initialNotes ?? ""}
          placeholder="Payment instructions, thank you note…"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-sky-500 resize-y"
        />
      </div>

      <div className="flex gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : label}
        </Button>
        <Button type="button" variant="secondary" onClick={() => history.back()}>
          Cancel
        </Button>
      </div>
    </form>
  )
}
