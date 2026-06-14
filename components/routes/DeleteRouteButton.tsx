"use client"

import { Trash2 } from "lucide-react"
import Button from "@/components/ui/Button"

export default function DeleteRouteButton({ action }: { action: () => Promise<void> }) {
  return (
    <form action={action}>
      <Button
        type="submit"
        variant="danger"
        size="sm"
        onClick={(e) => { if (!confirm("Delete this route?")) e.preventDefault() }}
      >
        <Trash2 className="w-4 h-4" /> Delete Route
      </Button>
    </form>
  )
}
