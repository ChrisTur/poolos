"use client"

import { useActionState } from "react"
import { addStopToRoute } from "@/lib/actions/routes"
import Button from "@/components/ui/Button"
import { Plus } from "lucide-react"
import type { Customer } from "@/app/generated/prisma/client"

export default function AddStopForm({
  routeId,
  customers,
}: {
  routeId: string
  customers: Customer[]
}) {
  const action = addStopToRoute.bind(null, routeId)
  const [, formAction, pending] = useActionState(async (_: unknown, formData: FormData) => {
    await action(formData)
    return null
  }, null)

  return (
    <form action={formAction} className="space-y-3">
      <div>
        <label htmlFor="customerId" className="block text-sm font-medium text-gray-700 mb-1">
          Add Customer
        </label>
        <select
          name="customerId"
          id="customerId"
          required
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
        >
          <option value="">Select customer…</option>
          {customers.map((c) => (
            <option key={c.id} value={c.id}>
              {c.firstName} {c.lastName} — {c.address}
            </option>
          ))}
        </select>
      </div>
      <input
        name="notes"
        placeholder="Stop notes (optional)"
        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
      />
      <Button type="submit" disabled={pending} size="sm" className="w-full">
        <Plus className="w-4 h-4" />
        {pending ? "Adding…" : "Add Stop"}
      </Button>
    </form>
  )
}
