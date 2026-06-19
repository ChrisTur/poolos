"use client"

import { useState, useRef, useEffect, useId } from "react"
import { Search, X } from "lucide-react"

interface Customer {
  id: string
  firstName: string
  lastName: string
  monthlyRate?: number | null
}

interface Props {
  customers: Customer[]
  defaultCustomerId?: string
  name?: string
  required?: boolean
  focusRing?: "sky" | "amber"
  onChange?: (id: string, customer: Customer | null) => void
}

export default function CustomerCombobox({
  customers,
  defaultCustomerId,
  name = "customerId",
  required = false,
  focusRing = "sky",
  onChange,
}: Props) {
  const listId = useId()
  const defaultCustomer = customers.find((c) => c.id === defaultCustomerId) ?? null

  const [query, setQuery] = useState(
    defaultCustomer ? `${defaultCustomer.firstName} ${defaultCustomer.lastName}` : ""
  )
  const [selectedId, setSelectedId] = useState(defaultCustomerId ?? "")
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const ring = focusRing === "amber" ? "focus:ring-amber-500" : "focus:ring-sky-500"

  const filtered = query.trim() === ""
    ? customers.slice(0, 30)
    : customers.filter((c) => {
        const full = `${c.firstName} ${c.lastName}`.toLowerCase()
        return full.includes(query.toLowerCase())
      }).slice(0, 30)

  function select(c: Customer) {
    setSelectedId(c.id)
    setQuery(`${c.firstName} ${c.lastName}`)
    setOpen(false)
    onChange?.(c.id, c)
  }

  function clear() {
    setSelectedId("")
    setQuery("")
    setOpen(false)
    onChange?.("", null)
    inputRef.current?.focus()
  }

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  return (
    <div ref={containerRef} className="relative">
      <input type="hidden" name={name} value={selectedId} />
      {required && <input type="text" required value={selectedId} readOnly className="sr-only" tabIndex={-1} aria-hidden />}

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setSelectedId("")
            setOpen(true)
            onChange?.("", null)
          }}
          onFocus={() => setOpen(true)}
          placeholder="Search customers…"
          autoComplete="off"
          className={`w-full rounded-lg border border-gray-300 pl-9 ${selectedId ? "pr-8" : "pr-3"} py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 ${ring}`}
          aria-expanded={open}
          aria-autocomplete="list"
          aria-controls={listId}
        />
        {selectedId && (
          <button
            type="button"
            onClick={clear}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            tabIndex={-1}
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {open && filtered.length > 0 && (
        <ul
          id={listId}
          role="listbox"
          className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-52 overflow-y-auto"
        >
          {filtered.map((c) => (
            <li
              key={c.id}
              role="option"
              aria-selected={c.id === selectedId}
              onMouseDown={(e) => { e.preventDefault(); select(c) }}
              className={`px-3 py-2 text-sm cursor-pointer flex items-center justify-between ${
                c.id === selectedId ? "bg-sky-50 text-sky-700 font-medium" : "text-gray-900 hover:bg-gray-50"
              }`}
            >
              <span>{c.firstName} {c.lastName}</span>
              {c.monthlyRate != null && (
                <span className="text-xs text-gray-400 ml-2">${c.monthlyRate}/mo</span>
              )}
            </li>
          ))}
        </ul>
      )}

      {open && filtered.length === 0 && query.trim() !== "" && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg px-3 py-2 text-sm text-gray-400">
          No customers found.
        </div>
      )}
    </div>
  )
}
