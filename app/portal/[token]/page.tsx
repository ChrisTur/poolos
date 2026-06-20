import { db } from "@/lib/db"
import { notFound } from "next/navigation"
import Link from "next/link"
import { formatCurrency, formatDate, invoiceTotal, paymentTotal } from "@/lib/utils"
import { CheckCircle, Clock, AlertCircle, Droplets, MessageCircle } from "lucide-react"
import PortalReplyForm from "@/components/portal/PortalReplyForm"

export const dynamic = "force-dynamic"

const statusConfig = {
  paid:    { label: "Paid",     icon: CheckCircle, color: "text-green-600", bg: "bg-green-50 border-green-200" },
  draft:   { label: "Pending",  icon: Clock,       color: "text-gray-400",  bg: "bg-gray-50 border-gray-200" },
  sent:    { label: "Due",      icon: Clock,       color: "text-sky-600",   bg: "bg-sky-50 border-sky-200" },
  overdue: { label: "Overdue",  icon: AlertCircle, color: "text-red-600",   bg: "bg-red-50 border-red-200" },
} as const

export default async function CustomerPortalPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params

  const customer = await db.customer.findUnique({
    where: { portalToken: token },
    include: {
      company: {
        select: { name: true, logoUrl: true, phone: true, replyToEmail: true },
      },
      invoices: {
        orderBy: { issuedAt: "desc" },
        include: { items: true, payments: true },
      },
      serviceVisits: {
        orderBy: { visitedAt: "desc" },
        take: 10,
      },
      messages: {
        orderBy: { createdAt: "asc" },
      },
    },
  })

  if (!customer) notFound()

  // Fire-and-forget portal access tracking
  db.customer.update({ where: { id: customer.id }, data: { portalLastAccessedAt: new Date() } }).catch(() => {})

  const outstanding = customer.invoices.filter((i) => i.status !== "paid" && i.status !== "draft")
  const history     = customer.invoices.filter((i) => i.status === "paid")

  const totalOwed = outstanding.reduce((s, inv) => {
    const t = invoiceTotal(inv.items)
    const p = paymentTotal(inv.payments)
    return s + Math.max(0, t - p)
  }, 0)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-2xl mx-auto px-4 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {customer.company.logoUrl ? (
              <img src={customer.company.logoUrl} alt={customer.company.name} className="h-8 object-contain" />
            ) : (
              <span className="text-base font-bold text-gray-900">{customer.company.name}</span>
            )}
          </div>
          {(customer.company.phone || customer.company.replyToEmail) && (
            <a
              href={customer.company.phone ? `tel:${customer.company.phone}` : `mailto:${customer.company.replyToEmail}`}
              className="text-sm text-sky-600 hover:underline"
            >
              {customer.company.phone ?? customer.company.replyToEmail}
            </a>
          )}
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        {/* Customer greeting */}
        <div>
          <h1 className="text-xl font-bold text-gray-900">
            Hi, {customer.firstName}!
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">Your account with {customer.company.name}</p>
        </div>

        {/* Balance summary */}
        {totalOwed > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-5 py-4">
            <p className="text-sm text-amber-700 font-medium">Outstanding balance</p>
            <p className="text-3xl font-bold text-amber-900 mt-1">{formatCurrency(totalOwed)}</p>
          </div>
        )}

        {/* Outstanding invoices */}
        {outstanding.length > 0 && (
          <section>
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">
              Invoices to pay
            </h2>
            <div className="space-y-3">
              {outstanding.map((inv) => {
                const total   = invoiceTotal(inv.items)
                const paid    = paymentTotal(inv.payments)
                const balance = Math.max(0, total - paid)
                const cfg     = statusConfig[inv.status as keyof typeof statusConfig] ?? statusConfig.sent
                const Icon    = cfg.icon
                return (
                  <div key={inv.id} className={`bg-white border rounded-xl overflow-hidden`}>
                    <div className="px-5 py-4 flex items-center justify-between gap-4">
                      <div>
                        <p className="text-xs text-gray-400 font-medium">{inv.invoiceNumber}</p>
                        <p className="text-lg font-bold text-gray-900 mt-0.5">{formatCurrency(balance)}</p>
                        <div className={`inline-flex items-center gap-1 text-xs font-medium mt-1 ${cfg.color}`}>
                          <Icon className="w-3.5 h-3.5" />
                          {cfg.label} · Due {formatDate(inv.dueDate)}
                        </div>
                      </div>
                      {inv.payToken && (
                        <Link
                          href={`/pay/${inv.payToken}`}
                          className="shrink-0 bg-sky-500 hover:bg-sky-600 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
                        >
                          Pay now
                        </Link>
                      )}
                    </div>
                    {inv.items.length > 0 && (
                      <div className="border-t border-gray-100 px-5 py-3 space-y-1">
                        {inv.items.map((item) => (
                          <div key={item.id} className="flex justify-between text-sm text-gray-600">
                            <span>{item.description}{item.quantity !== 1 && ` × ${item.quantity}`}</span>
                            <span className="tabular-nums">{formatCurrency(item.quantity * item.unitPrice)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </section>
        )}

        {/* Service visits */}
        {customer.serviceVisits.length > 0 && (
          <section>
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">
              Recent service visits
            </h2>
            <div className="bg-white border border-gray-200 rounded-xl divide-y divide-gray-50">
              {customer.serviceVisits.map((v) => (
                <div key={v.id} className="px-5 py-3 flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="w-7 h-7 rounded-full bg-sky-50 flex items-center justify-center shrink-0 mt-0.5">
                      <Droplets className="w-4 h-4 text-sky-500" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{formatDate(v.visitedAt)}</p>
                      {v.notes && <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">{v.notes}</p>}
                      {(v.chlorine || v.ph || v.alkalinity || v.calcium) && (
                        <div className="flex flex-wrap gap-2 mt-1.5">
                          {v.chlorine   != null && <span className="text-xs text-gray-500">Cl {v.chlorine} ppm</span>}
                          {v.ph         != null && <span className="text-xs text-gray-500">pH {v.ph}</span>}
                          {v.alkalinity != null && <span className="text-xs text-gray-500">Alk {v.alkalinity} ppm</span>}
                          {v.calcium    != null && <span className="text-xs text-gray-500">Ca {v.calcium} ppm</span>}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Messages */}
        <section>
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3 flex items-center gap-2">
            <MessageCircle className="w-4 h-4" /> Messages
          </h2>
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            {/* Thread */}
            <div className="px-4 py-3 space-y-3 max-h-80 overflow-y-auto">
              {customer.messages.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">
                  No messages yet. Send us a message below!
                </p>
              ) : (
                customer.messages.map((m) => (
                  <div key={m.id} className={`flex ${m.fromCompany ? "justify-start" : "justify-end"}`}>
                    <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${m.fromCompany ? "bg-sky-500 text-white rounded-tl-sm" : "bg-gray-100 text-gray-900 rounded-tr-sm"}`}>
                      {m.serviceVisitId && (
                        <p className="text-[10px] font-semibold uppercase tracking-wide mb-1 text-sky-200">
                          Visit summary
                        </p>
                      )}
                      <p className="text-sm whitespace-pre-wrap leading-relaxed">{m.body}</p>
                      <p className={`text-[11px] mt-1 ${m.fromCompany ? "text-sky-200" : "text-gray-400"}`}>
                        {new Date(m.createdAt).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                        {m.fromCompany ? ` · ${customer.company.name}` : " · You"}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Reply form */}
            <div className="border-t border-gray-100 p-4">
              <PortalReplyForm token={token} />
            </div>
          </div>
        </section>

        {/* Payment history */}
        {history.length > 0 && (
          <section>
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">
              Payment history
            </h2>
            <div className="bg-white border border-gray-200 rounded-xl divide-y divide-gray-50">
              {history.map((inv) => (
                <div key={inv.id} className="px-5 py-3 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{inv.invoiceNumber}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{formatDate(inv.issuedAt)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-gray-900">{formatCurrency(invoiceTotal(inv.items))}</p>
                    <div className="flex items-center gap-1 justify-end">
                      <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                      <span className="text-xs text-green-600">Paid</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {outstanding.length === 0 && history.length === 0 && (
          <div className="text-center py-12 text-gray-400 text-sm">No invoices on file yet.</div>
        )}

        <p className="text-center text-xs text-gray-400 pt-4">
          {customer.company.name} · Powered by PoolOS
        </p>
      </div>
    </div>
  )
}
