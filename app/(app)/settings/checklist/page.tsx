import { db } from "@/lib/db"
import { requireOwner } from "@/lib/session"
import Card, { CardHeader, CardBody } from "@/components/ui/Card"
import {
  addChecklistItem,
  addCustomerChecklistItem,
  deleteChecklistItem,
  toggleChecklistItem,
} from "@/lib/actions/checklist"
import { Plus, ToggleLeft, ToggleRight, ClipboardList, Trash2, User } from "lucide-react"
import Button from "@/components/ui/Button"
import ConfirmButton from "@/components/ui/ConfirmButton"

export const dynamic = "force-dynamic"

export default async function ChecklistSettingsPage() {
  const { companyId } = await requireOwner()

  const [globalItems, customerItems, customers] = await Promise.all([
    db.visitChecklistItem.findMany({
      where: { companyId, customerId: null },
      orderBy: { position: "asc" },
    }),
    db.visitChecklistItem.findMany({
      where: { companyId, customerId: { not: null } },
      orderBy: { position: "asc" },
      include: { customer: { select: { id: true, firstName: true, lastName: true } } },
    }),
    db.customer.findMany({
      where: { companyId, status: "active" },
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
      select: { id: true, firstName: true, lastName: true },
    }),
  ])

  // Group customer items by customer
  const byCustomer = customerItems.reduce<Record<string, { name: string; items: typeof customerItems }>>((acc, item) => {
    if (!item.customer) return acc
    const key = item.customer.id
    if (!acc[key]) acc[key] = { name: `${item.customer.firstName} ${item.customer.lastName}`, items: [] }
    acc[key].items.push(item)
    return acc
  }, {})

  const itemRow = (item: { id: string; label: string; isActive: boolean }) => {
    const deleteAction = deleteChecklistItem.bind(null, item.id)
    const toggleAction = toggleChecklistItem.bind(null, item.id, !item.isActive)
    return (
      <li key={item.id} className={`flex items-center gap-3 py-3 first:pt-0 last:pb-0 ${!item.isActive ? "opacity-50" : ""}`}>
        <span className="flex-1 text-sm text-gray-800">{item.label}</span>
        <form action={toggleAction}>
          <button
            type="submit"
            title={item.isActive ? "Disable" : "Enable"}
            className="text-gray-400 hover:text-sky-600 transition-colors"
          >
            {item.isActive
              ? <ToggleRight className="w-5 h-5 text-sky-600" />
              : <ToggleLeft className="w-5 h-5" />}
          </button>
        </form>
        <ConfirmButton
          action={deleteAction}
          confirm={`Delete "${item.label}"?`}
          variant="ghost"
          size="sm"
          className="text-gray-300 hover:text-red-500 !px-1 !py-1"
        >
          <Trash2 className="w-4 h-4" />
        </ConfirmButton>
      </li>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Visit Checklist</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Required items techs must confirm before logging a completed visit.
        </p>
      </div>

      {/* Global items */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <ClipboardList className="w-4 h-4 text-gray-400" />
            <h2 className="font-semibold text-gray-900 text-sm">Global Items</h2>
          </div>
          <p className="text-xs text-gray-400">Applies to every visit — {globalItems.filter(i => i.isActive).length} active</p>
        </CardHeader>
        <CardBody className="space-y-4">
          {globalItems.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">
              No global items yet. Add items below — they&apos;ll appear on every completed visit.
            </p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {globalItems.map(itemRow)}
            </ul>
          )}
          <form action={addChecklistItem} className="flex gap-2 pt-2 border-t border-gray-100">
            <input
              name="label"
              required
              placeholder="e.g. Gate locked after service"
              className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
            <Button type="submit" size="sm">
              <Plus className="w-4 h-4" /> Add
            </Button>
          </form>
        </CardBody>
      </Card>

      {/* Customer-specific items */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-gray-400" />
            <h2 className="font-semibold text-gray-900 text-sm">Customer-Specific Items</h2>
          </div>
          <p className="text-xs text-gray-400">Only shown for a particular customer&apos;s visits</p>
        </CardHeader>
        <CardBody className="space-y-6">
          {/* Existing per-customer items */}
          {Object.entries(byCustomer).length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-2">
              No customer-specific items yet.
            </p>
          ) : (
            <div className="space-y-5">
              {Object.entries(byCustomer).map(([, { name, items }]) => (
                <div key={name}>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">{name}</p>
                  <ul className="divide-y divide-gray-100">
                    {items.map(itemRow)}
                  </ul>
                </div>
              ))}
            </div>
          )}

          {/* Add item for a customer */}
          <form action={addCustomerChecklistItem} className="flex flex-col sm:flex-row gap-2 pt-2 border-t border-gray-100">
            <select
              name="customerId"
              required
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-sky-500 sm:w-48"
              defaultValue=""
            >
              <option value="" disabled>Select customer…</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>{c.lastName}, {c.firstName}</option>
              ))}
            </select>
            <input
              name="label"
              required
              placeholder="e.g. Check back gate latch"
              className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
            <Button type="submit" size="sm">
              <Plus className="w-4 h-4" /> Add
            </Button>
          </form>
        </CardBody>
      </Card>

      <div className="rounded-xl bg-sky-50 border border-sky-200 px-4 py-3 text-sm text-sky-800">
        <strong>How it works:</strong> When a tech logs a visit as &quot;Completed&quot;, they must check off every active global item plus any items specific to that customer before they can submit.
      </div>
    </div>
  )
}
