"use client"

import { useState } from "react"
import { LayoutTemplate } from "lucide-react"
import Button from "@/components/ui/Button"
import SubmitButton from "@/components/ui/SubmitButton"
import CustomerCombobox from "@/components/ui/CustomerCombobox"
import LineItemEditor, { type LineItem } from "@/components/ui/LineItemEditor"
import type { Customer } from "@/app/generated/prisma/client"
import { SERVICE_TYPES } from "@/components/invoices/InvoiceForm"

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

  const addItem = () => setItems((prev) => [...prev, { description: "", quantity: "1", unitPrice: "" }])
  const removeItem = (i: number) => setItems((prev) => prev.filter((_, idx) => idx !== i))
  const updateItem = (i: number, field: keyof LineItem, value: string) =>
    setItems((prev) => prev.map((item, idx) => (idx === i ? { ...item, [field]: value } : item)))

  const label = submitLabel ?? (hideCustomerSelect ? "Update Estimate" : "Create Estimate")

  return (
    <form action={action} className="space-y-6">
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
        <LineItemEditor
          items={items}
          onAdd={addItem}
          onRemove={removeItem}
          onUpdate={updateItem}
          colorScheme="amber"
          totalLabel="Estimate Total"
        />
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
        <SubmitButton label={label} className="bg-amber-600 hover:bg-amber-700 focus:ring-amber-500" />
        <Button type="button" variant="secondary" onClick={() => history.back()}>
          Cancel
        </Button>
      </div>
    </form>
  )
}
