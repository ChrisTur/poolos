"use client"

import { useActionState } from "react"
import Button from "@/components/ui/Button"

export const EXPENSE_CATEGORIES = [
  { value: "chemicals",  label: "Chemicals & Supplies" },
  { value: "equipment",  label: "Equipment & Parts" },
  { value: "labor",      label: "Labor & Subcontractors" },
  { value: "fuel",       label: "Fuel & Vehicle" },
  { value: "supplies",   label: "General Supplies" },
  { value: "office",     label: "Office & Admin" },
  { value: "other",      label: "Other" },
]

interface ExpenseFormProps {
  action: (formData: FormData) => Promise<void>
  initialDate?: string
  initialCategory?: string
  initialDescription?: string
  initialAmount?: string
  initialVendor?: string
  initialNotes?: string
  submitLabel?: string
  vendorNames?: string[]
}

function today() {
  return new Date().toISOString().split("T")[0]
}

export default function ExpenseForm({
  action,
  initialDate,
  initialCategory,
  initialDescription,
  initialAmount,
  initialVendor,
  initialNotes,
  submitLabel = "Save Expense",
  vendorNames = [],
}: ExpenseFormProps) {
  const [, formAction, pending] = useActionState(async (_: unknown, formData: FormData) => {
    await action(formData)
    return null
  }, null)

  return (
    <form action={formAction} className="space-y-5">
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
          <input
            name="date"
            type="date"
            required
            defaultValue={initialDate ?? today()}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
          <select
            name="category"
            required
            defaultValue={initialCategory ?? ""}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
          >
            <option value="">Select category…</option>
            {EXPENSE_CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
        <input
          name="description"
          required
          defaultValue={initialDescription ?? ""}
          placeholder="What was purchased or paid for"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
        />
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Amount *</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
            <input
              name="amount"
              type="number"
              step="0.01"
              min="0.01"
              required
              defaultValue={initialAmount ?? ""}
              placeholder="0.00"
              className="w-full rounded-lg border border-gray-300 pl-7 pr-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Vendor <span className="font-normal text-gray-400">(optional)</span>
          </label>
          {vendorNames.length > 0 && (
            <datalist id="vendor-names">
              {vendorNames.map((n) => <option key={n} value={n} />)}
            </datalist>
          )}
          <input
            name="vendor"
            list={vendorNames.length > 0 ? "vendor-names" : undefined}
            defaultValue={initialVendor ?? ""}
            placeholder="Supplier or vendor name"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Notes <span className="font-normal text-gray-400">(optional)</span>
        </label>
        <textarea
          name="notes"
          rows={2}
          defaultValue={initialNotes ?? ""}
          placeholder="Receipt reference, job this was for, etc."
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-sky-500 resize-y"
        />
      </div>

      <div className="flex gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : submitLabel}
        </Button>
        <Button type="button" variant="secondary" onClick={() => history.back()}>
          Cancel
        </Button>
      </div>
    </form>
  )
}
