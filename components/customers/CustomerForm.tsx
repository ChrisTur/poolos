"use client"

import { useActionState } from "react"
import Input from "@/components/ui/Input"
import Select from "@/components/ui/Select"
import StateSelect from "@/components/ui/StateSelect"
import Textarea from "@/components/ui/Textarea"
import Button from "@/components/ui/Button"
import type { Customer } from "@/app/generated/prisma/client"

interface CustomerFormProps {
  action: (formData: FormData) => Promise<void>
  customer?: Partial<Customer>
  submitLabel?: string
}

export default function CustomerForm({ action, customer, submitLabel = "Save Customer" }: CustomerFormProps) {
  const [, formAction, pending] = useActionState(async (_: unknown, formData: FormData) => {
    await action(formData)
    return null
  }, null)

  return (
    <form action={formAction} className="space-y-6">
      <fieldset className="space-y-4">
        <legend className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Contact</legend>
        <div className="grid sm:grid-cols-2 gap-4">
          <Input id="firstName" name="firstName" label="First Name" defaultValue={customer?.firstName} required />
          <Input id="lastName" name="lastName" label="Last Name" defaultValue={customer?.lastName} required />
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <Input id="email" name="email" label="Email" type="email" defaultValue={customer?.email ?? ""} />
          <Input id="phone" name="phone" label="Phone" type="tel" defaultValue={customer?.phone ?? ""} />
        </div>
      </fieldset>

      <fieldset className="space-y-4">
        <legend className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Service Address</legend>
        <Input id="address" name="address" label="Street Address" defaultValue={customer?.address} required />
        <div className="grid sm:grid-cols-3 gap-4">
          <Input id="city" name="city" label="City" defaultValue={customer?.city} required className="sm:col-span-1" />
          <StateSelect id="state" label="State" defaultValue={customer?.state} required />
          <Input id="zip" name="zip" label="ZIP" defaultValue={customer?.zip} required />
        </div>
      </fieldset>

      <fieldset className="space-y-4">
        <legend className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Pool Details</legend>
        <div className="grid sm:grid-cols-2 gap-4">
          <Select
            id="poolType"
            name="poolType"
            label="Pool Type"
            defaultValue={customer?.poolType ?? ""}
            options={[
              { value: "", label: "Unknown" },
              { value: "chlorine", label: "Chlorine" },
              { value: "saltwater", label: "Saltwater" },
              { value: "bromine", label: "Bromine" },
            ]}
          />
          <Input id="poolSize" name="poolSize" label="Pool Size (gallons)" defaultValue={customer?.poolSize ?? ""} />
        </div>
        <Textarea id="poolNotes" name="poolNotes" label="Pool Notes" defaultValue={customer?.poolNotes ?? ""} />
      </fieldset>

      <fieldset className="space-y-4">
        <legend className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Account</legend>
        <div className="grid sm:grid-cols-2 gap-4">
          <Select
            id="status"
            name="status"
            label="Status"
            defaultValue={customer?.status ?? "active"}
            options={[
              { value: "active", label: "Active" },
              { value: "inactive", label: "Inactive" },
              { value: "suspended", label: "Suspended" },
            ]}
          />
          <Input
            id="monthlyRate"
            name="monthlyRate"
            label="Monthly Rate ($)"
            type="number"
            step="0.01"
            min="0"
            defaultValue={customer?.monthlyRate?.toString() ?? ""}
          />
        </div>
      </fieldset>

      <div className="flex gap-3 pt-2">
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
