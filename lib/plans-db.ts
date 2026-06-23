import { db } from "@/lib/db"
import { PLANS, PLAN_IDS, type Plan, type PlanId } from "@/lib/plans"
import type { PlanConfigModel } from "@/app/generated/prisma/models/PlanConfig"

function rowToPlan(row: PlanConfigModel): Plan {
  return {
    id:           row.id as PlanId,
    label:        row.label,
    description:  row.description,
    priceMonthly: row.priceMonthly ?? null,
    priceAnnual:  row.priceAnnual  ?? undefined,
    badge:        row.badge,
    mostPopular:  row.mostPopular,
    highlights:   row.highlights,
    limits: {
      customers: row.limitCustomers === -1 ? Infinity : row.limitCustomers,
      staff:     row.limitStaff     === -1 ? Infinity : row.limitStaff,
    },
    features: {
      invoicing:          row.invoicing,
      routes:             row.routes,
      customerPortal:     row.customerPortal,
      chemicalTracking:   row.chemicalTracking,
      emailNotifications: row.emailNotifications,
      reports:            row.reports,
      csvExport:          row.csvExport,
      bulkInvoicing:      row.bulkInvoicing,
      fileAttachments:    row.fileAttachments,
      customBranding:     row.customBranding,
      smsNotifications:   row.smsNotifications,
      calendarView:       row.calendarView,
      techAssignment:     row.techAssignment,
      autoInvoicing:      row.autoInvoicing,
      quickbooksExport:   row.quickbooksExport,
    },
  }
}

/** All plans from DB; falls back to code defaults if the table is empty. */
export async function getPlansFromDb(): Promise<Plan[]> {
  const rows = await db.planConfig.findMany()
  if (rows.length === 0) return PLAN_IDS.map((id) => PLANS[id])
  // preserve order: trial, starter, pro, unlimited
  return PLAN_IDS.map((id) => {
    const row = rows.find((r) => r.id === id)
    return row ? rowToPlan(row) : PLANS[id]
  })
}

/** Single plan from DB; falls back to code default. */
export async function getPlanFromDb(id?: string | null): Promise<Plan> {
  const planId = (id ?? "trial") as PlanId
  const row = await db.planConfig.findUnique({ where: { id: planId } })
  if (!row) return PLANS[planId] ?? PLANS.trial
  return rowToPlan(row)
}

/** Upsert a plan config row — used by admin server action. */
export async function upsertPlanConfig(data: {
  id: string
  label: string
  description: string
  priceMonthly: number | null
  priceAnnual: number | null
  badge: string
  mostPopular: boolean
  highlights: string[]
  limitCustomers: number
  limitStaff: number
  invoicing: boolean
  routes: boolean
  customerPortal: boolean
  chemicalTracking: boolean
  emailNotifications: boolean
  reports: boolean
  csvExport: boolean
  bulkInvoicing: boolean
  fileAttachments: boolean
  customBranding: boolean
  smsNotifications: boolean
  calendarView: boolean
  techAssignment: boolean
  autoInvoicing: boolean
  quickbooksExport: boolean
}) {
  return db.planConfig.upsert({
    where: { id: data.id },
    create: data,
    update: data,
  })
}
