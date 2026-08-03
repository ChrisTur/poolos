"use client"

import { useFormStatus } from "react-dom"
import Button from "@/components/ui/Button"

interface SubmitButtonProps {
  label: string
  className?: string
}

export default function SubmitButton({ label, className }: SubmitButtonProps) {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" disabled={pending} className={className}>
      {pending ? "Saving…" : label}
    </Button>
  )
}
