"use server"

import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"
import { upsertPlanConfig } from "@/lib/plans-db"
import { PLANS, PLAN_IDS } from "@/lib/plans"
import { db } from "@/lib/db"

async function requireSuperAdmin() {
  const session = await auth()
  if (session?.user?.email !== process.env.SUPER_ADMIN_EMAIL) redirect("/dashboard")
}

function bool(val: FormDataEntryValue | null): boolean {
  return val === "on" || val === "true" || val === "1"
}

function int(val: FormDataEntryValue | null, fallback = 0): number {
  const n = parseInt(val as string, 10)
  return isNaN(n) ? fallback : n
}

export async function updatePlan(formData: FormData) {
  await requireSuperAdmin()

  const id = formData.get("id") as string
  if (!PLAN_IDS.includes(id as any)) throw new Error("Invalid plan id")

  await upsertPlanConfig({
    id,
    label:        (formData.get("label") as string).trim(),
    description:  (formData.get("description") as string).trim(),
    priceMonthly: formData.get("priceMonthly") ? int(formData.get("priceMonthly")) : null,
    priceAnnual:  formData.get("priceAnnual")  ? int(formData.get("priceAnnual"))  : null,
    badge:        (formData.get("badge") as string).trim(),
    mostPopular:  bool(formData.get("mostPopular")),
    highlights:   (formData.get("highlights") as string)
                    .split("\n")
                    .map((h) => h.trim())
                    .filter(Boolean),
    limitCustomers: int(formData.get("limitCustomers"), 50),
    limitStaff:     int(formData.get("limitStaff"), 2),
    invoicing:          bool(formData.get("invoicing")),
    routes:             bool(formData.get("routes")),
    customerPortal:     bool(formData.get("customerPortal")),
    chemicalTracking:   bool(formData.get("chemicalTracking")),
    emailNotifications: bool(formData.get("emailNotifications")),
    reports:            bool(formData.get("reports")),
    csvExport:          bool(formData.get("csvExport")),
    bulkInvoicing:      bool(formData.get("bulkInvoicing")),
    fileAttachments:    bool(formData.get("fileAttachments")),
    customBranding:     bool(formData.get("customBranding")),
    smsNotifications:   bool(formData.get("smsNotifications")),
    calendarView:       bool(formData.get("calendarView")),
    techAssignment:     bool(formData.get("techAssignment")),
    autoInvoicing:      bool(formData.get("autoInvoicing")),
    quickbooksExport:   bool(formData.get("quickbooksExport")),
  })

  revalidatePath("/admin/plans")
  revalidatePath("/admin/plans/" + id)
  revalidatePath("/")
  revalidatePath("/settings/billing")
  redirect("/admin/plans/" + id + "?saved=1")
}

export async function seedDefaultPlans() {
  await requireSuperAdmin()

  const count = await db.planConfig.count()
  if (count > 0) {
    redirect("/admin/plans")
  }

  for (const id of PLAN_IDS) {
    const p = PLANS[id]
    await upsertPlanConfig({
      id,
      label:         p.label,
      description:   p.description,
      priceMonthly:  p.priceMonthly,
      priceAnnual:   p.priceAnnual ?? null,
      badge:         p.badge,
      mostPopular:   p.mostPopular ?? false,
      highlights:    p.highlights,
      limitCustomers: p.limits.customers === Infinity ? -1 : p.limits.customers,
      limitStaff:     p.limits.staff     === Infinity ? -1 : p.limits.staff,
      ...p.features,
    })
  }

  revalidatePath("/admin/plans")
  redirect("/admin/plans")
}
