import type { Metadata } from "next"
import { auth } from "@/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import {
  CalendarDays,
  FileText,
  Beaker,
  LayoutDashboard,
  Camera,
  BarChart3,
  CheckCircle2,
  ChevronRight,
  Waves,
  Star,
  MessageSquare,
  Zap,
  CreditCard,
} from "lucide-react"
import MarketingNav from "@/components/marketing/MarketingNav"
import MarketingFooter from "@/components/marketing/MarketingFooter"
import PricingSection from "@/components/marketing/PricingSection"
import { getPlansFromDb } from "@/lib/plans-db"
import { getActiveBanner } from "@/lib/banners"
import PromoBannerBar from "@/components/PromoBannerBar"
import { db } from "@/lib/db"
import WaitlistFormSection from "@/components/marketing/WaitlistFormSection"

const BASE = process.env.NEXT_PUBLIC_APP_URL ?? "https://poolos.biz"

export const metadata: Metadata = {
  title: "PoolOS — Pool Service Management Software",
  description:
    "Pool service management software for scheduling, invoicing, chemical tracking, and customer communication. Start free for 14 days — no credit card required.",
  alternates: {
    canonical: BASE,
  },
  openGraph: {
    title: "PoolOS — Pool Service Management Software",
    description:
      "Routes, invoicing, chemical tracking, and a customer portal — everything your pool company needs, all in one place.",
    url: BASE,
    type: "website",
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "PoolOS — Pool Service Management Software" }],
  },
  twitter: {
    title: "PoolOS — Pool Service Management Software",
    description:
      "Routes, invoicing, chemical tracking, and a customer portal — everything your pool company needs, all in one place.",
    images: ["/opengraph-image"],
  },
}

const FAQ_ITEMS = [
  {
    q: "What is PoolOS?",
    a: "PoolOS is cloud-based pool service management software built for pool cleaning and maintenance companies. It combines route scheduling, invoicing, chemical tracking, team management, and a customer portal in one place — so you can run your business from your phone.",
  },
  {
    q: "How much does PoolOS cost?",
    a: "PoolOS starts at $49/month for the Starter plan (up to 50 customers). The Pro plan is $99/month for up to 200 customers with unlimited staff, and the Unlimited plan is $199/month with no limits. All plans include a 14-day free trial — no credit card required.",
  },
  {
    q: "Is there a free trial?",
    a: "Yes. Every plan includes a 14-day free trial with full access to all features. No credit card is required to start.",
  },
  {
    q: "Can my technicians log visits from their phones?",
    a: "Yes. Technicians can log pool visits — including chemical readings, photos, and service notes — directly from any smartphone. Customers receive an automatic email summary when service is complete.",
  },
  {
    q: "Do customers need to create an account to use the portal?",
    a: "No. Each customer receives a unique private link to their portal. They can view visit history, chemical readings, pay invoices, and message your team without creating an account or downloading an app.",
  },
  {
    q: "What payment methods does PoolOS support?",
    a: "PoolOS supports online credit and debit card payments via Stripe, as well as Venmo, PayPal, Cash App, and Zelle. You can also enable auto-pay for recurring monthly customers so payments happen automatically.",
  },
]

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "SoftwareApplication",
      name: "PoolOS",
      url: BASE,
      description:
        "Pool service management software for scheduling, invoicing, chemical tracking, and customer communication.",
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web, iOS, Android",
      offers: {
        "@type": "AggregateOffer",
        priceCurrency: "USD",
        lowPrice: "49",
        highPrice: "199",
        offerCount: "3",
      },
    },
    {
      "@type": "Organization",
      name: "PoolOS",
      url: BASE,
      logo: `${BASE}/opengraph-image`,
    },
    {
      "@type": "FAQPage",
      mainEntity: FAQ_ITEMS.map((item) => ({
        "@type": "Question",
        name: item.q,
        acceptedAnswer: { "@type": "Answer", text: item.a },
      })),
    },
  ],
}

