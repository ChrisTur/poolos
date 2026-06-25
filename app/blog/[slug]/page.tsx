import type { Metadata } from "next"
import Link from "next/link"
import { db } from "@/lib/db"
import { formatDate } from "@/lib/utils"
import MarketingNav from "@/components/marketing/MarketingNav"
import MarketingFooter from "@/components/marketing/MarketingFooter"
import { notFound } from "next/navigation"
import { ArrowLeft } from "lucide-react"

const BASE = process.env.NEXT_PUBLIC_APP_URL ?? "https://poolos.biz"

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const post = await db.blogPost.findUnique({
    where: { slug, isPublished: true },
    select: { title: true, excerpt: true },
  })
  if (!post) return {}
  return {
    title: `${post.title} — PoolOS Blog`,
    description: post.excerpt ?? undefined,
    alternates: { canonical: `${BASE}/blog/${slug}` },
  }
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params

  const post = await db.blogPost.findUnique({
    where: { slug, isPublished: true },
  })
  if (!post) notFound()

  return (
    <div className="min-h-screen bg-white text-gray-900">
      <MarketingNav />
      <main>
        <article className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-20">
          <Link
            href="/blog"
            className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-700 transition-colors mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            All posts
          </Link>

          {post.coverImage && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={post.coverImage}
              alt={post.title}
              className="w-full rounded-2xl mb-8 object-cover max-h-96"
            />
          )}

          {post.publishedAt && (
            <p className="text-sm text-gray-400 mb-3">{formatDate(post.publishedAt)}</p>
          )}

          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-6 leading-tight">
            {post.title}
          </h1>

          {post.excerpt && (
            <p className="text-base sm:text-lg text-gray-500 mb-8 leading-relaxed border-l-4 border-sky-200 pl-4">
              {post.excerpt}
            </p>
          )}

          <div className="prose prose-gray max-w-none">
            <pre className="whitespace-pre-wrap font-sans text-sm sm:text-base text-gray-700 leading-relaxed">
              {post.content}
            </pre>
          </div>
        </article>

        <section className="py-12 bg-sky-600 text-center">
          <div className="max-w-xl mx-auto px-4 sm:px-6">
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-3">Try PoolOS free for 14 days</h2>
            <p className="text-sky-100 mb-5 text-sm">No credit card required.</p>
            <Link
              href="/register"
              className="inline-flex items-center gap-2 bg-white text-sky-600 font-semibold px-6 py-3 rounded-xl hover:bg-sky-50 transition-colors"
            >
              Start your free trial
            </Link>
          </div>
        </section>
      </main>
      <MarketingFooter />
    </div>
  )
}
