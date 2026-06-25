import { db } from "@/lib/db"

export type AppNotification = {
  id:       string
  type:     "overdue_invoice" | "portal_reply" | "chemical_alert" | "equipment_due"
  severity: "red" | "blue" | "amber" | "orange"
  label:    string
  detail:   string
  href:     string
}

export type AdminNotification = {
  id:        string
  type:      "new_company"
  label:     string
  detail:    string
  href:      string
}

// ── Chemistry thresholds ──────────────────────────────────────────────────────
const RANGES = {
  ph:        { min: 7.2, max: 7.6,  label: "pH" },
  chlorine:  { min: 1.0, max: 3.0,  label: "Chlorine" },
  alkalinity:{ min: 80,  max: 120,  label: "Alkalinity" },
  calcium:   { min: 200, max: 400,  label: "Calcium" },
  cya:       { min: 30,  max: 50,   label: "CYA" },
}

function chemIssues(v: {
  ph?: number | null; chlorine?: number | null; alkalinity?: number | null
  calcium?: number | null; cya?: number | null
}): string[] {
  return (Object.entries(RANGES) as [keyof typeof RANGES, { min: number; max: number; label: string }][])
    .filter(([key, { min, max }]) => {
      const val = v[key]
      return val != null && (val < min || val > max)
    })
    .map(([, { label }]) => label)
}

// ── App (per-company) notifications ──────────────────────────────────────────
export async function getCompanyNotifications(companyId: string): Promise<AppNotification[]> {
  const now = new Date()

  const [overdueInvoices, allMessages, recentVisits, equipmentDue] = await Promise.all([
    // 1. Overdue invoices
    db.invoice.findMany({
      where: { companyId, status: "sent", dueDate: { lt: now } },
      orderBy: { dueDate: "asc" },
      take: 20,
      select: {
        id: true, invoiceNumber: true, dueDate: true,
        customer: { select: { id: true, firstName: true, lastName: true } },
      },
    }),

    // 2. All messages (most recent first) — we pick latest per customer below
    db.customerMessage.findMany({
      where: { companyId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true, fromCompany: true, body: true,
        customer: { select: { id: true, firstName: true, lastName: true } },
      },
    }),

    // 3. Recent completed visits — most recent 500 to find latest per customer
    db.serviceVisit.findMany({
      where: { customer: { companyId }, status: "completed" },
      orderBy: { visitedAt: "desc" },
      take: 500,
      select: {
        id: true, visitedAt: true,
        ph: true, chlorine: true, alkalinity: true, calcium: true, cya: true,
        customer: { select: { id: true, firstName: true, lastName: true } },
      },
    }),

    // 4. Equipment with service intervals that are overdue
    db.equipment.findMany({
      where: {
        customer: { companyId },
        serviceIntervalDays: { not: null },
      },
      select: {
        id: true, type: true, brand: true, model: true,
        serviceIntervalDays: true, lastServicedAt: true, installedAt: true,
        customer: { select: { id: true, firstName: true, lastName: true } },
      },
    }),
  ])

  const notifications: AppNotification[] = []

  // Overdue invoices
  for (const inv of overdueInvoices) {
    const daysOverdue = Math.floor((now.getTime() - inv.dueDate.getTime()) / 86_400_000)
    notifications.push({
      id:       `inv-${inv.id}`,
      type:     "overdue_invoice",
      severity: "red",
      label:    `${inv.invoiceNumber} — ${inv.customer.firstName} ${inv.customer.lastName}`,
      detail:   `${daysOverdue} day${daysOverdue !== 1 ? "s" : ""} overdue`,
      href:     `/invoices/${inv.id}`,
    })
  }

  // Unread portal replies — customers whose most recent message was sent by them
  const seenCustomers = new Set<string>()
  for (const msg of allMessages) {
    if (seenCustomers.has(msg.customer.id)) continue
    seenCustomers.add(msg.customer.id)
    if (!msg.fromCompany) {
      const preview = msg.body.length > 60 ? msg.body.slice(0, 60) + "…" : msg.body
      notifications.push({
        id:       `msg-${msg.id}`,
        type:     "portal_reply",
        severity: "blue",
        label:    `${msg.customer.firstName} ${msg.customer.lastName}`,
        detail:   preview,
        href:     `/messages?customerId=${msg.customer.id}`,
      })
    }
  }

  // Chemical alerts — most recent visit per customer with out-of-range readings
  const seenVisitCustomers = new Set<string>()
  for (const v of recentVisits) {
    if (seenVisitCustomers.has(v.customer.id)) continue
    seenVisitCustomers.add(v.customer.id)
    const issues = chemIssues(v)
    if (issues.length > 0) {
      notifications.push({
        id:       `chem-${v.id}`,
        type:     "chemical_alert",
        severity: "amber",
        label:    `${v.customer.firstName} ${v.customer.lastName}`,
        detail:   `${issues.join(", ")} out of range`,
        href:     `/customers/${v.customer.id}`,
      })
    }
  }

  // Equipment due for service
  for (const eq of equipmentDue) {
    const intervalDays = eq.serviceIntervalDays!
    // Use lastServicedAt if available, fall back to installedAt; skip if neither
    const reference = eq.lastServicedAt ?? eq.installedAt
    if (!reference) continue
    const dueAt  = new Date(reference.getTime() + intervalDays * 86_400_000)
    if (dueAt > now) continue // not yet due
    const daysOverdue = Math.floor((now.getTime() - dueAt.getTime()) / 86_400_000)
    const eqName = [eq.brand, eq.model ?? eq.type].filter(Boolean).join(" ")
    notifications.push({
      id:       `eqdue-${eq.id}`,
      type:     "equipment_due",
      severity: "orange",
      label:    `${eq.customer.firstName} ${eq.customer.lastName} — ${eqName}`,
      detail:   daysOverdue === 0 ? "Due today" : `${daysOverdue} day${daysOverdue !== 1 ? "s" : ""} overdue`,
      href:     `/customers/${eq.customer.id}`,
    })
  }

  return notifications
}

// ── Admin notifications ───────────────────────────────────────────────────────
export async function getAdminNotifications(): Promise<AdminNotification[]> {
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // last 7 days

  const newCompanies = await db.company.findMany({
    where: { createdAt: { gte: since } },
    orderBy: { createdAt: "desc" },
    select: { id: true, name: true, createdAt: true },
  })

  return newCompanies.map((c) => {
    const daysAgo = Math.floor((Date.now() - c.createdAt.getTime()) / 86_400_000)
    return {
      id:     `company-${c.id}`,
      type:   "new_company" as const,
      label:  c.name,
      detail: daysAgo === 0 ? "Joined today" : `${daysAgo} day${daysAgo !== 1 ? "s" : ""} ago`,
      href:   `/admin/companies/${c.id}`,
    }
  })
}
