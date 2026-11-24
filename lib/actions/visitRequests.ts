"use server"

import { db } from "@/lib/db"
import { requirePermission } from "@/lib/session"
import { revalidatePath } from "next/cache"
import { resend, extractFromEmail, buildVisitRequestNotificationHtml } from "@/lib/email"

export async function createVisitRequest(token: string, formData: FormData) {
  const customer = await db.customer.findUnique({
    where: { portalToken: token },
    select: {
      id: true,
      companyId: true,
      firstName: true,
      lastName: true,
      company: { select: { name: true, replyToEmail: true } },
    },
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

  // Notify company — fire-and-forget
  if (customer.company.replyToEmail) {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://poolos.biz"
    resend.emails.send({
      from: `PoolOS <${extractFromEmail()}>`,
      to: customer.company.replyToEmail,
      subject: `Visit request from ${customer.firstName} ${customer.lastName}`,
      html: buildVisitRequestNotificationHtml({
        companyName: customer.company.name,
        customerFirstName: customer.firstName,
        customerLastName: customer.lastName,
        preferredDate: preferredDate ? new Date(preferredDate) : null,
        serviceType,
        notes,
        scheduleUrl: `${appUrl}/schedule`,
      }),
    }).catch(() => {})
  }

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
