import type { Metadata } from "next"
import Link from "next/link"
import { ChevronRight } from "lucide-react"
import MarketingNav from "@/components/marketing/MarketingNav"
import MarketingFooter from "@/components/marketing/MarketingFooter"

const BASE = process.env.NEXT_PUBLIC_APP_URL ?? "https://poolos.biz"

export const metadata: Metadata = {
  title: "Why We Built PoolOS — Our Mission & Story",
  description: "We built PoolOS because pool companies deserve software that evolves at the speed of their business. Here's why.",
  alternates: { canonical: `${BASE}/why` },
  openGraph: {
    title: "Why We Built PoolOS",
    description: "We built PoolOS because pool companies deserve software that evolves at the speed of their business.",
    url: `${BASE}/why`,
    type: "website",
  },
}

export default function WhyPage() {
  return (
    <div className="min-h-screen bg-white text-gray-900">
      <MarketingNav />

      <main>
        {/* ── Hero ── */}
        <section className="py-16 sm:py-24 bg-gradient-to-b from-sky-50 to-white border-b border-gray-100">
          <div className="max-w-2xl mx-auto px-4 sm:px-6 text-center">
            <p className="text-sm font-semibold text-sky-600 uppercase tracking-widest mb-4">Our Story</p>
            <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 leading-tight">
              Why We Built PoolOS
            </h1>
          </div>
        </section>

        {/* ── Body ── */}
        <section className="py-14 sm:py-20">
          <div className="max-w-2xl mx-auto px-4 sm:px-6">
            <div className="prose prose-gray prose-lg max-w-none">

              <p className="text-xl text-gray-600 leading-relaxed">
                Every pool company starts with the same goal: provide great service and grow a successful business. But as they grow, too much of their time is spent on paperwork, scheduling, invoicing, and juggling disconnected tools instead of serving customers.
              </p>

              <p className="text-xl font-semibold text-gray-900 mt-8">
                We don&apos;t think that should be the reality.
              </p>

              <p className="text-xl font-bold text-sky-600 mt-2">
                That&apos;s why we built PoolOS.
              </p>

              <div className="my-10 border-l-4 border-sky-500 pl-6">
                <p className="text-lg font-semibold text-gray-900 mb-1">Our mission is simple:</p>
                <p className="text-xl text-gray-700 italic">
                  Help pool companies grow by delivering the technology they need faster than anyone else.
                </p>
              </div>

              <p className="text-gray-600 leading-relaxed">
                For too long, software in the service industry has evolved slowly. Owners submit feature requests and wait months or even years for updates. Meanwhile, their businesses continue to change, and their software struggles to keep up.
              </p>

              <p className="text-lg font-semibold text-gray-900 mt-8">
                We believe software should evolve at the speed of the businesses that rely on it.
              </p>

              <p className="text-gray-600 leading-relaxed mt-4">
                Modern engineering practices and AI have changed what&apos;s possible. They allow small, focused teams to build, improve, and deliver features at a pace that was unimaginable just a few years ago.
              </p>

              <p className="text-gray-600 leading-relaxed">
                At PoolOS, we embrace that advantage — not to ship more features for the sake of it, but to solve real problems for the people who trust us to run their businesses.
              </p>

              <div className="my-10 bg-sky-50 border border-sky-100 rounded-2xl px-6 py-7">
                <p className="text-sm font-semibold text-sky-600 uppercase tracking-widest mb-4">Every update should help you:</p>
                <ul className="space-y-2.5">
                  {[
                    "Save time.",
                    "Serve customers better.",
                    "Get paid faster.",
                    "Reduce manual work.",
                    "Grow with confidence.",
                  ].map((item) => (
                    <li key={item} className="flex items-center gap-3">
                      <div className="w-5 h-5 rounded-full bg-sky-500 flex items-center justify-center shrink-0">
                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 12 12" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2 6l3 3 5-5" />
                        </svg>
                      </div>
                      <span className="text-base font-medium text-gray-800">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <p className="text-gray-600 leading-relaxed">
                We don&apos;t measure success by the number of features we build. We measure it by the impact those features have on your business.
              </p>

              <hr className="my-10 border-gray-100" />

              <p className="text-sm font-semibold text-sky-600 uppercase tracking-widest mb-4">Our Vision</p>

              <p className="text-xl font-bold text-gray-900">
                Our vision is bigger than creating pool management software.
              </p>

              <p className="text-2xl font-extrabold text-sky-600 mt-4 leading-snug">
                We are building the operating system for modern pool companies.
              </p>

              <div className="mt-8 space-y-4">
                {[
                  "A platform that grows with your business.",
                  "A platform that listens to its customers.",
                  "A platform that continuously improves because your business never stands still.",
                ].map((line) => (
                  <p key={line} className="text-lg text-gray-700 font-medium flex items-start gap-3">
                    <span className="mt-1.5 block w-1.5 h-1.5 rounded-full bg-sky-500 shrink-0" />
                    {line}
                  </p>
                ))}
              </div>

              <p className="text-gray-600 leading-relaxed mt-8">
                As technology continues to evolve, so will PoolOS. Our commitment is simple: we&apos;ll keep investing in innovation so you can keep investing in your business.
              </p>

              <p className="text-gray-600 leading-relaxed">
                Because when pool companies thrive, everyone benefits — from owners and technicians to the families enjoying crystal-clear pools.
              </p>

              <hr className="my-10 border-gray-100" />

              <p className="text-xl font-bold text-gray-900">That&apos;s why we built PoolOS.</p>
              <p className="text-gray-600 mt-2">Not just to manage your business.</p>
              <p className="text-2xl font-extrabold text-sky-600 mt-1">To help you grow it.</p>

            </div>
          </div>
        </section>

        {/* ── CTA ── */}
        <section className="py-14 sm:py-20 bg-sky-600 text-center">
          <div className="max-w-xl mx-auto px-4 sm:px-6">
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">Ready to run your business on PoolOS?</h2>
            <p className="text-sky-100 mb-7 text-sm sm:text-base">14-day free trial. No credit card required.</p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/register"
                className="inline-flex items-center gap-2 bg-white text-sky-600 font-semibold px-7 py-3.5 rounded-xl hover:bg-sky-50 transition-colors"
              >
                Start free trial
                <ChevronRight className="w-4 h-4" />
              </Link>
              <Link
                href="/features"
                className="inline-flex items-center gap-2 text-sm font-medium text-sky-100 hover:text-white border border-sky-400 hover:border-sky-100 px-7 py-3.5 rounded-xl transition-colors"
              >
                See all features
              </Link>
            </div>
          </div>
        </section>
      </main>

      <MarketingFooter />
    </div>
  )
}
