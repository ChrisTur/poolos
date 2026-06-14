"use client"

import Button from "@/components/ui/Button"
import type { ComponentProps } from "react"

interface Props extends ComponentProps<typeof Button> {
  action: () => Promise<void>
  confirm: string
}

export default function ConfirmButton({ action, confirm: message, children, ...props }: Props) {
  return (
    <form action={action}>
      <Button
        type="submit"
        {...props}
        onClick={(e) => { if (!window.confirm(message)) e.preventDefault() }}
      >
        {children}
      </Button>
    </form>
  )
}