export default async function HomePage() {
  const session = await auth()
  if (session?.user) redirect("/dashboard")

  const [allPlans, banner, siteConfigs] = await Promise.all([
    getPlansFromDb(),
    getActiveBanner("marketing"),
    db.siteConfig.findMany({ where: { key: { in: ["hero_video_url", "waitlist_cta"] } } }),
  ])

  const heroVideoUrl = siteConfigs.find((c) => c.key === "hero_video_url")?.value ?? ""
  const waitlistCta  = siteConfigs.find((c) => c.key === "waitlist_cta")?.value  ?? "Join the waitlist"

  function toEmbedUrl(url: string): string | null {
    if (!url) return null
    // YouTube: youtube.com/watch?v=ID or youtu.be/ID
    const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([A-Za-z0-9_-]{11})/)
    if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}`
    // Vimeo: vimeo.com/ID
    const vmMatch = url.match(/vimeo\.com\/(\d+)/)
    if (vmMatch) return `https://player.vimeo.com/video/${vmMatch[1]}`
    return null
  }

  const embedUrl = toEmbedUrl(heroVideoUrl)
  const paidPlans = allPlans.filter((p) => p.id !== "trial")

  return (
    <div className="min-h-screen bg-white text-gray-900">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <MarketingNav />
      {banner && <PromoBannerBar banner={banner} />}
      <main>

      {/* ── Hero ───────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-b from-white to-sky-50 pt-12 pb-16 sm:pt-20 sm:pb-24 lg:pt-24 lg:pb-32">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-sky-100/60 blur-3xl" />
          <div className="absolute top-1/2 -left-20 w-64 h-64 rounded-full bg-sky-100/40 blur-2xl" />
        </div>

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
            {/* Copy */}
            <div>
              <div className="inline-flex items-center gap-2 bg-sky-100 text-sky-700 text-xs font-semibold px-3 py-1.5 rounded-full mb-5">
                <Zap className="w-3.5 h-3.5" />
                Now in early access
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-gray-900 leading-tight tracking-tight mb-4 sm:mb-5">
                The smarter way to run your{" "}
                <span className="text-sky-600">pool service business</span>
              </h1>
              <p className="text-base sm:text-lg text-gray-500 leading-relaxed mb-6 sm:mb-8 max-w-lg">
                Routes, invoicing, chemical tracking, and a client portal — everything your team needs to deliver great service and get paid faster.
              </p>

              <div className="flex flex-col sm:flex-row gap-3">
                <Link
                  href="/register"
                  className="inline-flex items-center justify-center gap-2 bg-sky-600 hover:bg-sky-700 text-white font-semibold px-6 py-3.5 rounded-xl transition-colors text-sm"
                >
                  Start free — 14 days, no card needed
                  <ChevronRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center gap-2 border border-gray-200 hover:border-gray-300 text-gray-700 font-semibold px-6 py-3.5 rounded-xl transition-colors text-sm"
                >
                  Sign in to your account
                </Link>
              </div>

              <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2">
                {["No credit card required", "14-day free trial", "Cancel anytime"].map((t) => (
                  <span key={t} className="flex items-center gap-1.5 text-xs text-gray-400">
                    <CheckCircle2 className="w-3.5 h-3.5 text-sky-500 shrink-0" />
                    {t}
                  </span>
                ))}
              </div>
            </div>

            {/* Dashboard mockup — desktop only (lg+) */}
            <div className="hidden lg:block relative">
              <div className="absolute inset-0 bg-sky-200/30 rounded-3xl blur-2xl scale-95 translate-y-4" />
              <div className="relative bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
                {/* Browser chrome */}
                <div className="flex items-center gap-1.5 px-4 py-3 border-b border-gray-100 bg-gray-50">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
                  <div className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
                  <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
                  <div className="flex-1 mx-3 h-5 rounded bg-white border border-gray-200 flex items-center px-2.5">
                    <span className="text-[10px] text-gray-400">poolos.biz/dashboard</span>
                  </div>
                </div>
                <div className="p-4 space-y-4">
                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { label: "Active Customers", value: "47" },
                      { label: "Revenue (MTD)",    value: "$8,240" },
                      { label: "Visits Today",     value: "12" },
                    ].map((s) => (
                      <div key={s.label} className="bg-sky-50 rounded-xl p-3">
                        <p className="text-[9px] text-sky-600 font-medium mb-0.5">{s.label}</p>
                        <p className="text-base font-bold text-gray-900">{s.value}</p>
                      </div>
                    ))}
                  </div>
                  {/* Route */}
                  <div className="bg-gray-50 rounded-xl p-3">
                    <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-2">{"Today's Route"}</p>
                    <div className="space-y-2">
                      {[
                        { name: "Johnson Family",  chem: "Cl 2.1 · pH 7.4", status: "done" },
                        { name: "Martinez Pool",   chem: "Cl 1.8 · pH 7.6", status: "done" },
                        { name: "Williams Estate", chem: "",                  status: "next" },
                        { name: "Chen Residence",  chem: "",                  status: "up"   },
                      ].map((v) => (
                        <div key={v.name} className="flex items-center justify-between gap-2">
                          <div className="min-w-0">
                            <p className="text-xs font-medium text-gray-900 truncate">{v.name}</p>
                            {v.chem && <p className="text-[9px] text-gray-400">{v.chem}</p>}
                          </div>
                          <span className={`shrink-0 text-[9px] font-semibold px-1.5 py-0.5 rounded-full ${
                            v.status === "done" ? "bg-green-100 text-green-700"
                            : v.status === "next" ? "bg-sky-100 text-sky-700"
                            : "bg-gray-100 text-gray-500"
                          }`}>
                            {v.status === "done" ? "Done" : v.status === "next" ? "Up next" : "Later"}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                  {/* Readings */}
                  <div className="grid grid-cols-4 gap-1.5">
                    {[
                      { label: "Cl",  value: "2.1", color: "bg-blue-100 text-blue-700"     },
                      { label: "pH",  value: "7.4", color: "bg-green-100 text-green-700"   },
                      { label: "Alk", value: "95",  color: "bg-orange-100 text-orange-700" },
                      { label: "Ca",  value: "280", color: "bg-purple-100 text-purple-700" },
                    ].map((r) => (
                      <div key={r.label} className={`rounded-lg p-2 ${r.color}`}>
                        <p className="text-[9px] font-medium opacity-80">{r.label}</p>
                        <p className="text-xs font-bold">{r.value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Mobile feature pills — visible only below lg, replaces the mockup */}
            <div className="lg:hidden grid grid-cols-2 gap-3">
              {[
                { icon: CalendarDays, label: "Smart scheduling",     color: "bg-sky-50 text-sky-600 border-sky-100"    },
                { icon: FileText,     label: "Invoicing & payments", color: "bg-green-50 text-green-600 border-green-100" },
                { icon: Beaker,       label: "Chemical tracking",    color: "bg-purple-50 text-purple-600 border-purple-100" },
                { icon: MessageSquare, label: "Customer portal",     color: "bg-amber-50 text-amber-600 border-amber-100"   },
              ].map((f) => (
                <div key={f.label} className={`flex items-center gap-2.5 px-3.5 py-3 rounded-xl border ${f.color}`}>
                  <f.icon className="w-4 h-4 shrink-0" />
                  <span className="text-xs font-medium leading-tight">{f.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Hero Video ─────────────────────────────────────────── */}
      {embedUrl && (
        <section className="py-10 sm:py-14 bg-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="relative w-full" style={{ paddingBottom: "56.25%" }}>
              <iframe
                className="absolute inset-0 w-full h-full rounded-2xl shadow-xl"
                src={embedUrl}
                title="PoolOS demo video"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
        </section>
      )}

      {/* ── Features ───────────────────────────────────────────── */}
      <section id="features" className="py-16 sm:py-24 bg-white scroll-mt-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10 sm:mb-14">
            <h2 className="text-2xl sm:text-4xl font-bold text-gray-900 mb-3 sm:mb-4">Everything in one place</h2>
            <p className="text-base sm:text-lg text-gray-400 max-w-xl mx-auto">
              Stop juggling spreadsheets, paper routes, and separate tools.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {[
              {
                icon: CalendarDays,
                color: "bg-sky-100 text-sky-600",
                title: "Smart Scheduling",
                body: "Build routes by day of the week, track overdue customers, and let your techs see exactly where they're going — all from their phone.",
              },
              {
                icon: FileText,
                color: "bg-green-100 text-green-600",
                title: "Invoicing & Payments",
                body: "Create and send invoices in seconds. Customers pay online via card, Venmo, or Zelle. Set up auto-pay so you never chase a payment again.",
              },
              {
                icon: Beaker,
                color: "bg-purple-100 text-purple-600",
                title: "Chemical Tracking",
                body: "Log chlorine, pH, alkalinity, and calcium with every visit. Trend charts make it easy to spot problem pools before they escalate.",
              },
              {
                icon: LayoutDashboard,
                color: "bg-amber-100 text-amber-600",
                title: "Customer Portal",
                body: "Give every customer a private portal where they can see visit history, chemical readings, invoices, and message your team directly.",
              },
              {
                icon: Camera,
                color: "bg-rose-100 text-rose-600",
                title: "Field Reports",
                body: "Techs log visits with photos, chemical readings, and notes right from their phone. Customers get notified automatically when service is done.",
              },
              {
                icon: BarChart3,
                color: "bg-indigo-100 text-indigo-600",
                title: "Reports & Analytics",
                body: "Revenue reports, aging invoices, chemical trends, and route analytics — the numbers you need to grow your business confidently.",
              },
            ].map((f) => (
              <div
                key={f.title}
                className="p-5 sm:p-6 rounded-2xl border border-gray-100 hover:border-sky-200 hover:shadow-md transition-all bg-white"
              >
                <div className={`inline-flex p-2.5 rounded-xl ${f.color} mb-3 sm:mb-4`}>
                  <f.icon className="w-5 h-5" />
                </div>
                <h3 className="text-sm sm:text-base font-semibold text-gray-900 mb-1.5 sm:mb-2">{f.title}</h3>
                <p className="text-sm text-gray-400 leading-relaxed">{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ───────────────────────────────────────── */}
      <section id="how-it-works" className="py-16 sm:py-24 bg-sky-50 scroll-mt-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10 sm:mb-14">
            <h2 className="text-2xl sm:text-4xl font-bold text-gray-900 mb-3 sm:mb-4">Up and running in minutes</h2>
            <p className="text-base sm:text-lg text-gray-400">No lengthy onboarding, no consultant required.</p>
          </div>

          {/* Mobile: vertical steps */}
          <div className="sm:hidden space-y-6">
            {[
              {
                step: "1",
                title: "Add your customers & routes",
                body: "Import your customer list or add them one by one. Build routes by day of week and set service frequencies per customer.",
              },
              {
                step: "2",
                title: "Techs log visits from the field",
                body: "Your team logs chemical readings, photos, and notes right from their phone. Customers get an automatic email when service is complete.",
              },
              {
                step: "3",
                title: "Invoice and get paid",
                body: "Send invoices with one click. Customers pay online, or set up auto-pay so you never chase a payment again.",
              },
            ].map((s) => (
              <div key={s.step} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="w-10 h-10 rounded-full bg-sky-600 text-white text-base font-bold flex items-center justify-center shrink-0 shadow-md shadow-sky-200">
                    {s.step}
                  </div>
                  {s.step !== "3" && <div className="w-0.5 flex-1 bg-sky-200 mt-2 mb-0 min-h-[2rem]" />}
                </div>
                <div className="pb-6">
                  <h3 className="text-sm font-semibold text-gray-900 mb-1">{s.title}</h3>
                  <p className="text-sm text-gray-400 leading-relaxed">{s.body}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop: horizontal steps */}
          <div className="hidden sm:grid sm:grid-cols-3 gap-10 relative">
            <div className="absolute top-7 left-[calc(16.666%+2rem)] right-[calc(16.666%+2rem)] h-0.5 bg-sky-200" />
            {[
              {
                step: "1",
                title: "Add your customers & routes",
                body: "Import your customer list or add them one by one. Build routes by day of week and set service frequencies per customer.",
              },
              {
                step: "2",
                title: "Techs log visits from the field",
                body: "Your team logs chemical readings, photos, and notes right from their phone. Customers get an automatic email when service is complete.",
              },
              {
                step: "3",
                title: "Invoice and get paid",
                body: "Send invoices with one click. Customers pay online, or set up auto-pay so you never chase a payment again.",
              },
            ].map((s) => (
              <div key={s.step} className="flex flex-col items-center text-center relative">
                <div className="w-14 h-14 rounded-full bg-sky-600 text-white text-xl font-bold flex items-center justify-center mb-5 shrink-0 relative z-10 shadow-lg shadow-sky-200">
                  {s.step}
                </div>
                <h3 className="text-base font-semibold text-gray-900 mb-2">{s.title}</h3>
                <p className="text-sm text-gray-400 leading-relaxed">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Customer portal spotlight ───────────────────────────── */}
      <section className="py-16 sm:py-24 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-10 lg:gap-12 items-center">
            {/* Portal preview */}
            <div className="relative order-2 lg:order-1">
              <div className="absolute inset-0 bg-sky-100/50 rounded-3xl blur-2xl scale-95" />
              <div className="relative bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden max-w-sm mx-auto lg:max-w-none">
                <div className="bg-sky-600 px-5 py-4 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center shrink-0">
                    <Waves className="w-5 h-5 text-white" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-sky-200 font-medium truncate">Sparkling Blue Pool Service</p>
                    <p className="text-sm text-white font-semibold">Johnson Family Portal</p>
                  </div>
                </div>
                <div className="p-4 space-y-3">
                  <div className="flex gap-2 sm:gap-3">
                    {[
                      { label: "Last Visit", value: "Jun 18" },
                      { label: "Balance",    value: "$0.00"  },
                      { label: "Visits YTD", value: "24"     },
                    ].map((s) => (
                      <div key={s.label} className="flex-1 bg-gray-50 rounded-xl p-2.5 sm:p-3">
                        <p className="text-[9px] text-gray-400 font-medium">{s.label}</p>
                        <p className="text-sm font-bold text-gray-900">{s.value}</p>
                      </div>
                    ))}
                  </div>
                  <div className="bg-green-50 border border-green-200 rounded-xl p-3.5">
                    <div className="flex items-start gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-xs font-semibold text-green-800">Service completed · Jun 18</p>
                        <p className="text-[11px] text-green-700 mt-0.5">
                          All chemical readings within normal range. Pool is clean and looking great.
                        </p>
                        <p className="text-[10px] text-green-600 mt-1">Cl 2.1 · pH 7.4 · Alk 95 · Ca 280</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5 p-3.5 border border-gray-100 rounded-xl">
                    <MessageSquare className="w-4 h-4 text-sky-500 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs font-semibold text-gray-700">Message your service team</p>
                      <p className="text-[11px] text-gray-400 mt-0.5">Send a question, request a repair, or just say hi.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Copy */}
            <div className="order-1 lg:order-2">
              <div className="inline-flex items-center gap-2 bg-sky-100 text-sky-700 text-xs font-semibold px-3 py-1.5 rounded-full mb-4 sm:mb-5">
                <Star className="w-3.5 h-3.5" />
                Customer portal included on every plan
              </div>
              <h2 className="text-2xl sm:text-4xl font-bold text-gray-900 leading-tight mb-4 sm:mb-5">
                Give customers a portal they will actually use
              </h2>
              <p className="text-gray-400 leading-relaxed mb-5 sm:mb-6 text-sm sm:text-base">
                Every customer gets a private, branded portal where they can see every service visit, chemical readings, invoices, and message your team — no app download or account creation required.
              </p>
              <ul className="space-y-2.5 sm:space-y-3">
                {[
                  "Full visit history and chemical trend charts",
                  "Pay outstanding invoices online in seconds",
                  "Two-way messaging with your team",
                  "Automatically sent after every completed visit",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-sm text-gray-600">
                    <CheckCircle2 className="w-4 h-4 text-sky-500 mt-0.5 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ── Pricing ────────────────────────────────────────────── */}
      <section id="pricing" className="py-16 sm:py-24 bg-gray-50 scroll-mt-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10 sm:mb-14">
            <h2 className="text-2xl sm:text-4xl font-bold text-gray-900 mb-3 sm:mb-4">Simple, transparent pricing</h2>
            <p className="text-base sm:text-lg text-gray-400">Start free for 14 days. No credit card required.</p>
          </div>

          <PricingSection plans={paidPlans} />

          <p className="text-center text-sm text-gray-400 mt-8">
            All plans include a 14-day free trial. No credit card required to start.
          </p>
        </div>
      </section>

      {/* ── FAQ ────────────────────────────────────────────────── */}
      <section className="py-16 sm:py-24 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10 sm:mb-12">
            <h2 className="text-2xl sm:text-4xl font-bold text-gray-900 mb-3">Frequently asked questions</h2>
            <p className="text-base sm:text-lg text-gray-400">Everything you need to know before you start.</p>
          </div>

          <dl className="space-y-4">
            {FAQ_ITEMS.map((item) => (
              <div key={item.q} className="rounded-2xl border border-gray-100 bg-gray-50 p-5 sm:p-6">
                <dt className="text-sm sm:text-base font-semibold text-gray-900 mb-2">{item.q}</dt>
                <dd className="text-sm text-gray-500 leading-relaxed">{item.a}</dd>
              </div>
            ))}
          </dl>

          <p className="text-center text-sm text-gray-400 mt-8">
            Still have questions?{" "}
            <Link href="/contact" className="text-sky-600 hover:underline">
              Send us a message — we are happy to help.
            </Link>
          </p>
        </div>
      </section>

      {/* ── Waitlist ───────────────────────────────────────────── */}
      <WaitlistFormSection ctaText={waitlistCta} />

      {/* ── Final CTA ──────────────────────────────────────────── */}
      <section className="py-16 sm:py-24 bg-sky-600">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-white/20 flex items-center justify-center mx-auto mb-5 sm:mb-6">
            <CreditCard className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
          </div>
          <h2 className="text-2xl sm:text-4xl font-bold text-white mb-4 sm:mb-5">
            Ready to grow your pool business?
          </h2>
          <p className="text-sky-100 text-base sm:text-lg mb-7 sm:mb-8">
            Join pool professionals already using PoolOS to schedule smarter, invoice faster, and keep customers happy.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/register"
              className="inline-flex items-center justify-center gap-2 bg-white text-sky-600 font-semibold px-7 py-3.5 rounded-xl hover:bg-sky-50 transition-colors"
            >
              Start your free trial
              <ChevronRight className="w-4 h-4" />
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center justify-center gap-2 border border-sky-400 text-white font-semibold px-7 py-3.5 rounded-xl hover:bg-sky-700 transition-colors"
            >
              Sign in
            </Link>
          </div>
          <p className="text-sky-200 text-sm mt-5">14 days free · No credit card · Cancel anytime</p>
        </div>
      </section>

      </main>

      <MarketingFooter />
    </div>
  )
}
