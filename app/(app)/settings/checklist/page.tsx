import { db } from "@/lib/db"
import { requireOwner } from "@/lib/session"
import Card, { CardHeader, CardBody } from "@/components/ui/Card"
import { addChecklistItem, deleteChecklistItem, toggleChecklistItem } from "@/lib/actions/checklist"
import { Plus, ToggleLeft, ToggleRight, ClipboardList, Trash2 } from "lucide-react"
import Button from "@/components/ui/Button"
import ConfirmButton from "@/components/ui/ConfirmButton"

export const dynamic = "force-dynamic"

export default async function ChecklistSettingsPage() {
  const { companyId } = await requireOwner()

  const items = await db.visitChecklistItem.findMany({
    where: { companyId },
    orderBy: { position: "asc" },
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Visit Checklist</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Required items techs must confirm before logging a completed visit.
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <ClipboardList className="w-4 h-4 text-gray-400" />
            <h2 className="font-semibold text-gray-900 text-sm">Checklist Items</h2>
          </div>
          <p className="text-xs text-gray-400">{items.filter(i => i.isActive).length} active</p>
        </CardHeader>
        <CardBody className="space-y-4">
          {items.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">
              No checklist items yet. Add items below — they&apos;ll appear on every completed visit.
            </p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {items.map((item) => {
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
              })}
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

      <div className="rounded-xl bg-sky-50 border border-sky-200 px-4 py-3 text-sm text-sky-800">
        <strong>How it works:</strong> When a tech logs a visit as &quot;Completed&quot;, they must check off every active item before they can submit. Disabled items are hidden from the form.
      </div>
    </div>
  )
}
