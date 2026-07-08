import { db } from "@/lib/db"
import { notFound } from "next/navigation"
import Link from "next/link"
import { formatCurrency, formatDate, invoiceTotal, paymentTotal } from "@/lib/utils"
import { CheckCircle, Clock, AlertCircle, Droplets, MessageCircle, FileText, ChevronRight, Package } from "lucide-react"
import PortalReplyForm from "@/components/portal/PortalReplyForm"
import PortalRequestForm from "@/components/portal/PortalRequestForm"

const GCS = process.env.NEXT_PUBLIC_GCS_PUBLIC_URL ?? ""

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
        take: 5,
        include: {
          technician: { select: { firstName: true, lastName: true } },
        },
      },
      _count: { select: { serviceVisits: true } },
      messages: {
        orderBy: { createdAt: "asc" },
      },
      estimates: {
        where:   { status: "sent" },
        include: { items: true },
        orderBy: { createdAt: "desc" },
      },
    },
  })

  if (!customer) notFound()

  const activeContracts = await db.serviceContract.findMany({
    where: { customerId: customer.id, companyId: customer.companyId, status: "active" },
    orderBy: { createdAt: "desc" },
    select: { id: true, name: true, description: true, totalVisits: true, usedVisits: true, expiresAt: true },
  })

  // Fire-and-forget portal access tracking
  db.customer.update({ where: { id: customer.id }, data: { portalLastAccessedAt: new Date() } }).catch(() => {})

  const visitIds = customer.serviceVisits.map((v) => v.id)
  const recentPhotos = visitIds.length > 0
    ? await db.attachment.findMany({
        where: { serviceVisitId: { in: visitIds } },
        select: { id: true, key: true, serviceVisitId: true },
        orderBy: { createdAt: "asc" },
        take: 9,
      })
    : []
  const photosByVisit = new Map<string, typeof recentPhotos>()
  for (const a of recentPhotos) {
    if (!a.serviceVisitId) continue
    const list = photosByVisit.get(a.serviceVisitId) ?? []
    list.push(a)
    photosByVisit.set(a.serviceVisitId, list)
  }

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

        {/* Pending estimates */}
        {customer.estimates.length > 0 && (
          <section>
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3 flex items-center gap-2">
              <FileText className="w-4 h-4" /> Estimates to Review
            </h2>
            <div className="space-y-3">
              {customer.estimates.map((est) => {
                const estTotal = est.items.reduce((s, i) => s + i.quantity * i.unitPrice, 0)
                const expired  = est.validUntil && est.validUntil < new Date()
                return (
                  <div key={est.id} className="bg-white border border-amber-200 rounded-xl overflow-hidden">
                    <div className="px-5 py-4 flex items-center justify-between gap-4">
                      <div>
                        <p className="text-xs text-amber-700 font-medium">{est.estimateNumber}</p>
                        <p className="text-lg font-bold text-gray-900 mt-0.5">{formatCurrency(estTotal)}</p>
                        {est.validUntil && (
                          <p className={`text-xs mt-0.5 ${expired ? "text-red-500" : "text-gray-400"}`}>
                            {expired ? "Expired" : `Valid until ${formatDate(est.validUntil)}`}
                          </p>
                        )}
                      </div>
                      <Link
                        href={`/portal/${token}/estimates/${est.id}`}
                        className="shrink-0 bg-amber-600 hover:bg-amber-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
                      >
                        Review
                      </Link>
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
        )}

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
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide flex items-center gap-2">
                <Droplets className="w-4 h-4" /> Recent service visits
              </h2>
              {customer._count.serviceVisits > 5 && (
                <Link
                  href={`/portal/${token}/history`}
                  className="text-xs text-sky-600 hover:underline flex items-center gap-0.5"
                >
                  View all {customer._count.serviceVisits} <ChevronRight className="w-3 h-3" />
                </Link>
              )}
            </div>
            <div className="bg-white border border-gray-200 rounded-xl divide-y divide-gray-50">
              {customer.serviceVisits.map((v) => {
                const photos = photosByVisit.get(v.id) ?? []
                return (
                  <div key={v.id} className="px-5 py-3">
                    <div className="flex items-start gap-3">
                      <div className="w-7 h-7 rounded-full bg-sky-50 flex items-center justify-center shrink-0 mt-0.5">
                        <Droplets className="w-4 h-4 text-sky-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">{formatDate(v.visitedAt)}</p>
                        {v.technician && (
                          <p className="text-xs text-gray-400 mt-0.5">
                            {v.technician.firstName} {v.technician.lastName}
                          </p>
                        )}
                        {v.notes && <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">{v.notes}</p>}
                        {(v.chlorine != null || v.ph != null || v.alkalinity != null || v.calcium != null) && (
                          <div className="flex flex-wrap gap-2 mt-1.5">
                            {v.chlorine   != null && <span className="text-xs text-gray-500">Cl {v.chlorine} ppm</span>}
                            {v.ph         != null && <span className="text-xs text-gray-500">pH {v.ph}</span>}
                            {v.alkalinity != null && <span className="text-xs text-gray-500">Alk {v.alkalinity} ppm</span>}
                            {v.calcium    != null && <span className="text-xs text-gray-500">Ca {v.calcium} ppm</span>}
                          </div>
                        )}
                        {photos.length > 0 && (
                          <div className="flex gap-1.5 mt-2">
                            {photos.slice(0, 3).map((p) => (
                              <img
                                key={p.id}
                                src={`${GCS}/${p.key}`}
                                className="w-14 h-14 object-cover rounded-md"
                                alt="visit photo"
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
            <Link
              href={`/portal/${token}/history`}
              className="mt-2 flex items-center justify-center gap-1 text-xs text-sky-600 hover:underline py-1"
            >
              Full service history <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </section>
        )}

        {/* Service contracts */}
        {activeContracts.length > 0 && (
          <section>
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3 flex items-center gap-2">
              <Package className="w-4 h-4" /> Your Service Packages
            </h2>
            <div className="space-y-3">
              {activeContracts.map((contract) => {
                const remaining = contract.totalVisits - contract.usedVisits
                const pct = contract.totalVisits > 0 ? Math.round((contract.usedVisits / contract.totalVisits) * 100) : 0
                return (
                  <div key={contract.id} className="bg-white border border-gray-200 rounded-xl px-5 py-4">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{contract.name}</p>
                        {contract.description && (
                          <p className="text-xs text-gray-400 mt-0.5">{contract.description}</p>
                        )}
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-2xl font-bold text-sky-600">{remaining}</p>
                        <p className="text-xs text-gray-400">visit{remaining !== 1 ? "s" : ""} left</p>
                      </div>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden mb-1.5">
                      <div className="h-full bg-sky-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
                    </div>
                    <p className="text-xs text-gray-400">
                      {contract.usedVisits} of {contract.totalVisits} visits used
                      {contract.expiresAt && ` · Expires ${new Date(contract.expiresAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`}
                    </p>
                  </div>
                )
              })}
            </div>
          </section>
        )}

        {/* Visit request */}
        <PortalRequestForm token={token} />

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
