import { db } from "@/lib/db"

export type AppNotification = {
  id:       string
  type:     "overdue_invoice" | "portal_reply" | "chemical_alert" | "chemical_trend" | "equipment_due" | "open_issue" | "low_rating" | "low_stock" | "visit_request"
  severity: "red" | "blue" | "amber" | "orange"
  label:    string
  detail:   string
  href:     string
}

export type AdminNotification = {
  id:        string
  type:      "new_company" | "open_ticket"
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

  const [overdueInvoices, allMessages, recentVisits, equipmentDue, dismissed, highPriorityIssues, lowRatingVisits, lowStockItems, pendingRequests] = await Promise.all([
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

    // 5. Dismissed notification IDs for this company
    db.dismissedNotification.findMany({
      where: { companyId },
      select: { notificationId: true },
    }),

    // 6. Open or in-progress high-priority issues
    db.issueReport.findMany({
      where: { companyId, status: { in: ["open", "in_progress"] }, priority: "high" },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: {
        id: true, category: true, notes: true,
        customer: { select: { id: true, firstName: true, lastName: true } },
      },
    }),

    // 7. Low ratings (1 or 2) in the last 30 days
    db.serviceVisit.findMany({
      where: {
        customer: { companyId },
        rating: { in: [1, 2] },
        visitedAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
      },
      orderBy: { visitedAt: "desc" },
      take: 20,
      select: {
        id: true, rating: true, feedbackComment: true, visitedAt: true,
        customer: { select: { id: true, firstName: true, lastName: true } },
      },
    }),

    // 8. Inventory items with a threshold set (filter low/out-of-stock in JS)
    db.inventoryItem.findMany({
      where: { companyId, isActive: true, lowStockThreshold: { gt: 0 } },
      select: { id: true, name: true, onHand: true, lowStockThreshold: true, unit: true },
    }),

    // 9. Pending visit requests from the customer portal
    db.visitRequest.findMany({
      where: { companyId, status: "pending" },
      orderBy: { createdAt: "asc" },
      select: {
        id: true, createdAt: true, serviceType: true,
        customer: { select: { id: true, firstName: true, lastName: true } },
      },
    }),
  ])

  const dismissedIds = new Set(dismissed.map((d) => d.notificationId))

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

  // High-priority open issues
  const CAT_LABELS: Record<string, string> = {
    leak: "Leak", equipment_failure: "Equipment Failure",
    safety_hazard: "Safety Hazard", water_quality: "Water Quality", other: "Issue",
  }
  for (const issue of highPriorityIssues) {
    notifications.push({
      id:       `issue-${issue.id}`,
      type:     "open_issue",
      severity: "red",
      label:    `${issue.customer.firstName} ${issue.customer.lastName} — ${CAT_LABELS[issue.category] ?? "Issue"}`,
      detail:   issue.notes.length > 60 ? issue.notes.slice(0, 60) + "…" : issue.notes,
      href:     `/customers/${issue.customer.id}`,
    })
  }

  // Chemical trend alerts — same reading out of range on 3+ consecutive visits
  const visitsByCustomer = new Map<string, typeof recentVisits>()
  for (const v of recentVisits) {
    const list = visitsByCustomer.get(v.customer.id)
    if (list) list.push(v)
    else visitsByCustomer.set(v.customer.id, [v])
  }
  const TREND_CHEMS = [
    { key: "chlorine"   as const, ...RANGES.chlorine },
    { key: "ph"         as const, ...RANGES.ph },
    { key: "alkalinity" as const, ...RANGES.alkalinity },
    { key: "calcium"    as const, ...RANGES.calcium },
    { key: "cya"        as const, ...RANGES.cya },
  ]
  for (const [, visits] of visitsByCustomer) {
    const trendFlags: string[] = []
    for (const chem of TREND_CHEMS) {
      const vals = visits
        .map((v) => v[chem.key])
        .filter((val): val is number => val != null)
      if (vals.length < 3) continue
      const last3 = vals.slice(0, 3)
      const allLow  = last3.every((val) => val < chem.min)
      const allHigh = last3.every((val) => val > chem.max)
      if (allLow || allHigh) trendFlags.push(`${chem.label} ${allLow ? "low" : "high"}`)
    }
    if (trendFlags.length > 0) {
      const customer = visits[0].customer
      notifications.push({
        id:       `trend-${customer.id}`,
        type:     "chemical_trend",
        severity: "amber",
        label:    `${customer.firstName} ${customer.lastName}`,
        detail:   `Persistent ${trendFlags.join(", ")} — 3 visits`,
        href:     `/reports/chemicals/${customer.id}`,
      })
    }
  }

  // Low ratings (1 or 2) in the last 30 days
  for (const v of lowRatingVisits) {
    const comment = v.feedbackComment ?? ""
    notifications.push({
      id:       `feedback-${v.id}`,
      type:     "low_rating",
      severity: "red",
      label:    `${v.customer.firstName} ${v.customer.lastName}`,
      detail:   `Rated ${v.rating}/5${comment ? ": " + comment.slice(0, 50) : ""}`,
      href:     `/customers/${v.customer.id}`,
    })
  }

  // Low / out-of-stock inventory
  for (const item of lowStockItems) {
    if (item.onHand > item.lowStockThreshold) continue
    const isOut = item.onHand <= 0
    notifications.push({
      id:       `stock-${item.id}`,
      type:     "low_stock",
      severity: isOut ? "red" : "amber",
      label:    item.name,
      detail:   isOut ? "Out of stock" : `${item.onHand} ${item.unit} remaining (threshold: ${item.lowStockThreshold})`,
      href:     "/inventory",
    })
  }

  // Pending visit requests
  for (const req of pendingRequests) {
    notifications.push({
      id:       `vreq-${req.id}`,
      type:     "visit_request",
      severity: "blue",
      label:    `${req.customer.firstName} ${req.customer.lastName} — visit request`,
      detail:   req.serviceType ?? "No service type specified",
      href:     "/schedule",
    })
  }

  return notifications.filter((n) => !dismissedIds.has(n.id))
}

// ── Admin notifications ───────────────────────────────────────────────────────
export async function getAdminNotifications(): Promise<AdminNotification[]> {
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // last 7 days

  const [newCompanies, openTickets, dismissed] = await Promise.all([
    db.company.findMany({
      where: { createdAt: { gte: since } },
      orderBy: { createdAt: "desc" },
      select: { id: true, name: true, createdAt: true },
    }),
    db.supportTicket.findMany({
      where: { status: { in: ["open", "in_progress"] } },
      orderBy: { updatedAt: "desc" },
      select: {
        id: true, subject: true, status: true, updatedAt: true,
        company: { select: { name: true } },
      },
    }),
    db.adminDismissedNotification.findMany({ select: { notificationId: true } }),
  ])

  const dismissedIds = new Set(dismissed.map((d) => d.notificationId))

  const notifications: AdminNotification[] = []

  for (const t of openTickets) {
    notifications.push({
      id:     `ticket-${t.id}`,
      type:   "open_ticket",
      label:  t.company.name,
      detail: t.subject,
      href:   `/admin/support/${t.id}`,
    })
  }

  for (const c of newCompanies) {
    const daysAgo = Math.floor((Date.now() - c.createdAt.getTime()) / 86_400_000)
    notifications.push({
      id:     `company-${c.id}`,
      type:   "new_company",
      label:  c.name,
      detail: daysAgo === 0 ? "Joined today" : `${daysAgo} day${daysAgo !== 1 ? "s" : ""} ago`,
      href:   `/admin/companies/${c.id}`,
    })
  }

  return notifications.filter((n) => !dismissedIds.has(n.id))
}
