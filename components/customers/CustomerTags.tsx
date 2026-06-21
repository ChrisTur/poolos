"use client"

import { addTagToCustomer, removeTagFromCustomer } from "@/lib/actions/tags"
import type { Tag } from "@/app/generated/prisma/client"

interface CustomerTagsProps {
  customerId: string
  tags: { tag: Tag }[]
  companyTags: Tag[]
}

export default function CustomerTags({ customerId, tags, companyTags }: CustomerTagsProps) {
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
                className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200"
              >
                {tag.name}
                <form action={removeAction} className="inline">
                  <button
                    type="submit"
                    className="opacity-50 hover:opacity-100 transition-opacity leading-none"
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

      <form action={addAction} className="flex items-center gap-2">
        <input type="hidden" name="color" value="#6b7280" />
        <input
          name="tagName"
          list="company-tags"
          placeholder="e.g. VIP, Seasonal…"
          required
          className="rounded-lg border border-gray-300 px-2.5 py-1 text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-500 w-36"
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
