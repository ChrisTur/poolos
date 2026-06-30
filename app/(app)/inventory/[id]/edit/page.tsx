import { db } from "@/lib/db"
import { requireSession } from "@/lib/session"
import { notFound } from "next/navigation"
import Link from "next/link"
import { ChevronLeft } from "lucide-react"
import Card, { CardBody, CardHeader } from "@/components/ui/Card"
import Button from "@/components/ui/Button"
import { updateInventoryItem } from "@/lib/actions/inventory"

export const dynamic = "force-dynamic"

const CATEGORIES = [
  { value: "chemical", label: "Chemical" },
  { value: "part",     label: "Part / Equipment" },
  { value: "supply",   label: "Supply" },
  { value: "other",    label: "Other" },
]

const UNITS = ["lb", "lbs", "gal", "oz", "qt", "each", "case", "bag", "tablet", "box", "bottle"]

export default async function EditInventoryItemPage({ params }: { params: Promise<{ id: string }> }) {
  const { companyId } = await requireSession()
  const { id } = await params

  const item = await db.inventoryItem.findFirst({ where: { id, companyId } })
  if (!item) notFound()

  const updateAction = updateInventoryItem.bind(null, id)

  return (
    <div className="max-w-xl space-y-5">
      <div>
        <Link href="/inventory" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900 mb-3">
          <ChevronLeft className="w-4 h-4" /> Inventory
        </Link>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Edit: {item.name}</h1>
        <p className="text-sm text-gray-500 mt-0.5">Current stock: {item.onHand} {item.unit}</p>
      </div>

      <Card>
        <CardHeader><h2 className="font-semibold text-gray-900 text-sm">Item Details</h2></CardHeader>
        <CardBody>
          <form action={updateAction} className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Name <span className="text-red-500">*</span></label>
                <input
                  name="name"
                  required
                  defaultValue={item.name}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select
                  name="category"
                  defaultValue={item.category}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
                <select
                  name="unit"
                  defaultValue={item.unit}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
                >
                  {UNITS.map((u) => (
                    <option key={u} value={u}>{u}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Low Stock Alert At</label>
                <input
                  name="lowStockThreshold"
                  type="number"
                  step="0.01"
                  min="0"
                  defaultValue={item.lowStockThreshold}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reorder Quantity</label>
                <input
                  name="reorderQty"
                  type="number"
                  step="0.01"
                  min="0"
                  defaultValue={item.reorderQty ?? ""}
                  placeholder="Suggested reorder qty"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cost per Unit ($)</label>
                <input
                  name="costPerUnit"
                  type="number"
                  step="0.01"
                  min="0"
                  defaultValue={item.costPerUnit ?? ""}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  name="notes"
                  rows={2}
                  defaultValue={item.notes ?? ""}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                    <input type="hidden" name="isActive" value="false" />
                    <input type="radio" name="isActive" value="true" defaultChecked={item.isActive} className="accent-sky-600" />
                    Active
                  </label>
                  <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                    <input type="radio" name="isActive" value="false" defaultChecked={!item.isActive} className="accent-sky-600" />
                    Archived
                  </label>
                </div>
              </div>
            </div>

            <Button type="submit" className="w-full">Save Changes</Button>
          </form>
        </CardBody>
      </Card>
    </div>
  )
}
