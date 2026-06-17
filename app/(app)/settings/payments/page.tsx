import { db } from "@/lib/db"
import { requireOwner } from "@/lib/session"
import { updatePaymentLinks } from "@/lib/actions/company"
import Card, { CardBody, CardHeader } from "@/components/ui/Card"
import Button from "@/components/ui/Button"
import { Banknote, ExternalLink } from "lucide-react"

export const dynamic = "force-dynamic"

export default async function PaymentLinksPage() {
  const { companyId } = await requireOwner()
  const company = await db.company.findUnique({
    where: { id: companyId },
    select: {
      venmoHandle: true,
      paypalHandle: true,
      cashAppHandle: true,
      zellePhone: true,
      zelleEmail: true,
    },
  })
  if (!company) return null

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Payment Links</h1>
        <p className="text-sm text-gray-500 mt-1">
          Configure your payment handles. Customers will see pay buttons on their invoices and in emails.
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Banknote className="w-4 h-4 text-gray-500" />
            <h2 className="font-semibold text-gray-900 text-sm">Payment Handles</h2>
          </div>
        </CardHeader>
        <CardBody>
          <form action={updatePaymentLinks} className="space-y-5">
            {/* Venmo */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full inline-block" style={{ background: "#3D95CE" }} />
                  Venmo Username
                </span>
              </label>
              <div className="flex items-center">
                <span className="inline-flex items-center px-3 py-2 rounded-l-lg border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">@</span>
                <input
                  name="venmoHandle"
                  defaultValue={company.venmoHandle ?? ""}
                  placeholder="yourhandle"
                  className="flex-1 rounded-r-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>
              {company.venmoHandle && (
                <a
                  href={`https://venmo.com/${company.venmoHandle}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-sky-600 hover:underline mt-1"
                >
                  venmo.com/{company.venmoHandle} <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>

            {/* PayPal */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full inline-block" style={{ background: "#009CDE" }} />
                  PayPal.me Username
                </span>
              </label>
              <div className="flex items-center">
                <span className="inline-flex items-center px-3 py-2 rounded-l-lg border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                  paypal.me/
                </span>
                <input
                  name="paypalHandle"
                  defaultValue={company.paypalHandle ?? ""}
                  placeholder="yourhandle"
                  className="flex-1 rounded-r-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>
              {company.paypalHandle && (
                <a
                  href={`https://paypal.me/${company.paypalHandle}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-sky-600 hover:underline mt-1"
                >
                  paypal.me/{company.paypalHandle} <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>

            {/* Cash App */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full inline-block" style={{ background: "#00D54B" }} />
                  Cash App Username
                </span>
              </label>
              <div className="flex items-center">
                <span className="inline-flex items-center px-3 py-2 rounded-l-lg border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">$</span>
                <input
                  name="cashAppHandle"
                  defaultValue={company.cashAppHandle ?? ""}
                  placeholder="yourhandle"
                  className="flex-1 rounded-r-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>
              {company.cashAppHandle && (
                <a
                  href={`https://cash.app/$${company.cashAppHandle}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-sky-600 hover:underline mt-1"
                >
                  cash.app/${company.cashAppHandle} <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>

            {/* Zelle */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full inline-block" style={{ background: "#6D1ED4" }} />
                  Zelle
                </span>
              </label>
              <p className="text-xs text-gray-400 mb-2">Zelle doesn&apos;t support payment links — customers will be shown your phone or email to send to.</p>
              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Phone</label>
                  <input
                    name="zellePhone"
                    type="tel"
                    defaultValue={company.zellePhone ?? ""}
                    placeholder="(555) 000-0000"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Email</label>
                  <input
                    name="zelleEmail"
                    type="email"
                    defaultValue={company.zelleEmail ?? ""}
                    placeholder="you@example.com"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>
            </div>

            <Button type="submit">Save Payment Links</Button>
          </form>
        </CardBody>
      </Card>

      <Card>
        <CardBody>
          <p className="text-xs text-gray-500 leading-relaxed">
            <strong className="text-gray-700">How it works:</strong> When you send an invoice email, customers will see branded pay buttons for each method you&apos;ve configured. The buttons pre-fill the invoice amount and reference number so the customer doesn&apos;t have to type anything. You still record payments manually in PoolOS once received.
          </p>
        </CardBody>
      </Card>
    </div>
  )
}
