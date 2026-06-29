import { db } from "@/lib/db"
import { requireSession } from "@/lib/session"
import { notFound } from "next/navigation"
import Link from "next/link"
import { ChevronLeft, Phone, Mail, MapPin, Pencil, Trash2, Plus, Send, Wrench, ClipboardList, ToggleLeft, ToggleRight, KeyRound } from "lucide-react"
import Card, { CardHeader, CardBody } from "@/components/ui/Card"
import { statusBadge } from "@/components/ui/Badge"
import Button from "@/components/ui/Button"
import { formatCurrency, formatDate, formatPhone, invoiceTotal } from "@/lib/utils"
import { deleteCustomer, addCustomerNote, deleteCustomerNote, disableAutoPay } from "@/lib/actions/customers"
import { addCustomerChecklistItem, deleteChecklistItem, toggleChecklistItem } from "@/lib/actions/checklist"
import ConfirmButton from "@/components/ui/ConfirmButton"
import CopyPayLinkButton from "@/components/invoices/CopyPayLinkButton"
import CustomerMessages from "@/components/customers/CustomerMessages"
import CustomerAlerts from "@/components/customers/CustomerAlerts"
import CustomerTags from "@/components/customers/CustomerTags"
import ChemicalChart from "@/components/customers/ChemicalChart"
import FileUpload from "@/components/ui/FileUpload"
import EquipmentCard from "@/components/customers/EquipmentCard"
import CustomerVisitHistory from "@/components/customers/CustomerVisitHistory"
import CustomerIssueSection from "@/components/customers/CustomerIssueSection"

export const dynamic = "force-dynamic"

const FREQUENCY_LABELS: Record<string, string> = {
  weekly:    "Weekly",
  biweekly:  "Bi-weekly",
  monthly:   "Monthly",
  quarterly: "Quarterly",
  as_needed: "As needed",
}

