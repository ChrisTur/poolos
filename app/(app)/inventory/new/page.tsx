import Link from "next/link"
import { ChevronLeft } from "lucide-react"
import Card, { CardBody, CardHeader } from "@/components/ui/Card"
import Button from "@/components/ui/Button"
import { createInventoryItem } from "@/lib/actions/inventory"

export const dynamic = "force-dynamic"

const CATEGORIES = [
  { value: "chemical", label: "Chemical" },
  { value: "part",     label: "Part / Equipment" },
  { value: "supply",   label: "Supply" },
  { value: "other",    label: "Other" },
]

const UNITS = ["lb", "lbs", "gal", "oz", "qt", "each", "case", "bag", "tablet", "box", "bottle"]

export default function NewInventoryItemPage() {
  return (
    <div className="max-w-xl space-y-5">
      <div>
        <Link href="/inventory" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900 mb-3">
          <ChevronLeft className="w-4 h-4" /> Inventory
        </Link>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Add Inventory Item</h1>
      </div>

      <Card>
        <CardHeader><h2 className="font-semibold text-gray-900 text-sm">Item Details</h2></CardHeader>
        <CardBody>
          <form action={createInventoryItem} className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Name <span className="text-red-500">*</span></label>
                <input
                  name="name"
                  required
                  placeholder="e.g. Trichlor Tablets 50lb"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category <span className="text-red-500">*</span></label>
                <select
                  name="category"
                  required
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Unit <span className="text-red-500">*</span></label>
                <select
                  name="unit"
                  required
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
                >
                  {UNITS.map((u) => (
                    <option key={u} value={u}>{u}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">On Hand</label>
                <input
                  name="onHand"
                  type="number"
                  step="0.01"
                  min="0"
                  defaultValue="0"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Low Stock Alert At</label>
                <input
                  name="lowStockThreshold"
                  type="number"
                  step="0.01"
                  min="0"
                  defaultValue="0"
                  placeholder="0 = no alert"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reorder Quantity</label>
                <input
                  name="reorderQty"
                  type="number"
                  step="0.01"
                  min="0"
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
                  placeholder="0.00"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  name="notes"
                  rows={2}
                  placeholder="Storage location, supplier, brand details…"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>
            </div>

            <Button type="submit" className="w-full">Add Item</Button>
          </form>
        </CardBody>
      </Card>
    </div>
  )
}
