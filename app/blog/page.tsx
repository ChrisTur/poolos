import type { Metadata } from "next"
import Link from "next/link"
import { db } from "@/lib/db"
import { formatDate } from "@/lib/utils"
import MarketingNav from "@/components/marketing/MarketingNav"
import MarketingFooter from "@/components/marketing/MarketingFooter"
import { BookOpen } from "lucide-react"

const BASE = process.env.NEXT_PUBLIC_APP_URL ?? "https://poolos.biz"

export const metadata: Metadata = {
  title: "Blog — PoolOS Pool Service Software",
  description: "Tips, guides, and updates from the PoolOS team.",
  alternates: { canonical: `${BASE}/blog` },
}

export default async function BlogListPage() {
  const posts = await db.blogPost.findMany({
    where: { isPublished: true },
    orderBy: { publishedAt: "desc" },
    select: {
      id: true,
      slug: true,
      title: true,
      excerpt: true,
      coverImage: true,
      publishedAt: true,
    },
  })

  return (
    <div className="min-h-screen bg-white text-gray-900">
      <MarketingNav />
      <main>
        <section className="py-16 sm:py-24 bg-gradient-to-b from-white to-sky-50">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h1 className="text-3xl sm:text-5xl font-extrabold text-gray-900 mb-4">Blog</h1>
              <p className="text-base sm:text-lg text-gray-400">Tips, guides, and updates from the PoolOS team.</p>
            </div>

            {posts.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-14 h-14 rounded-2xl bg-sky-100 flex items-center justify-center mx-auto mb-4">
                  <BookOpen className="w-7 h-7 text-sky-600" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">No posts yet</h2>
                <p className="text-gray-400 mb-6">Check back soon for tips and updates.</p>
                <Link
                  href="/"
                  className="inline-flex items-center gap-2 bg-sky-600 text-white font-semibold px-6 py-3 rounded-xl hover:bg-sky-700 transition-colors"
                >
                  Back to home
                </Link>
              </div>
            ) : (
              <div className="space-y-6">
                {posts.map((post) => (
                  <Link
                    key={post.id}
                    href={`/blog/${post.slug}`}
                    className="group block bg-white rounded-2xl border border-gray-100 hover:border-sky-200 hover:shadow-md transition-all overflow-hidden"
                  >
                    {post.coverImage && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={post.coverImage}
                        alt={post.title}
                        className="w-full h-48 object-cover"
                      />
                    )}
                    <div className="p-5 sm:p-6">
                      {post.publishedAt && (
                        <p className="text-xs text-gray-400 mb-2">{formatDate(post.publishedAt)}</p>
                      )}
                      <h2 className="text-base sm:text-lg font-semibold text-gray-900 group-hover:text-sky-700 mb-2 transition-colors">
                        {post.title}
                      </h2>
                      {post.excerpt && (
                        <p className="text-sm text-gray-400 leading-relaxed line-clamp-2">{post.excerpt}</p>
                      )}
                      <p className="text-sm font-semibold text-sky-600 mt-3">Read more →</p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>
      <MarketingFooter />
    </div>
  )
}
