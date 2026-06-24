import Link from "next/link"
import { db } from "@/lib/db"
import { toggleBannerActive } from "@/lib/actions/admin-banners"
import DeleteBannerButton from "./DeleteBannerButton"
import { Plus, Pencil, Eye, EyeOff, Globe, AppWindow } from "lucide-react"

export const dynamic = "force-dynamic"

const COLOR_DOT: Record<string, string> = {
  sky:    "bg-sky-500",
  amber:  "bg-amber-400",
  green:  "bg-green-500",
  purple: "bg-purple-500",
}

export default async function AdminBannersPage() {
  const banners = await db.promoBanner.findMany({ orderBy: { createdAt: "desc" } })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Promo Banners</h1>
          <p className="text-sm text-gray-500 mt-1">Manage promotional banners on the marketing site and inside the app.</p>
        </div>
        <Link
          href="/admin/banners/new"
          className="flex items-center gap-2 bg-sky-600 hover:bg-sky-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          New banner
        </Link>
      </div>

      {banners.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 px-6 py-12 text-center">
          <p className="text-sm text-gray-400 mb-4">No banners yet.</p>
          <Link
            href="/admin/banners/new"
            className="inline-flex items-center gap-2 bg-sky-600 text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-sky-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Create your first banner
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {banners.map((b) => (
            <div key={b.id} className={`bg-white rounded-2xl border flex items-start gap-4 p-4 ${b.active ? "border-gray-200" : "border-gray-100 opacity-60"}`}>
              {/* Color dot */}
              <div className={`w-3 h-3 rounded-full mt-1.5 shrink-0 ${COLOR_DOT[b.bgColor] ?? "bg-gray-400"}`} />

              {/* Content */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{b.message}</p>
                <div className="flex items-center gap-3 mt-1 flex-wrap">
                  {b.code && (
                    <span className="font-mono text-xs font-bold bg-gray-100 text-gray-700 px-2 py-0.5 rounded">
                      {b.code}
                    </span>
                  )}
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${b.active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                    {b.active ? "Active" : "Inactive"}
                  </span>
                  {b.showOnMarketing && (
                    <span className="inline-flex items-center gap-1 text-xs text-gray-400">
                      <Globe className="w-3 h-3" /> Marketing
                    </span>
                  )}
                  {b.showInApp && (
                    <span className="inline-flex items-center gap-1 text-xs text-gray-400">
                      <AppWindow className="w-3 h-3" /> In-app (trial)
                    </span>
                  )}
                  {b.expiresAt && (
                    <span className="text-xs text-gray-400">
                      Expires {new Date(b.expiresAt).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 shrink-0">
                <form action={toggleBannerActive}>
                  <input type="hidden" name="id"     value={b.id} />
                  <input type="hidden" name="active" value={String(b.active)} />
                  <button
                    type="submit"
                    title={b.active ? "Deactivate" : "Activate"}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                  >
                    {b.active ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </form>
                <Link
                  href={`/admin/banners/${b.id}`}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                  title="Edit"
                >
                  <Pencil className="w-4 h-4" />
                </Link>
                <DeleteBannerButton id={b.id} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
