import { requireSuperAdmin } from "@/lib/session"
import { createBlogPost } from "@/lib/actions/admin-blog"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export const dynamic = "force-dynamic"

const inputCls =
  "w-full rounded-xl border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"

export default async function NewBlogPostPage() {
  await requireSuperAdmin()

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/admin/blog" className="text-gray-400 hover:text-gray-600 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">New post</h1>
          <p className="text-sm text-gray-500 mt-0.5">Write a new blog post for the public /blog page.</p>
        </div>
      </div>

      <form action={createBlogPost} className="space-y-6 max-w-2xl">
        <section className="bg-white rounded-2xl border border-gray-200 p-5 space-y-4">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Content</h2>

          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-600">Title *</label>
            <input type="text" name="title" required placeholder="How to Winterize Your Pool" className={inputCls} />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-600">Slug (auto-generated from title if blank)</label>
            <input type="text" name="slug" placeholder="how-to-winterize-your-pool" className={`${inputCls} font-mono`} />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-600">Excerpt</label>
            <textarea
              name="excerpt"
              rows={2}
              placeholder="A short summary shown in blog list views…"
              className={inputCls}
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-600">Content * (Markdown)</label>
            <textarea
              name="content"
              required
              rows={12}
              placeholder="Write your post content here…"
              className={`${inputCls} font-mono`}
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-600">Cover Image URL</label>
            <input type="url" name="coverImage" placeholder="https://…" className={inputCls} />
          </div>

          <label className="flex items-start gap-3 cursor-pointer select-none">
            <input
              type="checkbox"
              name="isPublished"
              className="mt-0.5 w-4 h-4 rounded border-gray-300 text-sky-600 focus:ring-sky-500"
            />
            <span>
              <span className="text-sm font-medium text-gray-700">Publish immediately</span>
              <span className="block text-xs text-gray-400 mt-0.5">Make this post visible on the public blog</span>
            </span>
          </label>
        </section>

        <div className="flex gap-3">
          <button
            type="submit"
            className="bg-sky-600 text-white text-sm font-semibold px-6 py-2.5 rounded-xl hover:bg-sky-700 transition-colors"
          >
            Create post
          </button>
          <Link
            href="/admin/blog"
            className="bg-gray-100 text-gray-700 text-sm font-semibold px-6 py-2.5 rounded-xl hover:bg-gray-200 transition-colors"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  )
}
