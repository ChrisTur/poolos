import { db } from "@/lib/db"
import { requireSession } from "@/lib/session"
import Link from "next/link"
import { Plus, Package, AlertTriangle, TrendingDown } from "lucide-react"
import Card, { CardHeader, CardBody } from "@/components/ui/Card"
import Button from "@/components/ui/Button"
import { deleteInventoryItem } from "@/lib/actions/inventory"
import ConfirmButton from "@/components/ui/ConfirmButton"
import { formatCurrency } from "@/lib/utils"
import InventoryTransactionForm from "./InventoryTransactionForm"

export const dynamic = "force-dynamic"

const CATEGORY_LABELS: Record<string, string> = {
  chemical: "Chemical",
  part:     "Part",
  supply:   "Supply",
  other:    "Other",
}

const CATEGORY_COLORS: Record<string, string> = {
  chemical: "bg-blue-50 text-blue-700",
  part:     "bg-orange-50 text-orange-700",
  supply:   "bg-green-50 text-green-700",
  other:    "bg-gray-100 text-gray-600",
}

function stockBadge(onHand: number, threshold: number) {
  if (onHand <= 0)
    return <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-700 bg-red-50 border border-red-200 rounded-full px-2 py-0.5"><TrendingDown className="w-3 h-3" /> Out of stock</span>
  if (threshold > 0 && onHand <= threshold)
    return <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-2 py-0.5"><AlertTriangle className="w-3 h-3" /> Low stock</span>
  return <span className="text-xs font-semibold text-green-700 bg-green-50 border border-green-200 rounded-full px-2 py-0.5">In stock</span>
}

export default async function InventoryPage() {
  const { companyId } = await requireSession()

  const items = await db.inventoryItem.findMany({
    where: { companyId, isActive: true },
    orderBy: [{ category: "asc" }, { name: "asc" }],
    include: {
      transactions: { orderBy: { createdAt: "desc" }, take: 5, include: { createdBy: { select: { firstName: true, lastName: true } } } },
    },
  })

  const outOfStock = items.filter((i) => i.onHand <= 0).length
  const lowStock   = items.filter((i) => i.lowStockThreshold > 0 && i.onHand > 0 && i.onHand <= i.lowStockThreshold).length

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Inventory</h1>
          <p className="text-sm text-gray-500 mt-0.5">{items.length} item{items.length !== 1 ? "s" : ""} tracked</p>
        </div>
        <Link href="/inventory/new">
          <Button size="sm"><Plus className="w-4 h-4" /> Add Item</Button>
        </Link>
      </div>

      {/* Summary strip */}
      {(outOfStock > 0 || lowStock > 0) && (
        <div className="flex gap-3 flex-wrap">
          {outOfStock > 0 && (
            <div className="flex items-center gap-2 rounded-xl bg-red-50 border border-red-200 px-4 py-2.5">
              <TrendingDown className="w-4 h-4 text-red-600 shrink-0" />
              <span className="text-sm font-semibold text-red-800">{outOfStock} out of stock</span>
            </div>
          )}
          {lowStock > 0 && (
            <div className="flex items-center gap-2 rounded-xl bg-amber-50 border border-amber-200 px-4 py-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span className="text-sm font-semibold text-amber-800">{lowStock} low stock</span>
            </div>
          )}
        </div>
      )}

      {items.length === 0 ? (
        <Card>
          <CardBody className="py-16 text-center">
            <Package className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">No inventory items yet.</p>
            <Link href="/inventory/new" className="mt-3 inline-block text-sm text-sky-600 hover:underline">
              Add your first item
            </Link>
          </CardBody>
        </Card>
      ) : (
        <div className="space-y-3">
          {items.map((item) => {
            const deleteAction = deleteInventoryItem.bind(null, item.id)
            const isLow = item.lowStockThreshold > 0 && item.onHand <= item.lowStockThreshold
            const isOut = item.onHand <= 0
            return (
              <Card key={item.id} className={isOut ? "border-red-200" : isLow ? "border-amber-200" : ""}>
                <CardHeader>
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-gray-900 text-sm">{item.name}</h3>
                        <span className={`text-xs font-medium rounded-full px-2 py-0.5 ${CATEGORY_COLORS[item.category] ?? "bg-gray-100 text-gray-600"}`}>
                          {CATEGORY_LABELS[item.category] ?? item.category}
                        </span>
                        {stockBadge(item.onHand, item.lowStockThreshold)}
                      </div>
                      <p className="text-sm text-gray-700 mt-0.5 font-medium">
                        {item.onHand} {item.unit} on hand
                        {item.costPerUnit != null && (
                          <span className="text-gray-400 font-normal ml-2">· {formatCurrency(item.costPerUnit)}/{item.unit}</span>
                        )}
                        {item.lowStockThreshold > 0 && (
                          <span className="text-gray-400 font-normal ml-2">· Alert at {item.lowStockThreshold} {item.unit}</span>
                        )}
                        {item.reorderQty != null && (
                          <span className="text-gray-400 font-normal ml-2">· Reorder {item.reorderQty} {item.unit}</span>
                        )}
                      </p>
                      {item.notes && <p className="text-xs text-gray-500 mt-0.5">{item.notes}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Link href={`/inventory/${item.id}/edit`}>
                      <Button size="sm" variant="secondary">Edit</Button>
                    </Link>
                    <ConfirmButton action={deleteAction} confirm={`Remove "${item.name}" from inventory?`} variant="ghost" size="sm" className="text-gray-300 hover:text-red-500">
                      ✕
                    </ConfirmButton>
                  </div>
                </CardHeader>

                {/* Inline restock / adjustment + recent transactions */}
                <CardBody className="space-y-4 pt-3 border-t border-gray-50">
                  <InventoryTransactionForm itemId={item.id} unit={item.unit} />

                  {item.transactions.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">Recent Activity</p>
                      <div className="space-y-1">
                        {item.transactions.map((tx) => (
                          <div key={tx.id} className="flex items-center justify-between text-xs text-gray-600">
                            <span>
                              <span className={`font-semibold ${tx.quantity >= 0 ? "text-green-600" : "text-red-500"}`}>
                                {tx.quantity >= 0 ? "+" : ""}{tx.quantity} {item.unit}
                              </span>
                              {" "}
                              <span className="text-gray-400">
                                {tx.type === "restock" ? "restocked" : tx.type === "usage" ? "used" : "adjusted"}
                                {tx.createdBy && ` by ${tx.createdBy.firstName}`}
                                {tx.note && ` — ${tx.note}`}
                              </span>
                            </span>
                            <span className="text-gray-300 shrink-0 ml-3">
                              {new Date(tx.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardBody>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
