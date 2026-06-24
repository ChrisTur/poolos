"use client"

import { deleteBanner } from "@/lib/actions/admin-banners"
import { Trash2 } from "lucide-react"

export default function DeleteBannerButton({ id }: { id: string }) {
  return (
    <form
      action={deleteBanner}
      onSubmit={(e) => {
        if (!confirm("Delete this banner?")) e.preventDefault()
      }}
    >
      <input type="hidden" name="id" value={id} />
      <button
        type="submit"
        title="Delete"
        className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </form>
  )
}
