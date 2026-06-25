import { requireSuperAdmin } from "@/lib/session"
import { db } from "@/lib/db"
import { deleteWaitlistEntry } from "@/lib/actions/admin-waitlist"
import { formatDate } from "@/lib/utils"
import { Trash2, Users } from "lucide-react"

export const dynamic = "force-dynamic"

export default async function AdminWaitlistPage() {
  await requireSuperAdmin()

  const entries = await db.waitlistEntry.findMany({ orderBy: { createdAt: "desc" } })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Waitlist</h1>
          <p className="text-sm text-gray-500 mt-1">
            {entries.length} {entries.length === 1 ? "entry" : "entries"} total
          </p>
        </div>
        <div className="flex items-center gap-2 bg-sky-50 text-sky-700 px-4 py-2 rounded-xl">
          <Users className="w-4 h-4" />
          <span className="text-sm font-semibold">{entries.length}</span>
        </div>
      </div>

      {entries.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 px-6 py-12 text-center">
          <p className="text-sm text-gray-400">No waitlist entries yet.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-xs text-gray-500 uppercase tracking-wide">
                  <th className="px-5 py-3 text-left font-medium">Email</th>
                  <th className="px-5 py-3 text-left font-medium">Name</th>
                  <th className="px-5 py-3 text-left font-medium">Source</th>
                  <th className="px-5 py-3 text-left font-medium">Joined</th>
                  <th className="px-5 py-3 text-left font-medium sr-only">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {entries.map((e) => (
                  <tr key={e.id} className="hover:bg-gray-50">
                    <td className="px-5 py-3 font-medium text-gray-900">{e.email}</td>
                    <td className="px-5 py-3 text-gray-600">{e.name ?? <span className="text-gray-300">—</span>}</td>
                    <td className="px-5 py-3 text-gray-500">{e.source ?? <span className="text-gray-300">—</span>}</td>
                    <td className="px-5 py-3 text-gray-400">{formatDate(e.createdAt)}</td>
                    <td className="px-5 py-3">
                      <form
                        action={deleteWaitlistEntry}
                        onSubmit={undefined}
                      >
                        <input type="hidden" name="id" value={e.id} />
                        <button
                          type="submit"
                          title="Delete entry"
                          className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
