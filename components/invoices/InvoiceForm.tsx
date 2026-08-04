"use client"

import { useState, useEffect } from "react"
import { Sparkles } from "lucide-react"
import Button from "@/components/ui/Button"
import SubmitButton from "@/components/ui/SubmitButton"
import CustomerCombobox from "@/components/ui/CustomerCombobox"
import LineItemEditor, { type LineItem } from "@/components/ui/LineItemEditor"
import type { Customer } from "@/app/generated/prisma/client"

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

  const selectedCustomer = customers.find((c) => c.id === selectedCustomerId)
  const label = submitLabel ?? (hideCustomerSelect ? "Update Invoice" : "Create Invoice")

  return (
    <form action={action} className="space-y-6">
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
        <LineItemEditor
          items={items}
          onAdd={addItem}
          onRemove={removeItem}
          onUpdate={updateItem}
          withServiceDatalist
        />
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
        <SubmitButton label={label} />
        <Button type="button" variant="secondary" onClick={() => history.back()}>
          Cancel
        </Button>
      </div>
    </form>
  )
}
