import type { Metadata } from "next"
import Link from "next/link"
import {
  CalendarDays, MapPin, ClipboardList, FlaskConical, Wrench, AlertTriangle,
  FileText, FileEdit, CreditCard, Receipt, BarChart2, TrendingUp, Clock,
  Users, Globe, MessageSquare, Mail, Bell, Star,
  Shield, UserCog, Download, LifeBuoy, ChevronRight,
  Layers, Navigation, GripVertical, KeyRound, History,
  Gauge, Truck, Camera, CalendarPlus, Megaphone,
} from "lucide-react"
import MarketingNav from "@/components/marketing/MarketingNav"
import MarketingFooter from "@/components/marketing/MarketingFooter"

const BASE = process.env.NEXT_PUBLIC_APP_URL ?? "https://poolos.biz"

export const metadata: Metadata = {
  title: "Features — PoolOS Pool Service Software",
  description: "Complete pool service management: scheduling, invoicing, chemical tracking, customer portal, equipment management, and more.",
  alternates: { canonical: `${BASE}/features` },
}

type Feature = { icon: React.ElementType; title: string; description: string }
type Section = { id: string; label: string; heading: string; description: string; color: string; features: Feature[] }

const SECTIONS: Section[] = [
  {
    id: "operations",
    label: "Operations",
    heading: "Run your routes. Log every visit.",
    description: "Everything your team needs in the field — from daily routes to chemical readings to visit checklists.",
    color: "sky",
    features: [
      {
        icon: MapPin,
        title: "Route Management",
        description: "Build daily service routes, order stops, assign technicians, and activate or pause routes by season.",
      },
      {
        icon: CalendarDays,
        title: "Schedule & Calendar",
        description: "Visual weekly and monthly calendar showing all routes and visits. Spot gaps and conflicts at a glance.",
      },
      {
        icon: FlaskConical,
        title: "Chemical Readings",
        description: "Log chlorine, pH, alkalinity, calcium, CYA, and salt per visit. Charts show trend history for every customer.",
      },
      {
        icon: FlaskConical,
        title: "Dosing Calculator",
        description: "Instant chemical recommendations based on pool volume and current readings. Supports chlorine, pH, alkalinity, calcium, CYA, and salt.",
      },
      {
        icon: ClipboardList,
        title: "Visit Checklists",
        description: "Configurable required items techs must confirm before marking a visit complete. Set global items or per-customer requirements.",
      },
      {
        icon: AlertTriangle,
        title: "Issue Tracking",
        description: "Flag leaks, equipment failures, safety hazards, and water quality problems. Track status from open to in-progress to resolved. High-priority issues surface in the notification bell.",
      },
      {
        icon: Layers,
        title: "Job Templates",
        description: "One-click workflows for pool opening, closing, filter clean, acid wash, pump prime, and more. Each template loads a pre-built checklist into the visit form so techs never miss a step.",
      },
      {
        icon: Navigation,
        title: "Route Optimization",
        description: "Auto-sort stops into the shortest drive order with one click. Set a company default start address or let each technician configure their own — with an ad-hoc override per run.",
      },
      {
        icon: GripVertical,
        title: "Drag-and-Drop Scheduling",
        description: "Reorder stops within a route or move them between routes by dragging on desktop or long-pressing on mobile. An unscheduled queue holds customers not yet assigned to a route day.",
      },
      {
        icon: KeyRound,
        title: "Customer Access Notes",
        description: "Store gate codes, dog warnings, key locations, and entry instructions per customer. Shown as a prominent amber banner on the visit form and inline on every route stop card — never buried in general notes.",
      },
      {
        icon: History,
        title: "Water Test History",
        description: "The last 3 chemical readings appear inline on the visit form the moment a customer is selected. Out-of-range values are highlighted red so techs can spot trends before they test.",
      },
      {
        icon: Gauge,
        title: "Route Progress & Mileage Tracking",
        description: "Techs start and complete routes with odometer readings for tax and reimbursement purposes. A live progress bar advances as visits are logged. Add extra stops (fuel, lunch, supply runs) and review the last 5 runs in a per-route mileage log.",
      },
      {
        icon: Truck,
        title: "Vehicle Fleet Management",
        description: "Register your company vehicles with make, model, year, license plate, and starting odometer. Assign a vehicle when starting a route run and track miles driven per vehicle across the mileage report.",
      },
    ],
  },
  {
    id: "equipment",
    label: "Equipment",
    heading: "Track every piece of equipment.",
    description: "A complete equipment registry for every customer with service history, warranty info, and automated overdue alerts.",
    color: "violet",
    features: [
      {
        icon: Wrench,
        title: "Equipment Registry",
        description: "Log pumps, filters, heaters, salt systems, cleaners, lights, and more — with brand, model, serial number, and install date.",
      },
      {
        icon: ClipboardList,
        title: "Service History",
        description: "Record every service event with date, work performed, parts used, labor cost, and assigned technician.",
      },
      {
        icon: Bell,
        title: "Automated Service Reminders",
        description: "Set a service interval (e.g. 90 days) on any piece of equipment. Overdue alerts automatically appear in the notification bell.",
      },
      {
        icon: Shield,
        title: "Warranty Tracking",
        description: "Store warranty expiry dates and provider info per piece. Know when coverage runs out before a customer calls.",
      },
    ],
  },
  {
    id: "billing",
    label: "Billing",
    heading: "Invoice, estimate, and get paid.",
    description: "A full billing suite that moves customers from estimate to invoice to payment without leaving PoolOS.",
    color: "emerald",
    features: [
      {
        icon: FileText,
        title: "Invoicing",
        description: "Create detailed invoices with line items, service types, due dates, and notes. Send via email or share a portal link.",
      },
      {
        icon: FileEdit,
        title: "Estimates with Digital Signatures",
        description: "Build and send estimates. Customers approve with a digital signature from their portal. Accepted estimates can convert directly to invoices.",
      },
      {
        icon: CreditCard,
        title: "Online Payments",
        description: "Customers pay invoices via Stripe from their portal — credit card, debit card, and ACH. Funds deposit to your connected Stripe account.",
      },
      {
        icon: CreditCard,
        title: "Auto-Pay",
        description: "Customers save a card on file and opt into automatic charges. Monthly billing runs itself.",
      },
      {
        icon: Receipt,
        title: "Expense Tracking",
        description: "Log and categorize business expenses. Track vendor relationships and run expense reports by category and date range.",
      },
      {
        icon: FlaskConical,
        title: "Chemical Cost Tracking",
        description: "Log chemicals used per visit — product, quantity, unit cost. See per-visit chemical spend and totals on every report.",
      },
    ],
  },
  {
    id: "portal",
    label: "Customer Portal",
    heading: "Give customers a portal. No app required.",
    description: "Every customer gets a branded private portal — no login or app download needed. Just a link.",
    color: "indigo",
    features: [
      {
        icon: Globe,
        title: "Branded Customer Portal",
        description: "Token-based access — customers click their unique link and land directly in their account. View visit history, chemical readings, invoices, and more.",
      },
      {
        icon: FileText,
        title: "Invoice & Payment History",
        description: "Customers see all invoices, outstanding balances, and past payments. Pay directly from the portal.",
      },
      {
        icon: FileEdit,
        title: "Estimate Approvals",
        description: "Customers review, approve, or decline estimates online and add a digital signature without printing or scanning.",
      },
      {
        icon: MessageSquare,
        title: "Two-Way Messaging",
        description: "Customers reply to messages from your company. Portal replies surface in the notification bell so nothing gets missed.",
      },
      {
        icon: Star,
        title: "Service Ratings",
        description: "Customers rate each completed visit 1–5 stars and leave feedback. Low ratings (1–2) trigger an immediate notification.",
      },
      {
        icon: Camera,
        title: "Full Service History with Photos",
        description: "Customers can browse their complete visit timeline — every visit ever logged, with date, technician, chemical readings, chemicals applied, and a tappable photo gallery. Builds trust and eliminates 'what did you do today?' calls.",
      },
      {
        icon: CalendarPlus,
        title: "Customer Self-Scheduling",
        description: "Customers request an additional visit or service directly from their portal — preferred date, service type, and notes. Requests appear at the top of your schedule queue with one-click confirm or decline.",
      },
    ],
  },
  {
    id: "communication",
    label: "Communication",
    heading: "Keep customers informed.",
    description: "Automated emails, broadcast messages, and a real-time notification center — so your team never misses what matters.",
    color: "amber",
    features: [
      {
        icon: Mail,
        title: "Invoice Emails",
        description: "Send invoices and payment reminders via email with your company name and logo. Bulk overdue reminders with one click.",
      },
      {
        icon: Mail,
        title: "Broadcast Messages",
        description: "Send email messages to all customers, by status, or by tag — for price changes, weather closures, or seasonal announcements.",
      },
      {
        icon: Mail,
        title: "Visit Completion Emails",
        description: "Automatically email customers when a visit is logged. Includes chemical readings, service notes, and a rating link.",
      },
      {
        icon: Bell,
        title: "Notification Center",
        description: "A real-time bell for overdue invoices, portal replies, chemical alerts, chemical trends, equipment due, open issues, low ratings, and incoming visit requests.",
      },
      {
        icon: Megaphone,
        title: "Seasonal Upsell Campaigns",
        description: "One-click email campaigns targeting customers who haven't had a pool opening, closing, or any service in a set period. Built-in presets with a ready-to-send subject and body — just review and send.",
      },
    ],
  },
  {
    id: "analytics",
    label: "Analytics",
    heading: "Know your numbers.",
    description: "Built-in reports that help you understand revenue, performance, and which customers need attention.",
    color: "rose",
    features: [
      {
        icon: BarChart2,
        title: "Revenue Reports",
        description: "Monthly revenue charts, by route, by service type, and by period. Click any bar to drill into the underlying invoices.",
      },
      {
        icon: Clock,
        title: "AR Aging",
        description: "See open balances bucketed by 30, 60, and 90+ days past due. Know exactly who owes what and for how long.",
      },
      {
        icon: MapPin,
        title: "Route Profitability",
        description: "Revenue per route, visits completed, and revenue-per-stop. Identify your most and least efficient routes.",
      },
      {
        icon: TrendingUp,
        title: "Technician Scorecards",
        description: "Per-tech metrics: visits completed, average customer rating, chemical spend per stop, and open issue count.",
      },
      {
        icon: FlaskConical,
        title: "Chemical Trend Alerts",
        description: "Automatically flag customers whose readings have been consistently out of range across 3+ consecutive visits.",
      },
      {
        icon: Download,
        title: "Full Data Export",
        description: "Download all company data as a ZIP of 17 CSV files — customers, visits, invoices, payments, expenses, equipment, and more.",
      },
    ],
  },
  {
    id: "team",
    label: "Team",
    heading: "Manage your team. Control access.",
    description: "Role-based permissions and technician profiles so every team member only sees what they need.",
    color: "teal",
    features: [
      {
        icon: Users,
        title: "Team Members",
        description: "Invite staff with individual logins. Each technician can log visits from any phone or browser — no app required.",
      },
      {
        icon: Shield,
        title: "Role-Based Permissions",
        description: "Built-in roles for Owner, Supervisor, and Technician. Each role controls which sidebar sections, pages, and actions are available.",
      },
      {
        icon: UserCog,
        title: "Custom Roles",
        description: "Create additional roles with a custom mix of 26 granular permissions across operations, billing, settings, and support.",
      },
      {
        icon: Shield,
        title: "Technician Assignment",
        description: "Assign specific technicians to routes and individual visits. Auto-fills on the log-visit form for accurate attribution.",
      },
    ],
  },
  {
    id: "platform",
    label: "Platform",
    heading: "Built to scale with your business.",
    description: "Reliability, support, and platform-level tools for growing pool companies.",
    color: "gray",
    features: [
      {
        icon: LifeBuoy,
        title: "In-App Support Tickets",
        description: "Submit support tickets without leaving PoolOS. Threaded replies and status tracking from open to resolved.",
      },
      {
        icon: Bell,
        title: "Customer Tags & Filtering",
        description: "Tag customers for grouping, filtering, and bulk messaging. Filter the customer list by tag, status, or search.",
      },
      {
        icon: Globe,
        title: "Customer Import",
        description: "Bulk import existing customers via CSV. Downloadable template with field mapping included.",
      },
    ],
  },
]

