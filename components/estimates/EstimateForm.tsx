"use client"

import { useState, useActionState } from "react"
import { Plus, Trash2, LayoutTemplate } from "lucide-react"
import Button from "@/components/ui/Button"
import CustomerCombobox from "@/components/ui/CustomerCombobox"
import { formatCurrency } from "@/lib/utils"
import type { Customer } from "@/app/generated/prisma/client"
import { SERVICE_TYPES } from "@/components/invoices/InvoiceForm"

interface LineItem {
  description: string
  quantity: string
  unitPrice: string
}

interface Template {
  id: string
  name: string
  description?: string | null
  items: { description: string; quantity: number; unitPrice: number }[]
}

interface EstimateFormProps {
  action: (formData: FormData) => Promise<void>
  customers: Customer[]
  defaultCustomerId?: string
  hideCustomerSelect?: boolean
  initialValidUntil?: string
  initialNotes?: string
  initialItems?: LineItem[]
  initialServiceType?: string
  submitLabel?: string
  templates?: Template[]
}

function defaultValidUntil() {
  const d = new Date()
  d.setDate(d.getDate() + 30)
  return d.toISOString().split("T")[0]
}

export default function EstimateForm({
  action,
  customers,
  defaultCustomerId,
  hideCustomerSelect = false,
  initialValidUntil,
  initialNotes,
  initialItems,
  initialServiceType,
  submitLabel,
  templates = [],
}: EstimateFormProps) {
  const [items, setItems] = useState<LineItem[]>(
    initialItems ?? [{ description: "", quantity: "1", unitPrice: "" }]
  )
  const [selectedTemplate, setSelectedTemplate] = useState("")

  function loadTemplate(templateId: string) {
    const tpl = templates.find((t) => t.id === templateId)
    if (!tpl) return
    setItems(tpl.items.map((i) => ({
      description: i.description,
      quantity: String(i.quantity),
      unitPrice: String(i.unitPrice),
    })))
    setSelectedTemplate("")
  }

  const [, formAction, pending] = useActionState(async (_: unknown, formData: FormData) => {
    await action(formData)
    return null
  }, null)

  const addItem = () => setItems((prev) => [...prev, { description: "", quantity: "1", unitPrice: "" }])
  const removeItem = (i: number) => setItems((prev) => prev.filter((_, idx) => idx !== i))
  const updateItem = (i: number, field: keyof LineItem, value: string) =>
    setItems((prev) => prev.map((item, idx) => (idx === i ? { ...item, [field]: value } : item)))

  const total = items.reduce((sum, item) => {
    return sum + (parseFloat(item.quantity) || 0) * (parseFloat(item.unitPrice) || 0)
  }, 0)

  const label = submitLabel ?? (hideCustomerSelect ? "Update Estimate" : "Create Estimate")

  return (
    <form action={formAction} className="space-y-6">
      {!hideCustomerSelect && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Customer *</label>
          {customers.length > 15 ? (
            <CustomerCombobox
              customers={customers}
              defaultCustomerId={defaultCustomerId}
              required
              focusRing="amber"
            />
          ) : (
            <select
              name="customerId"
              required
              defaultValue={defaultCustomerId ?? ""}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="">Select customer…</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.firstName} {c.lastName}
                </option>
              ))}
            </select>
          )}
        </div>
      )}

      {/* Service Type */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Service Type *</label>
        <select
          name="serviceType"
          required
          defaultValue={initialServiceType ?? ""}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
        >
          <option value="">Select type…</option>
          {SERVICE_TYPES.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Valid Until</label>
        <input
          name="validUntil"
          type="date"
          defaultValue={initialValidUntil ?? defaultValidUntil()}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
        />
        <p className="text-xs text-gray-400 mt-1">Leave blank if no expiry.</p>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-gray-700">Line Items</label>
          {templates.length > 0 && (
            <div className="flex items-center gap-1.5">
              <LayoutTemplate className="w-3.5 h-3.5 text-gray-400" />
              <select
                value={selectedTemplate}
                onChange={(e) => loadTemplate(e.target.value)}
                className="text-sm text-amber-700 bg-transparent border-none focus:outline-none cursor-pointer"
              >
                <option value="">Load template…</option>
                {templates.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
          )}
        </div>
        <div className="space-y-2">
          <div className="hidden sm:grid grid-cols-12 gap-2 text-xs text-gray-500 px-1">
            <span className="col-span-6">Description</span>
            <span className="col-span-2 text-center">Qty</span>
            <span className="col-span-3">Unit Price</span>
          </div>

          {items.map((item, i) => (
            <div key={i} className="flex flex-col sm:grid sm:grid-cols-12 gap-2">
              <input
                name="description"
                value={item.description}
                onChange={(e) => updateItem(i, "description", e.target.value)}
                placeholder="Description"
                required
                className="sm:col-span-6 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
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
                  className="w-20 sm:w-auto sm:col-span-2 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 text-center focus:outline-none focus:ring-2 focus:ring-amber-500"
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

      <div className="flex justify-end border-t border-gray-100 pt-4">
        <div className="text-right">
          <p className="text-xs text-gray-400 uppercase tracking-wide">Estimate Total</p>
          <p className="text-2xl font-bold text-gray-900">{formatCurrency(total)}</p>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
        <textarea
          name="notes"
          rows={2}
          defaultValue={initialNotes ?? ""}
          placeholder="Scope of work, exclusions, terms…"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-500 resize-y"
        />
      </div>

      <div className="flex gap-3">
        <Button type="submit" disabled={pending} className="bg-amber-600 hover:bg-amber-700 focus:ring-amber-500">
          {pending ? "Saving…" : label}
        </Button>
        <Button type="button" variant="secondary" onClick={() => history.back()}>
          Cancel
        </Button>
      </div>
    </form>
  )
}
