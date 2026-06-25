import { requireSuperAdmin } from "@/lib/session"
import { db } from "@/lib/db"
import { saveSiteConfig } from "@/lib/actions/admin-site-config"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export const dynamic = "force-dynamic"

const inputCls =
  "w-full rounded-xl border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"

export default async function SiteConfigPage() {
  await requireSuperAdmin()

  const configs = await db.siteConfig.findMany()
  const get = (key: string) => configs.find((c) => c.key === key)?.value ?? ""

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/admin" className="text-gray-400 hover:text-gray-600 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Site Config</h1>
          <p className="text-sm text-gray-500 mt-0.5">Marketing landing page settings.</p>
        </div>
      </div>

      <form action={saveSiteConfig} className="space-y-6 max-w-2xl">
        <section className="bg-white rounded-2xl border border-gray-200 p-5 space-y-4">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Hero Video</h2>
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-600">Hero Video URL</label>
            <input
              type="url"
              name="hero_video_url"
              defaultValue={get("hero_video_url")}
              placeholder="https://www.youtube.com/watch?v=dQw4w9WgXcQ"
              className={inputCls}
            />
            <p className="text-xs text-gray-400">Supports YouTube and Vimeo URLs. Leave blank to hide the video embed.</p>
          </div>
        </section>

        <section className="bg-white rounded-2xl border border-gray-200 p-5 space-y-4">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Waitlist</h2>
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-600">Waitlist CTA Text</label>
            <input
              type="text"
              name="waitlist_cta"
              defaultValue={get("waitlist_cta")}
              placeholder="Join the waitlist"
              className={inputCls}
            />
            <p className="text-xs text-gray-400">Button/heading text for the waitlist section on the landing page.</p>
          </div>
        </section>

        <div className="flex gap-3">
          <button
            type="submit"
            className="bg-sky-600 text-white text-sm font-semibold px-6 py-2.5 rounded-xl hover:bg-sky-700 transition-colors"
          >
            Save changes
          </button>
          <Link
            href="/admin"
            className="bg-gray-100 text-gray-700 text-sm font-semibold px-6 py-2.5 rounded-xl hover:bg-gray-200 transition-colors"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  )
}