const COLOR_MAP: Record<string, { bg: string; icon: string; pill: string; bar: string }> = {
  sky:     { bg: "bg-sky-50",     icon: "bg-sky-100 text-sky-600",     pill: "bg-sky-100 text-sky-700",     bar: "bg-sky-600" },
  violet:  { bg: "bg-violet-50",  icon: "bg-violet-100 text-violet-600", pill: "bg-violet-100 text-violet-700", bar: "bg-violet-600" },
  emerald: { bg: "bg-emerald-50", icon: "bg-emerald-100 text-emerald-600", pill: "bg-emerald-100 text-emerald-700", bar: "bg-emerald-600" },
  indigo:  { bg: "bg-indigo-50",  icon: "bg-indigo-100 text-indigo-600", pill: "bg-indigo-100 text-indigo-700", bar: "bg-indigo-600" },
  amber:   { bg: "bg-amber-50",   icon: "bg-amber-100 text-amber-600",   pill: "bg-amber-100 text-amber-700",   bar: "bg-amber-500" },
  rose:    { bg: "bg-rose-50",    icon: "bg-rose-100 text-rose-600",     pill: "bg-rose-100 text-rose-700",     bar: "bg-rose-600" },
  teal:    { bg: "bg-teal-50",    icon: "bg-teal-100 text-teal-600",     pill: "bg-teal-100 text-teal-700",     bar: "bg-teal-600" },
  gray:    { bg: "bg-gray-50",    icon: "bg-gray-100 text-gray-600",     pill: "bg-gray-100 text-gray-700",     bar: "bg-gray-600" },
}

