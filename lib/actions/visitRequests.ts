"use server"

import { db } from "@/lib/db"
import { requirePermission } from "@/lib/session"
import { revalidatePath } from "next/cache"

export async function createVisitRequest(token: string, formData: FormData) {
  const customer = await db.customer.findUnique({
    where: { portalToken: token },
    select: { id: true, companyId: true },
  })
  if (!customer) return { error: "Customer not found." }

  const preferredDate = formData.get("preferredDate") as string | null
  const serviceType   = (formData.get("serviceType") as string)?.trim() || null
  const notes         = (formData.get("notes") as string)?.trim() || null

  await db.visitRequest.create({
    data: {
      customerId:    customer.id,
      companyId:     customer.companyId,
      preferredDate: preferredDate ? new Date(preferredDate) : null,
      serviceType,
      notes,
    },
  })

  return { success: true }
}

export async function confirmVisitRequest(id: string) {
  const { companyId } = await requirePermission("schedule.log")

  const req = await db.visitRequest.findFirst({
    where: { id, companyId, status: "pending" },
    select: { id: true },
  })
  if (!req) return

  await db.visitRequest.update({
    where: { id },
    data: { status: "confirmed" },
  })

  revalidatePath("/schedule")
}

export async function declineVisitRequest(id: string, formData: FormData) {
  const { companyId } = await requirePermission("schedule.log")

  const declineReason = (formData.get("declineReason") as string)?.trim() || null

  const req = await db.visitRequest.findFirst({
    where: { id, companyId, status: "pending" },
    select: { id: true },
  })
  if (!req) return

  await db.visitRequest.update({
    where: { id },
    data: { status: "declined", declineReason },
  })

  revalidatePath("/schedule")
}
