"use client"

import { useState, useTransition } from "react"
import { addInventoryTransaction } from "@/lib/actions/inventory"
import { Plus, MinusCircle } from "lucide-react"

export default function InventoryTransactionForm({ itemId, unit }: { itemId: string; unit: string }) {
  const [mode, setMode]       = useState<"restock" | "adjustment" | null>(null)
  const [qty, setQty]         = useState("")
  const [note, setNote]       = useState("")
  const [pending, startTransition] = useTransition()

  function handleSubmit() {
    const quantity = parseFloat(qty)
    if (!quantity || isNaN(quantity)) return
    startTransition(async () => {
      await addInventoryTransaction(itemId, mode!, quantity, note || null)
      setMode(null)
      setQty("")
      setNote("")
    })
  }

  if (!mode) {
    return (
      <div className="flex gap-2">
        <button
          onClick={() => setMode("restock")}
          className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-lg border border-green-200 text-green-700 bg-green-50 hover:bg-green-100 transition-colors"
        >
          <Plus className="w-3 h-3" /> Restock
        </button>
        <button
          onClick={() => setMode("adjustment")}
          className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-lg border border-gray-200 text-gray-600 bg-gray-50 hover:bg-gray-100 transition-colors"
        >
          <MinusCircle className="w-3 h-3" /> Adjust
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-wrap gap-2 items-center">
      <span className="text-xs font-medium text-gray-600">
        {mode === "restock" ? "Add stock" : "Adjust (±)"}
      </span>
      <input
        type="number"
        value={qty}
        onChange={(e) => setQty(e.target.value)}
        placeholder={mode === "adjustment" ? "e.g. -5" : "qty"}
        className="w-24 text-xs text-gray-900 placeholder:text-gray-400 rounded-lg border border-gray-300 px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-sky-500"
      />
      <span className="text-xs text-gray-500">{unit}</span>
      <input
        type="text"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Note (optional)"
        className="w-36 text-xs text-gray-900 placeholder:text-gray-400 rounded-lg border border-gray-300 px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-sky-500"
      />
      <button
        onClick={handleSubmit}
        disabled={pending || !qty}
        className="text-xs font-medium px-2.5 py-1.5 rounded-lg bg-sky-600 text-white hover:bg-sky-700 disabled:opacity-50 transition-colors"
      >
        {pending ? "…" : "Save"}
      </button>
      <button
        onClick={() => { setMode(null); setQty(""); setNote("") }}
        className="text-xs text-gray-400 hover:text-gray-600"
      >
        Cancel
      </button>
    </div>
  )
}
