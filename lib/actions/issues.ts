"use server"

import { db } from "@/lib/db"
import { requireSession } from "@/lib/session"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

// Used as a plain form action on the customer detail page (no return value needed)
export async function createIssueReport(formData: FormData) {
  const user = await requireSession()
  const companyId = user.companyId as string

  const customerId = formData.get("customerId") as string
  const category   = formData.get("category")   as string
  const priority   = formData.get("priority")   as string
  const notes      = (formData.get("notes") as string).trim()
  const visitId    = (formData.get("visitId") as string) || null

  if (!customerId || !category || !notes) return
  const customer = await db.customer.findFirst({ where: { id: customerId, companyId } })
  if (!customer) return

  await db.issueReport.create({
    data: { category, priority: priority || "normal", notes, customerId, companyId, visitId, reportedById: user.id },
  })

  revalidatePath(`/customers/${customerId}`)
  revalidatePath("/issues")
}

export async function createIssueFromList(_: unknown, formData: FormData) {
  const user = await requireSession()
  const companyId = user.companyId as string

  const customerId = formData.get("customerId") as string
  const category   = formData.get("category")   as string
  const priority   = formData.get("priority")   as string
  const notes      = (formData.get("notes") as string).trim()

  if (!customerId || !category || !notes) return { error: "All fields are required." }

  const customer = await db.customer.findFirst({ where: { id: customerId, companyId } })
  if (!customer) return { error: "Customer not found." }

  await db.issueReport.create({
    data: { category, priority: priority || "normal", notes, customerId, companyId, reportedById: user.id },
  })

  redirect("/issues")
}

export async function updateIssueStatus(issueId: string, status: string) {
  const user = await requireSession()
  const companyId = user.companyId as string

  const issue = await db.issueReport.findFirst({ where: { id: issueId, companyId } })
  if (!issue) return

  await db.issueReport.update({ where: { id: issueId }, data: { status } })

  revalidatePath("/issues")
  revalidatePath(`/customers/${issue.customerId}`)
}