export default async function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { companyId } = await requireSession()
  const { id } = await params

  const [customer, emailLogs, messages, companyTags, companyUsers, issues] = await Promise.all([
    db.customer.findFirst({
      where: { id, companyId },
      include: {
        notes: { orderBy: { createdAt: "desc" } },
        serviceVisits: { orderBy: { visitedAt: "desc" }, take: 20, include: { chemicalUsages: true } },
        invoices: {
          orderBy: { createdAt: "desc" },
          take: 10,
          include: { items: true, payments: true },
        },
        equipment: {
          orderBy: { createdAt: "asc" },
          include: {
            serviceRecords: {
              orderBy: { date: "desc" },
              include: { technician: { select: { firstName: true, lastName: true } } },
            },
          },
        },
        routeStops: { include: { route: true } },
        alerts: { orderBy: { createdAt: "desc" } },
        tags: { include: { tag: true } },
        attachments: { orderBy: { createdAt: "desc" } },
        checklistItems: { orderBy: { position: "asc" } },
      },
    }),
    db.emailLog.findMany({
      where: { customerId: id, companyId },
      orderBy: { createdAt: "desc" },
      take: 20,
      include: { invoice: { select: { invoiceNumber: true } } },
    }),
    db.customerMessage.findMany({
      where: { customerId: id, companyId },
      orderBy: { createdAt: "asc" },
    }),
    db.tag.findMany({ where: { companyId }, orderBy: { name: "asc" } }),
    db.user.findMany({ where: { companyId, isActive: true }, orderBy: { firstName: "asc" }, select: { id: true, firstName: true, lastName: true } }),
    db.issueReport.findMany({
      where: { customerId: id, companyId },
      orderBy: { createdAt: "desc" },
      include: { reportedBy: { select: { firstName: true, lastName: true } } },
    }),
  ])

  const openIssueCount = issues.filter((i) => i.status !== "resolved").length

  if (!customer) notFound()

  // Lazily generate portal token so every customer gets a stable portal URL
  if (!customer.portalToken) {
    const portalToken = crypto.randomUUID()
    await db.customer.update({ where: { id }, data: { portalToken } })
    customer.portalToken = portalToken
  }

  // Outstanding balance calculation
  const openInvoices = customer.invoices.filter((inv) =>
    inv.status === "pending" || inv.status === "overdue"
  )
  const outstandingTotal = openInvoices.reduce((sum, inv) => {
    const total = invoiceTotal(inv.items)
    const paid  = inv.payments.reduce((s, p) => s + p.amount, 0)
    return sum + Math.max(0, total - paid)
  }, 0)

  // Portal access info
  const portalLastAccessed = customer.portalLastAccessedAt
  const portalAccessLabel = portalLastAccessed
    ? (() => {
        // eslint-disable-next-line react-hooks/purity
        const days = Math.floor((Date.now() - new Date(portalLastAccessed).getTime()) / (1000 * 60 * 60 * 24))
        return days === 0 ? "Last accessed today" : `Last accessed ${days} day${days === 1 ? "" : "s"} ago`
      })()
    : "Never accessed"

  const deleteAction         = deleteCustomer.bind(null, id)
  const addNoteAction        = addCustomerNote.bind(null, id)
  const disableAutoPayAction = disableAutoPay.bind(null, id)
  const appUrl               = process.env.NEXT_PUBLIC_APP_URL ?? ""
  const portalUrl            = `${appUrl}/portal/${customer.portalToken}`

  // Chemical chart data: visits with at least one reading
  const visitsWithChemicals = customer.serviceVisits.filter(
    (v) => v.chlorine != null || v.ph != null || v.alkalinity != null || v.calcium != null || v.cya != null || v.salt != null
  )

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
              {customer.autoPayEnabled && (
                <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700 bg-green-50 border border-green-200 rounded-full px-2 py-0.5">
                  Auto-pay on
                </span>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <Link href={`/customers/${id}/edit`}>
              <Button variant="secondary" size="sm">
                <Pencil className="w-4 h-4" /> Edit
              </Button>
            </Link>
            <CopyPayLinkButton url={portalUrl} label="Portal Link" />
            {customer.autoPayEnabled && (
              <ConfirmButton action={disableAutoPayAction} confirm="Disable auto-pay for this customer?" variant="secondary" size="sm">
                Disable Auto-pay
              </ConfirmButton>
            )}
            <ConfirmButton action={deleteAction} confirm="Delete this customer?" variant="danger" size="sm">
              <Trash2 className="w-4 h-4" /> Delete
            </ConfirmButton>
          </div>
        </div>
      </div>

      {/* Access notes banner */}
      {customer.accessNotes && (
        <div className="flex items-start gap-3 rounded-xl bg-amber-50 border border-amber-300 px-5 py-3">
          <KeyRound className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-amber-800">Access Notes</p>
            <p className="text-sm text-amber-700 mt-0.5 whitespace-pre-wrap">{customer.accessNotes}</p>
          </div>
          <Link href={`/customers/${id}/edit`} className="ml-auto shrink-0 text-xs text-amber-600 hover:text-amber-800 underline">Edit</Link>
        </div>
      )}

      {/* Outstanding balance widget */}
      {outstandingTotal > 0 && (
        <div className="flex items-center gap-3 rounded-xl bg-amber-50 border border-amber-200 px-5 py-3">
          <div className="flex-1">
            <p className="text-sm font-semibold text-amber-800">Outstanding Balance</p>
            <p className="text-xs text-amber-600 mt-0.5">{openInvoices.length} open invoice{openInvoices.length !== 1 ? "s" : ""}</p>
          </div>
          <p className="text-xl font-bold text-amber-900">{formatCurrency(outstandingTotal)}</p>
        </div>
      )}

      {/* Tags */}
      <Card>
        <CardHeader>
          <h2 className="font-semibold text-gray-900 text-sm" title="Labels for organizing and filtering your customer list — e.g. VIP, Commercial, Seasonal">
            Tags
          </h2>
          <p className="text-xs text-gray-400">Organize &amp; filter customers</p>
        </CardHeader>
        <CardBody>
          <CustomerTags
            customerId={id}
            tags={customer.tags}
            companyTags={companyTags}
          />
        </CardBody>
      </Card>

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
              {customer.serviceFrequency && (
                <p><span className="text-gray-400">Frequency:</span> {FREQUENCY_LABELS[customer.serviceFrequency] ?? customer.serviceFrequency}</p>
              )}
              {customer.poolNotes && <p className="text-gray-500">{customer.poolNotes}</p>}
              {!customer.poolType && !customer.poolSize && !customer.poolNotes && !customer.serviceFrequency && (
                <p className="text-gray-400">No pool details added.</p>
              )}
            </CardBody>
          </Card>

          {/* Equipment */}
          <Card>
            <CardHeader>
              <h2 className="font-semibold text-gray-900 text-sm flex items-center gap-1.5">
                <Wrench className="w-3.5 h-3.5 text-gray-400" /> Equipment
              </h2>
            </CardHeader>
            <CardBody>
              <EquipmentCard
                customerId={id}
                equipment={customer.equipment}
                users={companyUsers}
              />
            </CardBody>
          </Card>

          {/* Customer-specific checklist */}
          <Card>
            <CardHeader>
              <h2 className="font-semibold text-gray-900 text-sm flex items-center gap-1.5">
                <ClipboardList className="w-3.5 h-3.5 text-gray-400" /> Visit Checklist
              </h2>
              <p className="text-xs text-gray-400">Items added here appear only on this customer&apos;s visits</p>
            </CardHeader>
            <CardBody className="space-y-3">
              {customer.checklistItems.length > 0 && (
                <ul className="divide-y divide-gray-100">
                  {customer.checklistItems.map((item) => {
                    const deleteAction = deleteChecklistItem.bind(null, item.id)
                    const toggleAction = toggleChecklistItem.bind(null, item.id, !item.isActive)
                    return (
                      <li key={item.id} className={`flex items-center gap-3 py-2.5 first:pt-0 last:pb-0 ${!item.isActive ? "opacity-50" : ""}`}>
                        <span className="flex-1 text-sm text-gray-800">{item.label}</span>
                        <form action={toggleAction}>
                          <button type="submit" title={item.isActive ? "Disable" : "Enable"} className="text-gray-400 hover:text-sky-600 transition-colors">
                            {item.isActive ? <ToggleRight className="w-5 h-5 text-sky-600" /> : <ToggleLeft className="w-5 h-5" />}
                          </button>
                        </form>
                        <ConfirmButton action={deleteAction} confirm={`Delete "${item.label}"?`} variant="ghost" size="sm" className="text-gray-300 hover:text-red-500 !px-1 !py-1">
                          <Trash2 className="w-4 h-4" />
                        </ConfirmButton>
                      </li>
                    )
                  })}
                </ul>
              )}
              <form action={addCustomerChecklistItem} className="flex gap-2 pt-1 border-t border-gray-100">
                <input type="hidden" name="customerId" value={id} />
                <input
                  name="label"
                  required
                  placeholder="e.g. Check back gate latch"
                  className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
                <Button type="submit" size="sm"><Plus className="w-4 h-4" /> Add</Button>
              </form>
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

          {/* Portal access */}
          <Card>
            <CardHeader><h2 className="font-semibold text-gray-900 text-sm">Customer Portal</h2></CardHeader>
            <CardBody className="space-y-2 text-sm text-gray-600">
              <p className="text-xs text-gray-400 break-all">{portalUrl}</p>
              <p className={`text-xs ${portalLastAccessed ? "text-green-600" : "text-gray-400"}`}>
                Portal: {portalAccessLabel}
              </p>
            </CardBody>
          </Card>
        </div>

        {/* Right column */}
        <div className="lg:col-span-2 space-y-5">
          {/* Alerts / Flags */}
          <Card>
            <CardHeader>
              <h2 className="font-semibold text-gray-900 text-sm" title="Warnings shown to techs before logging a visit — e.g. gate codes, aggressive pets, recurring issues">
                ⚑ Alerts &amp; Flags
              </h2>
              <p className="text-xs text-gray-400">Shown to techs when logging a visit</p>
            </CardHeader>
            <CardBody>
              <CustomerAlerts customerId={id} alerts={customer.alerts} />
            </CardBody>
          </Card>

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
            <CustomerVisitHistory visits={customer.serviceVisits} />
          </Card>

          {/* Chemical trending chart */}
          {visitsWithChemicals.length > 0 && (
            <Card>
              <CardHeader>
                <h2 className="font-semibold text-gray-900 text-sm">Chemical Trends</h2>
              </CardHeader>
              <CardBody>
                <ChemicalChart
                  visits={customer.serviceVisits.map((v) => ({
                    visitedAt: v.visitedAt,
                    chlorine: v.chlorine,
                    ph: v.ph,
                    alkalinity: v.alkalinity,
                    calcium: v.calcium,
                  }))}
                />
              </CardBody>
            </Card>
          )}

          {/* Attachments */}
          <Card>
            <CardHeader>
              <h2 className="font-semibold text-gray-900 text-sm flex items-center gap-1.5">
                <Wrench className="w-3.5 h-3.5 text-gray-400" /> Files & Photos
              </h2>
            </CardHeader>
            <CardBody>
              <FileUpload
                customerId={id}
                attachments={customer.attachments}
              />
            </CardBody>
          </Card>

          {/* Issue Reports */}
          <Card>
            <CustomerIssueSection customerId={id} issues={issues} />
          </Card>

          {/* Messages */}
          <Card>
            <CardHeader>
              <h2 className="font-semibold text-gray-900 text-sm flex items-center gap-1.5">
                <Send className="w-3.5 h-3.5 text-gray-400" /> Messages
              </h2>
            </CardHeader>
            <CustomerMessages
              customerId={id}
              messages={messages}
            />
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
                          {log.type === "reminder" ? "Reminder" : log.type === "estimate" ? "Estimate" : log.type === "visit" ? "Visit summary" : log.type === "message" ? "Message" : "Invoice"}
                        </span>
                        {log.invoiceId && log.invoice && (
                          <Link href={`/invoices/${log.invoiceId}`} className="text-sky-700 hover:underline text-xs">
                            #{log.invoice.invoiceNumber}
                          </Link>
                        )}
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
