"use client"

import { useState } from "react"
import Button from "@/components/ui/Button"

interface PaymentMethod {
  value: string
  label: string
}

interface Props {
  action: (formData: FormData) => Promise<void>
  paymentMethods: PaymentMethod[]
}

export default function MarkPaidButton({ action, paymentMethods }: Props) {
  const [open, setOpen] = useState(false)

  if (!open) {
    return (
      <Button size="sm" onClick={() => setOpen(true)}>
        Mark Paid
      </Button>
    )
  }

  return (
    <form action={action} className="flex items-center gap-1.5 flex-wrap">
      <select
        name="method"
        autoFocus
        className="rounded-lg border border-gray-300 px-2 py-1.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
      >
        <option value="">Method…</option>
        {paymentMethods.map((m) => (
          <option key={m.value} value={m.value}>{m.label}</option>
        ))}
      </select>
      <Button type="submit" size="sm">Confirm Paid</Button>
      <button
        type="button"
        onClick={() => setOpen(false)}
        className="text-sm text-gray-400 hover:text-gray-600 px-1"
      >
        Cancel
      </button>
    </form>
  )
}
