import { db } from "@/lib/db"
import { requireSession } from "@/lib/session"
import { notFound } from "next/navigation"
import Link from "next/link"
import { ChevronLeft, Phone, Mail, MapPin, Pencil, Trash2, Plus, Send } from "lucide-react"
import Card, { CardHeader, CardBody } from "@/components/ui/Card"
import { statusBadge } from "@/components/ui/Badge"
import Button from "@/components/ui/Button"
import { formatCurrency, formatDate, formatPhone, invoiceTotal } from "@/lib/utils"
import { deleteCustomer, addCustomerNote, deleteCustomerNote } from "@/lib/actions/customers"
import ConfirmButton from "@/components/ui/ConfirmButton"
import { chemStatus, CHEM_RANGES, STATUS_BG } from "@/lib/chemistry"

export const dynamic = "force-dynamic"

export default async function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { companyId } = await requireSession()
  const { id } = await params

  const [customer, emailLogs] = await Promise.all([
    db.customer.findFirst({
      where: { id, companyId },
      include: {
        notes: { orderBy: { createdAt: "desc" } },
        serviceVisits: { orderBy: { visitedAt: "desc" }, take: 10 },
        invoices: {
          orderBy: { createdAt: "desc" },
          take: 10,
          include: { items: true, payments: true },
        },
        routeStops: { include: { route: true } },
      },
    }),
    db.emailLog.findMany({
      where: { customerId: id, companyId },
      orderBy: { createdAt: "desc" },
      take: 20,
      include: { invoice: { select: { invoiceNumber: true } } },
    }),
  ])

  if (!customer) notFound()

  const deleteAction = deleteCustomer.bind(null, id)
  const addNoteAction = addCustomerNote.bind(null, id)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link href="/customers" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900 mb-3">
          <ChevronLeft className="w-4 h-4" /> Customers
        </Link>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {customer.firstName} {customer.lastName}
            </h1>
            <div className="flex items-center gap-3 mt-1 flex-wrap">
              {statusBadge(customer.status)}
              {customer.poolType && (
                <span className="text-xs text-gray-400">{customer.poolType} pool</span>
              )}
              {customer.monthlyRate && (
                <span className="text-xs text-gray-400">{formatCurrency(customer.monthlyRate)}/mo</span>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <Link href={`/customers/${id}/edit`}>
              <Button variant="secondary" size="sm">
                <Pencil className="w-4 h-4" /> Edit
              </Button>
            </Link>
            <ConfirmButton action={deleteAction} confirm="Delete this customer?" variant="danger" size="sm">
              <Trash2 className="w-4 h-4" /> Delete
            </ConfirmButton>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left column */}
        <div className="space-y-5">
          {/* Contact info */}
          <Card>
            <CardHeader><h2 className="font-semibold text-gray-900 text-sm">Contact</h2></CardHeader>
            <CardBody className="space-y-3 text-sm">
              {customer.email && (
                <div className="flex items-center gap-2 text-gray-600">
                  <Mail className="w-4 h-4 text-gray-400 shrink-0" />
                  <a href={`mailto:${customer.email}`} className="hover:text-sky-600">{customer.email}</a>
                </div>
              )}
              {customer.phone && (
                <div className="flex items-center gap-2 text-gray-600">
                  <Phone className="w-4 h-4 text-gray-400 shrink-0" />
                  <a href={`tel:${customer.phone}`} className="hover:text-sky-600">{formatPhone(customer.phone)}</a>
                </div>
              )}
              <div className="flex items-start gap-2 text-gray-600">
                <MapPin className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
                <span>{customer.address}<br />{customer.city}, {customer.state} {customer.zip}</span>
              </div>
            </CardBody>
          </Card>

          {/* Pool details */}
          <Card>
            <CardHeader><h2 className="font-semibold text-gray-900 text-sm">Pool Details</h2></CardHeader>
            <CardBody className="space-y-2 text-sm text-gray-600">
              {customer.poolType && <p><span className="text-gray-400">Type:</span> {customer.poolType}</p>}
              {customer.poolSize && <p><span className="text-gray-400">Size:</span> {customer.poolSize} gal</p>}
              {customer.poolNotes && <p className="text-gray-500">{customer.poolNotes}</p>}
              {!customer.poolType && !customer.poolSize && !customer.poolNotes && (
                <p className="text-gray-400">No pool details added.</p>
              )}
            </CardBody>
          </Card>

          {/* Routes */}
          <Card>
            <CardHeader><h2 className="font-semibold text-gray-900 text-sm">On Routes</h2></CardHeader>
            <CardBody className="space-y-2 text-sm">
              {customer.routeStops.length === 0 ? (
                <p className="text-gray-400">Not on any route.</p>
              ) : (
                customer.routeStops.map((stop) => (
                  <Link key={stop.id} href={`/routes/${stop.routeId}`} className="flex items-center justify-between text-gray-700 hover:text-sky-600">
                    {stop.route.name}
                    <span className="text-gray-400 text-xs">Stop #{stop.position + 1}</span>
                  </Link>
                ))
              )}
            </CardBody>
          </Card>
        </div>

        {/* Right column */}
        <div className="lg:col-span-2 space-y-5">
          {/* Notes */}
          <Card>
            <CardHeader>
              <h2 className="font-semibold text-gray-900 text-sm">Notes</h2>
            </CardHeader>
            <CardBody className="space-y-4">
              <form action={addNoteAction} className="flex gap-2">
                <input
                  name="body"
                  placeholder="Add a note…"
                  required
                  className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
                <Button type="submit" size="sm">
                  <Plus className="w-4 h-4" /> Add
                </Button>
              </form>
              {customer.notes.length === 0 ? (
                <p className="text-sm text-gray-400">No notes yet.</p>
              ) : (
                <div className="space-y-2">
                  {customer.notes.map((note) => {
                    const deleteNote = deleteCustomerNote.bind(null, note.id, id)
                    return (
                      <div key={note.id} className="flex items-start gap-3 bg-gray-50 rounded-lg p-3">
                        <div className="flex-1">
                          <p className="text-sm text-gray-700">{note.body}</p>
                          <p className="text-xs text-gray-400 mt-1">{formatDate(note.createdAt)}</p>
                        </div>
                        <form action={deleteNote}>
                          <button type="submit" className="text-gray-300 hover:text-red-500 transition-colors mt-0.5">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </form>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardBody>
          </Card>

          {/* Service history */}
          <Card>
            <CardHeader>
              <h2 className="font-semibold text-gray-900 text-sm">Recent Visits</h2>
            </CardHeader>
            {customer.serviceVisits.length === 0 ? (
              <CardBody><p className="text-sm text-gray-400">No visits logged yet.</p></CardBody>
            ) : (
              <div className="divide-y divide-gray-50">
                {customer.serviceVisits.map((v) => {
                  const chemReadings = [
                    { key: "chlorine" as const, label: "Cl", value: v.chlorine },
                    { key: "ph" as const,       label: "pH", value: v.ph },
                    { key: "alkalinity" as const, label: "Alk", value: v.alkalinity },
                    { key: "calcium" as const,  label: "Ca", value: v.calcium },
                  ].filter((r) => r.value != null)
                  return (
                    <div key={v.id} className="px-5 py-3">
                      <div className="flex items-start justify-between mb-1.5">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{formatDate(v.visitedAt)}</p>
                          {v.notes && <p className="text-gray-500 text-xs mt-0.5">{v.notes}</p>}
                        </div>
                        {statusBadge(v.status)}
                      </div>
                      {chemReadings.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-1.5">
                          {chemReadings.map((r) => {
                            const s = chemStatus(r.key, r.value)
                            const range = CHEM_RANGES[r.key]
                            const title = `${range.label}: ${r.value}${range.unit ? " " + range.unit : ""} (normal ${range.low}–${range.high}${range.unit ? " " + range.unit : ""})`
                            return (
                              <span
                                key={r.key}
                                title={title}
                                className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium ${s ? STATUS_BG[s] : "bg-gray-50 text-gray-500 border-gray-200"}`}
                              >
                                {r.label}: {r.value}
                                {s === "low" && " ▼"}
                                {s === "high" && " ▲"}
                              </span>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </Card>

          {/* Email history */}
          <Card>
            <CardHeader>
              <h2 className="font-semibold text-gray-900 text-sm flex items-center gap-1.5">
                <Send className="w-3.5 h-3.5 text-gray-400" /> Email History
              </h2>
            </CardHeader>
            {emailLogs.length === 0 ? (
              <CardBody><p className="text-sm text-gray-400">No emails sent yet.</p></CardBody>
            ) : (
              <div className="divide-y divide-gray-50">
                {emailLogs.map((log) => (
                  <div key={log.id} className="px-5 py-3 flex items-start justify-between gap-4 text-sm">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`font-medium ${log.status === "sent" ? "text-green-700" : "text-red-600"}`}>
                          {log.type === "reminder" ? "Reminder" : "Invoice"}
                        </span>
                        <Link href={`/invoices/${log.invoiceId}`} className="text-sky-700 hover:underline text-xs">
                          #{log.invoice.invoiceNumber}
                        </Link>
                        <span className={`text-xs px-1.5 py-0.5 rounded-full ${log.status === "sent" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"}`}>
                          {log.status}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5 truncate">{log.toEmail}</p>
                    </div>
                    <span className="text-xs text-gray-400 shrink-0">{formatDate(log.createdAt)}</span>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Invoices */}
          <Card>
            <CardHeader className="flex items-center justify-between">
              <h2 className="font-semibold text-gray-900 text-sm">Invoices</h2>
              <Link href={`/invoices/new?customerId=${id}`}>
                <Button size="sm" variant="secondary">
                  <Plus className="w-4 h-4" /> New Invoice
                </Button>
              </Link>
            </CardHeader>
            {customer.invoices.length === 0 ? (
              <CardBody><p className="text-sm text-gray-400">No invoices yet.</p></CardBody>
            ) : (
              <div className="divide-y divide-gray-50">
                {customer.invoices.map((inv) => {
                  const total = invoiceTotal(inv.items)
                  const paid = inv.payments.reduce((s, p) => s + p.amount, 0)
                  return (
                    <Link
                      key={inv.id}
                      href={`/invoices/${inv.id}`}
                      className="flex items-center justify-between px-5 py-3 hover:bg-gray-50 transition-colors"
                    >
                      <div>
                        <p className="text-sm font-medium text-gray-900">#{inv.invoiceNumber}</p>
                        <p className="text-xs text-gray-400">{formatDate(inv.issuedAt)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold">{formatCurrency(total)}</p>
                        {paid > 0 && paid < total && (
                          <p className="text-xs text-gray-400">{formatCurrency(paid)} paid</p>
                        )}
                        <div className="mt-0.5">{statusBadge(inv.status)}</div>
                      </div>
                    </Link>
                  )
                })}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  )
}