export default function FeaturesPage() {
  const totalFeatures = SECTIONS.reduce((s, sec) => s + sec.features.length, 0)

  return (
    <div className="min-h-screen bg-white text-gray-900">
      <MarketingNav />

      <main>
        {/* ── Hero ── */}
        <section className="py-16 sm:py-24 bg-gradient-to-b from-white to-sky-50">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <p className="text-sm font-semibold text-sky-600 uppercase tracking-widest mb-4">Complete Feature Set</p>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-gray-900 mb-5 leading-tight">
              Everything a pool company needs.<br className="hidden sm:block" />
              <span className="text-sky-600"> Nothing it doesn&apos;t.</span>
            </h1>
            <p className="text-base sm:text-lg text-gray-500 max-w-2xl mx-auto mb-8">
              {totalFeatures} features across operations, billing, customer communication, analytics, and team management — built specifically for pool service companies.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/register"
                className="inline-flex items-center gap-2 bg-sky-600 hover:bg-sky-700 text-white font-semibold px-7 py-3.5 rounded-xl transition-colors text-sm"
              >
                Start free trial — 14 days free
                <ChevronRight className="w-4 h-4" />
              </Link>
              <Link
                href="/pricing"
                className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900 border border-gray-200 hover:border-gray-300 px-7 py-3.5 rounded-xl transition-colors"
              >
                See pricing
              </Link>
            </div>
          </div>
        </section>

        {/* ── Sticky category nav ── */}
        <nav className="sticky top-16 z-40 bg-white border-b border-gray-100 shadow-sm">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex overflow-x-auto gap-1 py-2 no-scrollbar">
              {SECTIONS.map((sec) => (
                <a
                  key={sec.id}
                  href={`#${sec.id}`}
                  className="flex-none px-3 py-1.5 text-xs font-semibold text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors whitespace-nowrap"
                >
                  {sec.label}
                </a>
              ))}
            </div>
          </div>
        </nav>

        {/* ── Feature sections ── */}
        {SECTIONS.map((sec, i) => {
          const c = COLOR_MAP[sec.color]
          return (
            <section
              key={sec.id}
              id={sec.id}
              className={`py-16 sm:py-20 ${i % 2 === 1 ? "bg-gray-50" : "bg-white"}`}
            >
              <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="mb-10">
                  <span className={`inline-block text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-3 ${c.pill}`}>
                    {sec.label}
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">{sec.heading}</h2>
                  <p className="text-gray-500 max-w-xl">{sec.description}</p>
                </div>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {sec.features.map((f) => (
                    <div
                      key={f.title}
                      className="p-5 bg-white rounded-2xl border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all"
                    >
                      <div className={`inline-flex p-2.5 rounded-xl mb-3 ${c.icon}`}>
                        <f.icon className="w-5 h-5" />
                      </div>
                      <h3 className="font-semibold text-gray-900 mb-1.5 text-sm">{f.title}</h3>
                      <p className="text-sm text-gray-500 leading-relaxed">{f.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )
        })}

        {/* ── Why CTA ── */}
        <section className="py-14 sm:py-20 bg-white border-t border-gray-100">
          <div className="max-w-2xl mx-auto px-4 sm:px-6 text-center">
            <p className="text-sm font-semibold text-sky-600 uppercase tracking-widest mb-3">Our story</p>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">
              Why we built PoolOS
            </h2>
            <p className="text-gray-500 mb-6">
              Pool software has evolved slowly for too long. We built PoolOS to change that — delivering the features pool companies need at the speed their businesses move.
            </p>
            <Link
              href="/why"
              className="inline-flex items-center gap-2 text-sm font-semibold text-sky-600 hover:text-sky-800 border border-sky-200 hover:border-sky-400 px-6 py-2.5 rounded-xl transition-colors"
            >
              Read our story
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </section>

        {/* ── Final CTA ── */}
        <section className="py-14 sm:py-20 bg-sky-600 text-center">
          <div className="max-w-xl mx-auto px-4 sm:px-6">
            <h2 className="text-2xl sm:text-4xl font-bold text-white mb-4">Ready to get started?</h2>
            <p className="text-sky-100 mb-6 text-sm sm:text-base">14-day free trial. No credit card required.</p>
            <Link
              href="/register"
              className="inline-flex items-center gap-2 bg-white text-sky-600 font-semibold px-7 py-3.5 rounded-xl hover:bg-sky-50 transition-colors"
            >
              Start free trial
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </section>
      </main>

      <MarketingFooter />
    </div>
  )
}
