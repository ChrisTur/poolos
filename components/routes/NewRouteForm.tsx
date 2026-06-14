"use client"

import { useActionState } from "react"
import { createRoute } from "@/lib/actions/routes"
import Input from "@/components/ui/Input"
import Select from "@/components/ui/Select"
import Button from "@/components/ui/Button"

const DAY_OPTIONS = [
  { value: "", label: "No fixed day" },
  { value: "0", label: "Sunday" },
  { value: "1", label: "Monday" },
  { value: "2", label: "Tuesday" },
  { value: "3", label: "Wednesday" },
  { value: "4", label: "Thursday" },
  { value: "5", label: "Friday" },
  { value: "6", label: "Saturday" },
]

export default function NewRouteForm() {
  const [, action, pending] = useActionState(async (_: unknown, formData: FormData) => {
    await createRoute(formData)
    return null
  }, null)

  return (
    <form action={action} className="space-y-4">
      <Input id="name" name="name" label="Route Name" placeholder="e.g. Monday North" required />
      <Select id="dayOfWeek" name="dayOfWeek" label="Day of Week" options={DAY_OPTIONS} />
      <Input id="description" name="description" label="Description (optional)" />
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Creating…" : "Create Route"}
      </Button>
    </form>
  )
}
