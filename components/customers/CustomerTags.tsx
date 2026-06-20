"use client"

import { addTagToCustomer, removeTagFromCustomer } from "@/lib/actions/tags"
import { useState } from "react"
import type { Tag } from "@/app/generated/prisma/client"

const PRESET_COLORS = [
  { color: "#6b7280", label: "Gray" },
  { color: "#3b82f6", label: "Blue" },
  { color: "#22c55e", label: "Green" },
  { color: "#ef4444", label: "Red" },
  { color: "#eab308", label: "Yellow" },
  { color: "#a855f7", label: "Purple" },
  { color: "#ec4899", label: "Pink" },
]

interface CustomerTagsProps {
  customerId: string
  tags: { tag: Tag }[]
  companyTags: Tag[]
}

export default function CustomerTags({ customerId, tags, companyTags }: CustomerTagsProps) {
  const [selectedColor, setSelectedColor] = useState("#6b7280")
  const addAction = addTagToCustomer.bind(null, customerId)

  return (
    <div className="space-y-2">
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {tags.map(({ tag }) => {
            const removeAction = removeTagFromCustomer.bind(null, customerId, tag.id)
            return (
              <span
                key={tag.id}
                className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium text-white"
                style={{ backgroundColor: tag.color }}
              >
                {tag.name}
                <form action={removeAction} className="inline">
                  <button
                    type="submit"
                    className="opacity-70 hover:opacity-100 transition-opacity leading-none"
                    title="Remove tag"
                  >
                    ×
                  </button>
                </form>
              </span>
            )
          })}
        </div>
      )}

      <form action={addAction} className="flex items-center gap-2 flex-wrap">
        <input type="hidden" name="color" value={selectedColor} />
        <div className="flex gap-1">
          {PRESET_COLORS.map((p) => (
            <button
              key={p.color}
              type="button"
              title={p.label}
              onClick={() => setSelectedColor(p.color)}
              className="w-4 h-4 rounded-full border-2 transition-transform hover:scale-110"
              style={{
                backgroundColor: p.color,
                borderColor: selectedColor === p.color ? "#000" : "transparent",
              }}
            />
          ))}
        </div>
        <input
          name="tagName"
          list="company-tags"
          placeholder="Add tag…"
          required
          className="rounded-lg border border-gray-300 px-2.5 py-1 text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-500 w-32"
        />
        <datalist id="company-tags">
          {companyTags.map((t) => (
            <option key={t.id} value={t.name} />
          ))}
        </datalist>
        <button
          type="submit"
          className="rounded-lg bg-gray-100 border border-gray-200 text-gray-700 text-xs font-medium px-2.5 py-1 hover:bg-gray-200 transition-colors"
        >
          Add
        </button>
      </form>
    </div>
  )
}
