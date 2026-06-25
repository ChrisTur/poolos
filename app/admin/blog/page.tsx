import { requireSuperAdmin } from "@/lib/session"
import { db } from "@/lib/db"
import { togglePublished, deleteBlogPost } from "@/lib/actions/admin-blog"
import Link from "next/link"
import { formatDate } from "@/lib/utils"
import { Plus, Pencil, Trash2, Eye, EyeOff, ExternalLink } from "lucide-react"

export const dynamic = "force-dynamic"

export default async function AdminBlogPage() {
  await requireSuperAdmin()

  const posts = await db.blogPost.findMany({ orderBy: { createdAt: "desc" } })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Blog</h1>
          <p className="text-sm text-gray-500 mt-1">Manage blog posts published on the public /blog page.</p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/blog"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 bg-white border border-gray-200 hover:border-sky-300 text-gray-600 hover:text-sky-700 text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            Preview page
          </Link>
          <Link
            href="/admin/blog/new"
            className="flex items-center gap-2 bg-sky-600 hover:bg-sky-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            New post
          </Link>
        </div>
      </div>

      {posts.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 px-6 py-12 text-center">
          <p className="text-sm text-gray-400 mb-4">No blog posts yet.</p>
          <Link
            href="/admin/blog/new"
            className="inline-flex items-center gap-2 bg-sky-600 text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-sky-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Write your first post
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {posts.map((p) => (
            <div key={p.id} className={`bg-white rounded-2xl border flex items-start gap-4 p-4 ${p.isPublished ? "border-gray-200" : "border-gray-100 opacity-70"}`}>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{p.title}</p>
                <div className="flex items-center gap-3 mt-1 flex-wrap">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${p.isPublished ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                    {p.isPublished ? "Published" : "Draft"}
                  </span>
                  {p.publishedAt && (
                    <span className="text-xs text-gray-400">{formatDate(p.publishedAt)}</span>
                  )}
                  <span className="text-xs text-gray-400 font-mono">/{p.slug}</span>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Link
                  href={`/blog/${p.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 rounded-lg text-gray-400 hover:text-sky-600 hover:bg-sky-50 transition-colors"
                  title="Preview post"
                >
                  <ExternalLink className="w-4 h-4" />
                </Link>
                <form action={togglePublished}>
                  <input type="hidden" name="id" value={p.id} />
                  <button
                    type="submit"
                    title={p.isPublished ? "Unpublish" : "Publish"}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                  >
                    {p.isPublished ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </form>
                <Link
                  href={`/admin/blog/${p.id}`}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                  title="Edit"
                >
                  <Pencil className="w-4 h-4" />
                </Link>
                <form action={deleteBlogPost}>
                  <input type="hidden" name="id" value={p.id} />
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
