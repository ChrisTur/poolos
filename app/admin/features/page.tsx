import { requireSuperAdmin } from "@/lib/session"
import { db } from "@/lib/db"
import { toggleFeatureActive, deleteFeature } from "@/lib/actions/admin-features"
import Link from "next/link"
import { Plus, Pencil, Eye, EyeOff, Trash2 } from "lucide-react"

export const dynamic = "force-dynamic"

export default async function AdminFeaturesPage() {
  await requireSuperAdmin()

  const features = await db.featureItem.findMany({ orderBy: { position: "asc" } })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Features</h1>
          <p className="text-sm text-gray-500 mt-1">Manage feature cards shown on the public /features page.</p>
        </div>
        <Link
          href="/admin/features/new"
          className="flex items-center gap-2 bg-sky-600 hover:bg-sky-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          New feature
        </Link>
      </div>

      {features.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 px-6 py-12 text-center">
          <p className="text-sm text-gray-400 mb-4">No features yet.</p>
          <Link
            href="/admin/features/new"
            className="inline-flex items-center gap-2 bg-sky-600 text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-sky-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Create your first feature
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {features.map((f) => (
            <div
              key={f.id}
              className={`bg-white rounded-2xl border flex items-start gap-4 p-4 ${f.isActive ? "border-gray-200" : "border-gray-100 opacity-60"}`}
            >
              <div className="w-8 h-8 rounded-lg bg-sky-100 text-sky-600 flex items-center justify-center shrink-0 text-sm font-semibold">
                {f.icon ?? "#"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{f.title}</p>
                <p className="text-xs text-gray-400 mt-0.5 truncate">{f.description}</p>
                <div className="flex items-center gap-3 mt-1">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${f.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                    {f.isActive ? "Active" : "Inactive"}
                  </span>
                  <span className="text-xs text-gray-400">Position {f.position}</span>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <form action={toggleFeatureActive}>
                  <input type="hidden" name="id" value={f.id} />
                  <input type="hidden" name="active" value={String(f.isActive)} />
                  <button
                    type="submit"
                    title={f.isActive ? "Deactivate" : "Activate"}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                  >
                    {f.isActive ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </form>
                <Link
                  href={`/admin/features/${f.id}`}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                  title="Edit"
                >
                  <Pencil className="w-4 h-4" />
                </Link>
                <form action={deleteFeature}>
                  <input type="hidden" name="id" value={f.id} />
                  <button
                    type="submit"
                    title="Delete"
                    className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </form>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
