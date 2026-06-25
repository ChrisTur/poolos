import type { Metadata } from "next"
import Link from "next/link"
import { Waves } from "lucide-react"
import { db } from "@/lib/db"
import MarketingNav from "@/components/marketing/MarketingNav"
import MarketingFooter from "@/components/marketing/MarketingFooter"

const BASE = process.env.NEXT_PUBLIC_APP_URL ?? "https://poolos.biz"

export const metadata: Metadata = {
  title: "Features — PoolOS Pool Service Software",
  description: "Everything your pool service business needs: scheduling, invoicing, chemical tracking, and more.",
  alternates: { canonical: `${BASE}/features` },
}

export default async function FeaturesPage() {
  const features = await db.featureItem.findMany({
    where: { isActive: true },
    orderBy: { position: "asc" },
  })

  return (
    <div className="min-h-screen bg-white text-gray-900">
      <MarketingNav />
      <main>
        <section className="py-16 sm:py-24 bg-gradient-to-b from-white to-sky-50">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12 sm:mb-16">
              <h1 className="text-3xl sm:text-5xl font-extrabold text-gray-900 mb-4">
                Everything in one place
              </h1>
              <p className="text-base sm:text-lg text-gray-400 max-w-xl mx-auto">
                Stop juggling spreadsheets, paper routes, and separate tools. PoolOS brings it all together.
              </p>
            </div>

            {features.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-14 h-14 rounded-2xl bg-sky-100 flex items-center justify-center mx-auto mb-4">
                  <Waves className="w-7 h-7 text-sky-600" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">Features coming soon</h2>
                <p className="text-gray-400 mb-6">We are working on something great. Check back shortly.</p>
                <Link
                  href="/"
                  className="inline-flex items-center gap-2 bg-sky-600 text-white font-semibold px-6 py-3 rounded-xl hover:bg-sky-700 transition-colors"
                >
                  Back to home
                </Link>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {features.map((f) => (
                  <div
                    key={f.id}
                    className="p-5 sm:p-6 rounded-2xl border border-gray-100 hover:border-sky-200 hover:shadow-md transition-all bg-white"
                  >
                    {f.icon && (
                      <div className="inline-flex p-2.5 rounded-xl bg-sky-100 text-sky-600 mb-3 sm:mb-4 text-lg">
                        {f.icon}
                      </div>
                    )}
                    <h3 className="text-sm sm:text-base font-semibold text-gray-900 mb-1.5 sm:mb-2">{f.title}</h3>
                    <p className="text-sm text-gray-400 leading-relaxed">{f.description}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        <section className="py-14 sm:py-20 bg-sky-600 text-center">
          <div className="max-w-xl mx-auto px-4 sm:px-6">
            <h2 className="text-2xl sm:text-4xl font-bold text-white mb-4">Ready to get started?</h2>
            <p className="text-sky-100 mb-6">14-day free trial. No credit card required.</p>
            <Link
              href="/register"
              className="inline-flex items-center gap-2 bg-white text-sky-600 font-semibold px-7 py-3.5 rounded-xl hover:bg-sky-50 transition-colors"
            >
              Start free trial
            </Link>
          </div>
        </section>
      </main>
      <MarketingFooter />
    </div>
  )
}
