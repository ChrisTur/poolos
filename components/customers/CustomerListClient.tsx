"use client"

import { useState } from "react"
import Link from "next/link"
import { Pencil, Trash2, ChevronRight, Mail } from "lucide-react"
import { statusBadge } from "@/components/ui/Badge"
import { formatCurrency, formatPhone } from "@/lib/utils"
import Button from "@/components/ui/Button"
import ConfirmButton from "@/components/ui/ConfirmButton"
import Card from "@/components/ui/Card"
import BroadcastModal from "@/components/customers/BroadcastModal"
import { deleteCustomer } from "@/lib/actions/customers"

type CustomerItem = {
  id: string
  firstName: string
  lastName: string
  email: string | null
  phone: string | null
  address: string
  city: string
  status: string
  monthlyRate: number | null
  tags: { tag: { id: string; name: string; color: string } }[]
  _count: { invoices: number; serviceVisits: number }
}

interface Props {
  customers: CustomerItem[]
  allCustomers: CustomerItem[] // unfiltered — used for "message all"
}

export default function CustomerListClient({ customers, allCustomers }: Props) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [modalCustomers, setModalCustomers] = useState<CustomerItem[] | null>(null)

  const allSelected = customers.length > 0 && customers.every((c) => selectedIds.has(c.id))

  function toggleAll() {
    if (allSelected) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(customers.map((c) => c.id)))
    }
  }

  function toggle(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function openBroadcast() {
    setModalCustomers(allCustomers)
  }

  function openSelected() {
    setModalCustomers(customers.filter((c) => selectedIds.has(c.id)))
  }

  if (customers.length === 0) {
    return (
      <Card>
        <div className="py-16 text-center">
          <p className="text-gray-400 text-sm">No customers found.</p>
          <Link href="/customers/new" className="mt-3 inline-block text-sm text-sky-600 hover:underline">
            Add your first customer
          </Link>
        </div>
      </Card>
    )
  }

  return (
    <>
      {/* Broadcast / message-all row */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-400">{customers.length} shown</p>
        <Button size="sm" variant="secondary" onClick={openBroadcast}>
          <Mail className="w-4 h-4" />
          Message all
        </Button>
      </div>

      {/* Mobile card list */}
      <div className="sm:hidden space-y-2">
        {customers.map((c) => {
          const deleteAction = deleteCustomer.bind(null, c.id)
          const checked = selectedIds.has(c.id)
          return (
            <Card key={c.id} className="p-0 overflow-hidden">
              <div className="flex items-center gap-3 px-4 py-3.5">
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggle(c.id)}
                  className="h-4 w-4 rounded border-gray-300 text-sky-600 focus:ring-sky-500 shrink-0"
                />
                <Link href={`/customers/${c.id}`} className="min-w-0 flex-1">
                  <p className="font-semibold text-gray-900 truncate">{c.firstName} {c.lastName}</p>
                  <p className="text-xs text-gray-400 mt-0.5 truncate">
                    {c.phone ? formatPhone(c.phone) : c.email || c.city}
                  </p>
                  <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                    {statusBadge(c.status)}
                    <span className="text-xs text-gray-400">{c._count.serviceVisits} visits</span>
                    {c.monthlyRate && (
                      <span className="text-xs text-gray-400">{formatCurrency(c.monthlyRate)}/mo</span>
                    )}
                    {c.tags.map(({ tag }) => (
                      <span key={tag.id} className="inline-flex items-center rounded-full px-1.5 py-0.5 text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200">
                        {tag.name}
                      </span>
                    ))}
                  </div>
                </Link>
                <ChevronRight className="w-4 h-4 text-gray-300 shrink-0" />
              </div>
              <div className="flex items-center border-t border-gray-100">
                <Link href={`/customers/${c.id}/edit`} className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium text-gray-500 hover:text-sky-600 hover:bg-sky-50 active:bg-sky-100 transition-colors border-r border-gray-100">
                  <Pencil className="w-3.5 h-3.5" />
                  Edit
                </Link>
                <ConfirmButton action={deleteAction} confirm={`Delete ${c.firstName} ${c.lastName}?`} variant="danger" size="sm" className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium !rounded-none">
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete
                </ConfirmButton>
              </div>
            </Card>
          )
        })}
      </div>

      {/* Desktop table */}
      <Card className="hidden sm:block">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-xs text-gray-500 uppercase tracking-wide">
                <th className="px-5 py-3 text-left w-8">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleAll}
                    className="h-4 w-4 rounded border-gray-300 text-sky-600 focus:ring-sky-500"
                  />
                </th>
                <th className="px-5 py-3 text-left font-medium">Name</th>
                <th className="px-5 py-3 text-left font-medium">Contact</th>
                <th className="px-5 py-3 text-left font-medium hidden md:table-cell">Address</th>
                <th className="px-5 py-3 text-left font-medium hidden lg:table-cell">Rate</th>
                <th className="px-5 py-3 text-left font-medium">Status</th>
                <th className="px-5 py-3 text-left font-medium hidden lg:table-cell">Tags</th>
                <th className="px-5 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {customers.map((c) => {
                const deleteAction = deleteCustomer.bind(null, c.id)
                const checked = selectedIds.has(c.id)
                return (
                  <tr key={c.id} className={`hover:bg-sky-50 transition-colors group ${checked ? "bg-sky-50" : ""}`}>
                    <td className="px-5 py-3">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggle(c.id)}
                        className="h-4 w-4 rounded border-gray-300 text-sky-600 focus:ring-sky-500"
                      />
                    </td>
                    <td className="px-5 py-3">
                      <Link href={`/customers/${c.id}`} className="font-semibold text-sky-700 hover:text-sky-900 hover:underline">
                        {c.firstName} {c.lastName}
                      </Link>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {c._count.serviceVisits} visits · {c._count.invoices} invoices
                      </p>
                    </td>
                    <td className="px-5 py-3 text-gray-600">
                      <p className="truncate max-w-[180px]">{c.email || "—"}</p>
                      <p className="text-gray-400">{c.phone ? formatPhone(c.phone) : ""}</p>
                    </td>
                    <td className="px-5 py-3 hidden md:table-cell text-gray-500 max-w-[200px] truncate">
                      {c.address}, {c.city}
                    </td>
                    <td className="px-5 py-3 hidden lg:table-cell text-gray-600">
                      {c.monthlyRate ? formatCurrency(c.monthlyRate) + "/mo" : "—"}
                    </td>
                    <td className="px-5 py-3">{statusBadge(c.status)}</td>
                    <td className="px-5 py-3 hidden lg:table-cell">
                      <div className="flex flex-wrap gap-1">
                        {c.tags.map(({ tag }) => (
                          <span key={tag.id} className="inline-flex items-center rounded-full px-1.5 py-0.5 text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200">
                            {tag.name}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <Link href={`/customers/${c.id}`}>
                          <button className="p-1.5 rounded-lg text-gray-400 hover:text-sky-600 hover:bg-sky-50 transition-colors" title="View profile">
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </Link>
                        <Link href={`/customers/${c.id}/edit`}>
                          <button className="p-1.5 rounded-lg text-gray-400 hover:text-sky-600 hover:bg-sky-50 transition-colors" title="Edit">
                            <Pencil className="w-4 h-4" />
                          </button>
                        </Link>
                        <ConfirmButton action={deleteAction} confirm={`Delete ${c.firstName} ${c.lastName}?`} variant="danger" size="sm" className="p-1.5">
                          <Trash2 className="w-4 h-4" />
                        </ConfirmButton>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Sticky bulk action bar */}
      {selectedIds.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-3 px-4 py-3 bg-gray-900 text-white rounded-full shadow-xl">
          <span className="text-sm font-medium">{selectedIds.size} selected</span>
          <Button size="sm" onClick={openSelected} className="bg-white text-gray-900 hover:bg-gray-100">
            <Mail className="w-4 h-4" />
            Message
          </Button>
          <button
            onClick={() => setSelectedIds(new Set())}
            className="text-xs text-gray-400 hover:text-white transition-colors"
          >
            Clear
          </button>
        </div>
      )}

      {/* Broadcast / selected message modal */}
      {modalCustomers && (
        <BroadcastModal
          customers={modalCustomers}
          onClose={() => setModalCustomers(null)}
        />
      )}
    </>
  )
}
