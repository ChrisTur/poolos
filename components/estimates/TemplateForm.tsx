"use client"

import { useState, useActionState } from "react"
import Button from "@/components/ui/Button"
import LineItemEditor, { type LineItem } from "@/components/ui/LineItemEditor"

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
        <LineItemEditor
          items={items}
          onAdd={addItem}
          onRemove={removeItem}
          onUpdate={updateItem}
          nameSuffix="[]"
          colorScheme="amber"
          totalLabel="Template Total"
          hideTotalWhenZero
        />
      </div>

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
