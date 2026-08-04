"use client"

import { useActionState, useRef } from "react"
import { createPlatformExpense, type ExpenseFormState } from "@/lib/actions/platform-expenses"
import { Plus, Loader2 } from "lucide-react"

const CATEGORIES = [
  { value: "cloud",   label: "Cloud Computing" },
  { value: "email",   label: "Email Service" },
  { value: "sem",     label: "Search Ads / SEM" },
  { value: "saas",    label: "SaaS Tools" },
  { value: "payroll", label: "Payroll / Contractors" },
  { value: "other",   label: "Other" },
]

const today = new Date().toISOString().slice(0, 10)

export default function AddExpenseForm() {
  const [state, action, pending] = useActionState<ExpenseFormState, FormData>(createPlatformExpense, null)
  const formRef = useRef<HTMLFormElement>(null)

  async function handleAction(formData: FormData) {
    await action(formData)
    formRef.current?.reset()
  }

  return (
    <form ref={formRef} action={handleAction} className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
      <h2 className="font-semibold text-gray-900 text-sm">Add Expense</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        <div className="lg:col-span-1">
          <label className="block text-xs font-medium text-gray-600 mb-1">Date <span className="text-red-500">*</span></label>
          <input
            name="date"
            type="date"
            defaultValue={today}
            required
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
        </div>

        <div className="lg:col-span-1">
          <label className="block text-xs font-medium text-gray-600 mb-1">Category <span className="text-red-500">*</span></label>
          <select
            name="category"
            required
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
          >
            <option value="">Select…</option>
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
        </div>

        <div className="lg:col-span-1">
          <label className="block text-xs font-medium text-gray-600 mb-1">Amount (USD) <span className="text-red-500">*</span></label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
            <input
              name="amount"
              type="number"
              min="0.01"
              step="0.01"
              placeholder="0.00"
              required
              className="w-full rounded-lg border border-gray-300 pl-7 pr-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>
        </div>

        <div className="sm:col-span-2 lg:col-span-2">
          <label className="block text-xs font-medium text-gray-600 mb-1">Description <span className="text-red-500">*</span></label>
          <input
            name="description"
            type="text"
            placeholder="e.g. Vercel Pro plan, Resend 50k emails, Google Ads spend"
            required
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Vendor</label>
          <input
            name="vendor"
            type="text"
            placeholder="e.g. Google, Vercel, AWS"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
        </div>
      </div>

      <div className="flex items-center gap-6 flex-wrap">
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            name="isRecurring"
            value="true"
            className="rounded border-gray-300 text-sky-600 focus:ring-sky-500"
          />
          <span className="text-sm text-gray-700">Recurring</span>
        </label>

        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-700 shrink-0">Frequency</label>
          <select
            name="frequency"
            className="rounded-lg border border-gray-300 px-2 py-1.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
          >
            <option value="monthly">Monthly</option>
            <option value="annual">Annual</option>
          </select>
        </div>
      </div>

      {state?.error && (
        <p className="text-sm text-red-600">{state.error}</p>
      )}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={pending}
          className="inline-flex items-center gap-2 bg-sky-600 hover:bg-sky-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors disabled:opacity-60"
        >
          {pending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
          Add Expense
        </button>
      </div>
    </form>
  )
}
