import { requirePermission } from "@/lib/session"
import { db } from "@/lib/db"
import { toCsv } from "@/lib/csv"
import { zipSync, strToU8 } from "fflate"
import { invoiceTotal, paymentTotal } from "@/lib/utils"

export const dynamic = "force-dynamic"

function fmt(d: Date | null | undefined) {
  return d ? d.toISOString().split("T")[0] : ""
}

function userName(u: { firstName: string; lastName: string } | null | undefined) {
  return u ? `${u.firstName} ${u.lastName}` : ""
}

export async function GET() {
  const { companyId, companyName } = await requirePermission("data.export")

  // Split into two parallel batches so TypeScript infers include types correctly
  const [customers, notes, messages, routes, stops, visits, chemUsage, invoices] =
    await Promise.all([
      db.customer.findMany({
        where: { companyId },
        orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
      }),
      db.customerNote.findMany({
        where:   { customer: { companyId } },
        include: { customer: { select: { firstName: true, lastName: true } } },
        orderBy: { createdAt: "desc" },
      }),
      db.customerMessage.findMany({
        where:   { companyId },
        include: { customer: { select: { firstName: true, lastName: true } } },
        orderBy: { createdAt: "desc" },
      }),
      db.route.findMany({ where: { companyId }, orderBy: { name: "asc" } }),
      db.routeStop.findMany({
        where:   { route: { companyId } },
        include: {
          route:    { select: { name: true } },
          customer: { select: { firstName: true, lastName: true } },
        },
        orderBy: { position: "asc" },
      }),
      db.serviceVisit.findMany({
        where:   { customer: { companyId } },
        include: {
          customer:   { select: { firstName: true, lastName: true } },
          technician: { select: { firstName: true, lastName: true } },
        },
        orderBy: { visitedAt: "desc" },
      }),
      db.chemicalUsage.findMany({
        where: { companyId },
        orderBy: { createdAt: "desc" },
      }),
      db.invoice.findMany({
        where:   { companyId },
        include: { customer: { select: { firstName: true, lastName: true } }, items: true, payments: true },
        orderBy: { issuedAt: "desc" },
      }),
    ])

  const [payments, estimates, expenses, vendors, equipment, equipmentServices, issues, tags] =
    await Promise.all([
      db.payment.findMany({
        where:   { invoice: { companyId } },
        include: { invoice: { select: { invoiceNumber: true } } },
        orderBy: { createdAt: "desc" },
      }),
      db.estimate.findMany({
        where:   { companyId },
        include: { customer: { select: { firstName: true, lastName: true } }, items: true },
        orderBy: { createdAt: "desc" },
      }),
      db.expense.findMany({ where: { companyId }, orderBy: { date: "desc" } }),
      db.vendor.findMany({ where: { companyId }, orderBy: { name: "asc" } }),
      db.equipment.findMany({
        where:   { customer: { companyId } },
        include: { customer: { select: { firstName: true, lastName: true } } },
        orderBy: { createdAt: "desc" },
      }),
      db.equipmentService.findMany({
        where:   { equipment: { customer: { companyId } } },
        include: {
          equipment:  { select: { type: true, brand: true } },
          technician: { select: { firstName: true, lastName: true } },
        },
        orderBy: { date: "desc" },
      }),
      db.issueReport.findMany({
        where:   { companyId },
        include: { customer: { select: { firstName: true, lastName: true } } },
        orderBy: { createdAt: "desc" },
      }),
      db.tag.findMany({
        where:   { companyId },
        include: { customers: { include: { customer: { select: { firstName: true, lastName: true } } } } },
        orderBy: { name: "asc" },
      }),
    ])

  // ── Build CSV sheets ──────────────────────────────────────────────────────

  const customersCsv = toCsv(customers.map((c) => ({
    "ID":                c.id,
    "First Name":        c.firstName,
    "Last Name":         c.lastName,
    "Email":             c.email ?? "",
    "Phone":             c.phone ?? "",
    "Address":           c.address,
    "City":              c.city,
    "State":             c.state,
    "Zip":               c.zip,
    "Pool Type":         c.poolType ?? "",
    "Pool Size":         c.poolSize ?? "",
    "Pool Notes":        c.poolNotes ?? "",
    "Monthly Rate":      c.monthlyRate?.toFixed(2) ?? "",
    "Service Frequency": c.serviceFrequency ?? "",
    "Status":            c.status,
    "Auto Pay":          c.autoPayEnabled ? "yes" : "no",
    "Created":           fmt(c.createdAt),
  })))

  const notesCsv = toCsv(notes.map((n) => ({
    "Customer": userName(n.customer),
    "Note":     n.body,
    "Date":     fmt(n.createdAt),
  })))

  const messagesCsv = toCsv(messages.map((m) => ({
    "Customer":  userName(m.customer),
    "Direction": m.fromCompany ? "outbound" : "inbound",
    "Body":      m.body,
    "Sent By":   m.sentByName ?? "",
    "Via Email": m.sentViaEmail ? "yes" : "no",
    "Date":      fmt(m.createdAt),
  })))

  const routesCsv = toCsv(routes.map((r) => ({
    "ID":      r.id,
    "Name":    r.name,
    "Day":     r.dayOfWeek ?? "",
    "Active":  r.isActive ? "yes" : "no",
    "Created": fmt(r.createdAt),
  })))

  const stopsCsv = toCsv(stops.map((s) => ({
    "Route":    s.route.name,
    "Customer": userName(s.customer),
    "Position": s.position,
  })))

  const visitsCsv = toCsv(visits.map((v) => ({
    "ID":         v.id,
    "Customer":   userName(v.customer),
    "Date":       fmt(v.visitedAt),
    "Status":     v.status,
    "Technician": userName(v.technician),
    "Chlorine":   v.chlorine ?? "",
    "pH":         v.ph ?? "",
    "Alkalinity": v.alkalinity ?? "",
    "Calcium":    v.calcium ?? "",
    "CYA":        v.cya ?? "",
    "Salt":       v.salt ?? "",
    "Saltwater":  v.saltwater ? "yes" : "no",
    "Notes":      v.notes ?? "",
  })))

  const chemUsageCsv = toCsv(chemUsage.map((c) => ({
    "Visit ID":   c.visitId,
    "Product":    c.productName,
    "Quantity":   c.quantity,
    "Unit":       c.unit,
    "Unit Cost":  c.unitCost.toFixed(2),
    "Total Cost": c.totalCost.toFixed(2),
  })))

  const invoicesCsv = toCsv(invoices.map((inv) => {
    const total = invoiceTotal(inv.items)
    const paid  = paymentTotal(inv.payments)
    return {
      "Invoice #":    inv.invoiceNumber,
      "Customer":     userName(inv.customer),
      "Issued":       fmt(inv.issuedAt),
      "Due":          fmt(inv.dueDate),
      "Service Type": inv.serviceType ?? "",
      "Status":       inv.status,
      "Total":        total.toFixed(2),
      "Paid":         paid.toFixed(2),
      "Balance":      Math.max(0, total - paid).toFixed(2),
      "Notes":        inv.notes ?? "",
    }
  }))

  const invoiceItemsCsv = toCsv(invoices.flatMap((inv) =>
    inv.items.map((item) => ({
      "Invoice #":   inv.invoiceNumber,
      "Description": item.description,
      "Quantity":    item.quantity,
      "Unit Price":  item.unitPrice.toFixed(2),
      "Total":       (item.quantity * item.unitPrice).toFixed(2),
    }))
  ))

  const paymentsCsv = toCsv(payments.map((p) => ({
    "Invoice #": p.invoice.invoiceNumber,
    "Amount":    p.amount.toFixed(2),
    "Method":    p.method ?? "",
    "Reference": p.reference ?? "",
    "Notes":     p.notes ?? "",
    "Date":      fmt(p.createdAt),
  })))

  const estimatesCsv = toCsv(estimates.map((e) => ({
    "Estimate #":  e.estimateNumber,
    "Customer":    userName(e.customer),
    "Service Type":e.serviceType ?? "",
    "Status":      e.status,
    "Total":       e.items.reduce((s, i) => s + i.quantity * i.unitPrice, 0).toFixed(2),
    "Valid Until": fmt(e.validUntil),
    "Signed By":   e.signedByName ?? "",
    "Signed At":   fmt(e.signedAt),
    "Notes":       e.notes ?? "",
    "Created":     fmt(e.createdAt),
  })))

  const expensesCsv = toCsv(expenses.map((e) => ({
    "Date":        fmt(e.date),
    "Vendor":      e.vendor ?? "",
    "Category":    e.category,
    "Description": e.description,
    "Amount":      e.amount.toFixed(2),
    "Notes":       e.notes ?? "",
  })))

  const vendorsCsv = toCsv(vendors.map((v) => ({
    "Name":     v.name,
    "Category": v.category ?? "",
    "Notes":    v.notes ?? "",
  })))

  const equipmentCsv = toCsv(equipment.map((e) => ({
    "Customer":        userName(e.customer),
    "Type":            e.type,
    "Brand":           e.brand ?? "",
    "Model":           e.model ?? "",
    "Serial #":        e.serialNumber ?? "",
    "Installed":       fmt(e.installedAt),
    "Warranty Expiry": fmt(e.warrantyExpiry),
    "Notes":           e.notes ?? "",
  })))

  const equipmentServicesCsv = toCsv(equipmentServices.map((s) => ({
    "Equipment":  `${s.equipment.brand ?? ""} ${s.equipment.type}`.trim(),
    "Date":       fmt(s.date),
    "Description":s.description,
    "Parts":      s.parts ?? "",
    "Labor Cost": s.laborCost.toFixed(2),
    "Parts Cost": s.partsCost.toFixed(2),
    "Technician": userName(s.technician),
    "Notes":      s.notes ?? "",
  })))

  const issuesCsv = toCsv(issues.map((i) => ({
    "Customer": userName(i.customer),
    "Category": i.category,
    "Priority": i.priority,
    "Status":   i.status,
    "Notes":    i.notes,
    "Created":  fmt(i.createdAt),
    "Updated":  fmt(i.updatedAt),
  })))

  const tagsCsv = toCsv(tags.flatMap((t) =>
    t.customers.map((ct) => ({
      "Tag":      t.name,
      "Customer": userName(ct.customer),
    }))
  ))

  // ── Zip everything ────────────────────────────────────────────────────────

  const date     = new Date().toISOString().split("T")[0]
  const safeName = companyName.replace(/[^a-z0-9]/gi, "-").toLowerCase()

  const zip = zipSync({
    "customers.csv":          strToU8(customersCsv),
    "customer-notes.csv":     strToU8(notesCsv),
    "customer-messages.csv":  strToU8(messagesCsv),
    "customer-tags.csv":      strToU8(tagsCsv),
    "routes.csv":             strToU8(routesCsv),
    "route-stops.csv":        strToU8(stopsCsv),
    "service-visits.csv":     strToU8(visitsCsv),
    "chemical-usage.csv":     strToU8(chemUsageCsv),
    "invoices.csv":           strToU8(invoicesCsv),
    "invoice-line-items.csv": strToU8(invoiceItemsCsv),
    "payments.csv":           strToU8(paymentsCsv),
    "estimates.csv":          strToU8(estimatesCsv),
    "expenses.csv":           strToU8(expensesCsv),
    "vendors.csv":            strToU8(vendorsCsv),
    "equipment.csv":          strToU8(equipmentCsv),
    "equipment-services.csv": strToU8(equipmentServicesCsv),
    "issues.csv":             strToU8(issuesCsv),
  }, { level: 6 })

  return new Response(zip, {
    headers: {
      "Content-Type":        "application/zip",
      "Content-Disposition": `attachment; filename="${safeName}-data-export-${date}.zip"`,
    },
  })
}
