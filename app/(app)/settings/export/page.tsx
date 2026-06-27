import { requirePermission } from "@/lib/session"
import { db } from "@/lib/db"
import Link from "next/link"
import {
  Download, Users, MapPin, CalendarDays, FileText,
  Receipt, Wrench, AlertTriangle, MessageSquare, Tag,
} from "lucide-react"

export const dynamic = "force-dynamic"

const FILES = [
  { icon: Users,          label: "Customers",           file: "customers.csv" },
  { icon: MessageSquare,  label: "Customer Notes",       file: "customer-notes.csv" },
  { icon: MessageSquare,  label: "Customer Messages",    file: "customer-messages.csv" },
  { icon: Tag,            label: "Customer Tags",        file: "customer-tags.csv" },
  { icon: MapPin,         label: "Routes & Stops",       file: "routes.csv + route-stops.csv" },
  { icon: CalendarDays,   label: "Service Visits",       file: "service-visits.csv" },
  { icon: CalendarDays,   label: "Chemical Usage",       file: "chemical-usage.csv" },
  { icon: FileText,       label: "Invoices & Line Items",file: "invoices.csv + invoice-line-items.csv" },
  { icon: Receipt,        label: "Payments",             file: "payments.csv" },
  { icon: FileText,       label: "Estimates",            file: "estimates.csv" },
  { icon: Receipt,        label: "Expenses & Vendors",   file: "expenses.csv + vendors.csv" },
  { icon: Wrench,         label: "Equipment & Service",  file: "equipment.csv + equipment-services.csv" },
  { icon: AlertTriangle,  label: "Issues",               file: "issues.csv" },
]

export default async function ExportPage() {
  const { companyId, companyName } = await requirePermission("data.export")

  const [customerCount, visitCount, invoiceCount] = await Promise.all([
    db.customer.count({ where: { companyId } }),
    db.serviceVisit.count({ where: { customer: { companyId } } }),
    db.invoice.count({ where: { companyId } }),
  ])

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Export Your Data</h1>
        <p className="text-sm text-gray-500 mt-1">
          Download a complete copy of your company data as a ZIP archive of CSV files.
          You can open these in Excel, Google Sheets, or any spreadsheet app.
        </p>
      </div>

      {/* Summary counts */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Customers",      value: customerCount },
          { label: "Service Visits", value: visitCount },
          { label: "Invoices",       value: invoiceCount },
        ].map(({ label, value }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-100 p-4 text-center shadow-sm">
            <p className="text-2xl font-bold text-gray-900">{value.toLocaleString()}</p>
            <p className="text-xs text-gray-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* What's included */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-700">What&apos;s included</h2>
        </div>
        <ul className="divide-y divide-gray-50">
          {FILES.map(({ icon: Icon, label, file }) => (
            <li key={file} className="flex items-center gap-3 px-5 py-3">
              <div className="w-7 h-7 rounded-lg bg-sky-50 flex items-center justify-center shrink-0">
                <Icon className="w-3.5 h-3.5 text-sky-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800">{label}</p>
                <p className="text-xs text-gray-400 font-mono truncate">{file}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* Download button */}
      <div className="bg-sky-50 rounded-2xl border border-sky-100 p-5">
        <p className="text-sm text-sky-800 mb-4">
          The export includes all data for <strong>{companyName}</strong>. No data is deleted
          or modified — this is a read-only snapshot.
        </p>
        <a
          href="/api/export/all"
          download
          className="inline-flex items-center gap-2 bg-sky-600 hover:bg-sky-700 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors"
        >
          <Download className="w-4 h-4" />
          Download ZIP Archive
        </a>
        <p className="text-xs text-sky-600 mt-3">
          Large accounts may take a few seconds to generate.
        </p>
      </div>

      {/* Individual exports */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <h2 className="text-sm font-semibold text-gray-700 mb-3">Export individual files</h2>
        <div className="flex flex-wrap gap-2">
          {[
            { href: "/api/export/customers", label: "Customers" },
            { href: "/api/export/invoices",  label: "Invoices" },
            { href: "/api/export/expenses",  label: "Expenses" },
          ].map(({ href, label }) => (
            <a
              key={href}
              href={href}
              download
              className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-600 border border-gray-200 hover:border-gray-300 hover:text-gray-900 px-3 py-1.5 rounded-lg transition-colors"
            >
              <Download className="w-3 h-3" />
              {label} CSV
            </a>
          ))}
        </div>
      </div>
    </div>
  )
}
