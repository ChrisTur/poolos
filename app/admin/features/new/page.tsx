import { requireSuperAdmin } from "@/lib/session"
import { createFeature } from "@/lib/actions/admin-features"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export const dynamic = "force-dynamic"

const inputCls =
  "w-full rounded-xl border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"

export default async function NewFeaturePage() {
  await requireSuperAdmin()

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/admin/features" className="text-gray-400 hover:text-gray-600 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">New feature</h1>
          <p className="text-sm text-gray-500 mt-0.5">Add a feature card to the public /features page.</p>
        </div>
      </div>

      <form action={createFeature} className="space-y-6 max-w-2xl">
        <section className="bg-white rounded-2xl border border-gray-200 p-5 space-y-4">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Content</h2>

          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-600">Title *</label>
            <input type="text" name="title" required placeholder="Smart Scheduling" className={inputCls} />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-600">Description *</label>
            <textarea
              name="description"
              required
              rows={3}
              placeholder="Build routes by day of the week, track overdue customers…"
              className={inputCls}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-600">Icon (lucide name or emoji)</label>
              <input type="text" name="icon" placeholder="Zap" className={inputCls} />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-600">Position</label>
              <input type="number" name="position" defaultValue={0} className={inputCls} />
            </div>
          </div>

          <label className="flex items-start gap-3 cursor-pointer select-none">
            <input
              type="checkbox"
              name="isActive"
              defaultChecked
              className="mt-0.5 w-4 h-4 rounded border-gray-300 text-sky-600 focus:ring-sky-500"
            />
            <span>
              <span className="text-sm font-medium text-gray-700">Active</span>
              <span className="block text-xs text-gray-400 mt-0.5">Show this feature on the public page</span>
            </span>
          </label>
        </section>

        <div className="flex gap-3">
          <button
            type="submit"
            className="bg-sky-600 text-white text-sm font-semibold px-6 py-2.5 rounded-xl hover:bg-sky-700 transition-colors"
          >
            Create feature
          </button>
          <Link
            href="/admin/features"
            className="bg-gray-100 text-gray-700 text-sm font-semibold px-6 py-2.5 rounded-xl hover:bg-gray-200 transition-colors"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  )
}
