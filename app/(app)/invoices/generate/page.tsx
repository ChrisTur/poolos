import { db } from "@/lib/db"
import { requireSession } from "@/lib/session"
import { generateMonthlyInvoices } from "@/lib/actions/invoices"
import { sendBulkInvoiceEmails } from "@/lib/actions/emails"
import Card, { CardBody, CardHeader } from "@/components/ui/Card"
import Button from "@/components/ui/Button"
import Link from "next/link"
import { ChevronLeft, Zap, AlertCircle, Info, Mail, CheckCircle } from "lucide-react"
import { formatCurrency } from "@/lib/utils"

export const dynamic = "force-dynamic"

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
]

export default async function GenerateInvoicesPage({
  searchParams,
}: {
  searchParams: Promise<{ result?: string; month?: string; year?: string; count?: string; sent?: string; failed?: string }>
}) {
  const { companyId } = await requireSession()
  const { result, month, year, count, sent, failed } = await searchParams

  const now = new Date()
  const currentMonth = now.getMonth() + 1
  const currentYear = now.getFullYear()

  // Customers eligible for monthly billing
  const eligible = await db.customer.findMany({
    where: { companyId, status: "active", monthlyRate: { not: null, gt: 0 } },
    orderBy: [{ lastName: "asc" }],
    select: { id: true, firstName: true, lastName: true, monthlyRate: true, email: true },
  })

  const totalMonthly = eligible.reduce((s, c) => s + (c.monthlyRate ?? 0), 0)
  const eligibleWithEmail = eligible.filter((c) => !!c.email).length

  // For the bulk send banner: count customers in generated month who have email
  const generatedMonth = month ? parseInt(month) : null
  const generatedYear = year ? parseInt(year) : null
  const generatedCount = count ? parseInt(count) : 0
  const sentCount = sent ? parseInt(sent) : 0
  const failedCount = failed ? parseInt(failed) : 0

  let emailableCount = 0
  if (result === "generated" && generatedMonth && generatedYear) {
    const startOfMonth = new Date(generatedYear, generatedMonth - 1, 1)
    const endOfMonth = new Date(generatedYear, generatedMonth, 0, 23, 59, 59, 999)
    emailableCount = await db.invoice.count({
      where: {
        companyId,
        issuedAt: { gte: startOfMonth, lte: endOfMonth },
        status: { not: "cancelled" },
        customer: { email: { not: null } },
      },
    })
  }

  return (
    <div className="max-w-xl space-y-5">
      <div>
        <Link href="/invoices" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900 mb-3">
          <ChevronLeft className="w-4 h-4" /> Invoices
        </Link>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Generate Monthly Invoices</h1>
        <p className="text-sm text-gray-500 mt-1">
          Create invoices in bulk for all active customers with a monthly rate.
        </p>
      </div>

      {result === "skipped" && (
        <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800 flex gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          All eligible customers already have an invoice for that month.
        </div>
      )}
      {result === "none" && (
        <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800 flex gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          No active customers have a monthly rate set. Add rates on the customer page first.
        </div>
      )}
      {result === "emailed" && (
        <div className="rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-800 flex gap-2">
          <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>
            {sentCount} email{sentCount !== 1 ? "s" : ""} sent successfully.
            {failedCount > 0 && ` ${failedCount} failed — check the Email History on those invoices.`}
          </span>
        </div>
      )}

      {/* Generated success + bulk send */}
      {result === "generated" && generatedMonth && generatedYear && (
        <Card>
          <CardBody className="space-y-3">
            <div className="flex items-start gap-2 text-green-800">
              <CheckCircle className="w-4 h-4 shrink-0 mt-0.5 text-green-600" />
              <span className="text-sm font-medium">
                {generatedCount} invoice{generatedCount !== 1 ? "s" : ""} generated for{" "}
                {MONTHS[generatedMonth - 1]} {generatedYear}.
              </span>
            </div>
            {emailableCount > 0 ? (
              <form action={sendBulkInvoiceEmails} className="flex items-center gap-3 pt-1 border-t border-gray-100">
                <input type="hidden" name="month" value={generatedMonth} />
                <input type="hidden" name="year" value={generatedYear} />
                <Button type="submit" size="sm">
                  <Mail className="w-4 h-4" />
                  Email all {emailableCount} to customers
                </Button>
                <span className="text-xs text-gray-400">
                  {eligible.length - emailableCount > 0
                    ? `${eligible.length - emailableCount} customer${eligible.length - emailableCount !== 1 ? "s" : ""} have no email address.`
                    : "All customers have email addresses."}
                </span>
              </form>
            ) : (
              <p className="text-xs text-gray-400 border-t border-gray-100 pt-2">
                No customers in this batch have email addresses on file.
              </p>
            )}
          </CardBody>
        </Card>
      )}

      {/* Eligible customers preview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-gray-900 text-sm">
              {eligible.length} eligible customer{eligible.length !== 1 ? "s" : ""}
            </h2>
            <span className="text-sm font-semibold text-green-600">{formatCurrency(totalMonthly)} / mo</span>
          </div>
        </CardHeader>
        {eligible.length === 0 ? (
          <CardBody>
            <p className="text-sm text-gray-400">
              No active customers have a monthly rate. Set one on the{" "}
              <Link href="/customers" className="text-sky-600 hover:underline">customer page</Link>.
            </p>
          </CardBody>
        ) : (
          <div className="divide-y divide-gray-50 max-h-60 overflow-y-auto">
            {eligible.map((c) => (
              <div key={c.id} className="flex items-center justify-between px-4 sm:px-5 py-2.5">
                <div>
                  <span className="text-sm text-gray-700">{c.firstName} {c.lastName}</span>
                  {!c.email && <span className="ml-2 text-xs text-gray-400">no email</span>}
                </div>
                <span className="text-sm font-medium text-gray-900">{formatCurrency(c.monthlyRate!)}</span>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Generate form */}
      {eligible.length > 0 && (
        <Card>
          <CardHeader><h2 className="font-semibold text-gray-900 text-sm">Billing period</h2></CardHeader>
          <CardBody>
            <form action={generateMonthlyInvoices} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Month</label>
                  <select
                    name="month"
                    defaultValue={currentMonth}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  >
                    {MONTHS.map((m, i) => (
                      <option key={m} value={i + 1}>{m}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
                  <select
                    name="year"
                    defaultValue={currentYear}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  >
                    {[currentYear - 1, currentYear, currentYear + 1].map((y) => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Due date — day of following month</label>
                <select
                  name="dueDay"
                  defaultValue="15"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
                >
                  {[1, 5, 10, 15, 20, 25, 28].map((d) => (
                    <option key={d} value={d}>{d}{d === 1 ? "st" : d === 5 ? "th" : d <= 3 ? "nd" : "th"} of next month</option>
                  ))}
                </select>
              </div>

              <div className="flex items-start gap-2 rounded-lg bg-sky-50 border border-sky-100 px-3 py-2.5 text-xs text-sky-700">
                <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                Customers who already have an invoice issued in the selected month will be skipped automatically.
                All invoices are created as <strong>Draft</strong> — review and mark as Sent when ready.
                {eligibleWithEmail > 0 && ` ${eligibleWithEmail} customer${eligibleWithEmail !== 1 ? "s" : ""} have email addresses and can be bulk-emailed after generation.`}
              </div>

              <Button type="submit" className="w-full justify-center">
                <Zap className="w-4 h-4" />
                Generate {eligible.length} invoice{eligible.length !== 1 ? "s" : ""}
              </Button>
            </form>
          </CardBody>
        </Card>
      )}
    </div>
  )
}
