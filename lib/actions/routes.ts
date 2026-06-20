"use server"

import { db } from "@/lib/db"
import { requireSession } from "@/lib/session"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { resend, FROM, buildVisitCompletionHtml } from "@/lib/email"

export async function createRoute(formData: FormData) {
  const { companyId } = await requireSession()

  const route = await db.route.create({
    data: {
      companyId,
      name: formData.get("name") as string,
      description: (formData.get("description") as string) || null,
      dayOfWeek: formData.get("dayOfWeek") ? parseInt(formData.get("dayOfWeek") as string) : null,
    },
  })
  revalidatePath("/routes")
  redirect(`/routes/${route.id}`)
}

export async function updateRoute(id: string, formData: FormData) {
  const { companyId } = await requireSession()
  const route = await db.route.findFirst({ where: { id, companyId } })
  if (!route) return

  await db.route.update({
    where: { id },
    data: {
      name: formData.get("name") as string,
      description: (formData.get("description") as string) || null,
      dayOfWeek: formData.get("dayOfWeek") !== "" ? parseInt(formData.get("dayOfWeek") as string) : null,
      isActive: formData.get("isActive") === "true",
    },
  })
  revalidatePath(`/routes/${id}`)
  revalidatePath("/routes")
}

export async function deleteRoute(id: string) {
  const { companyId } = await requireSession()
  await db.route.deleteMany({ where: { id, companyId } })
  revalidatePath("/routes")
  redirect("/routes")
}

export async function addStopToRoute(routeId: string, formData: FormData) {
  const { companyId } = await requireSession()
  const route = await db.route.findFirst({ where: { id: routeId, companyId } })
  if (!route) return

  const customerId = formData.get("customerId") as string
  if (!customerId) return

  const lastStop = await db.routeStop.findFirst({
    where: { routeId },
    orderBy: { position: "desc" },
  })

  await db.routeStop.create({
    data: {
      routeId,
      customerId,
      position: (lastStop?.position ?? -1) + 1,
      notes: (formData.get("notes") as string) || null,
    },
  })
  revalidatePath(`/routes/${routeId}`)
}

export async function removeStopFromRoute(stopId: string, routeId: string) {
  const { companyId } = await requireSession()
  const route = await db.route.findFirst({ where: { id: routeId, companyId } })
  if (!route) return
  await db.routeStop.delete({ where: { id: stopId } })
  const remaining = await db.routeStop.findMany({
    where: { routeId },
    orderBy: { position: "asc" },
  })
  for (let i = 0; i < remaining.length; i++) {
    await db.routeStop.update({ where: { id: remaining[i].id }, data: { position: i } })
  }
  revalidatePath(`/routes/${routeId}`)
}

export async function reorderStops(routeId: string, orderedStopIds: string[]) {
  const { companyId } = await requireSession()
  const route = await db.route.findFirst({ where: { id: routeId, companyId } })
  if (!route) return
  for (let i = 0; i < orderedStopIds.length; i++) {
    await db.routeStop.update({
      where: { id: orderedStopIds[i] },
      data: { position: i },
    })
  }
  revalidatePath(`/routes/${routeId}`)
}

export async function logVisit(formData: FormData) {
  const { companyId } = await requireSession()

  const customerId = formData.get("customerId") as string
  const status = (formData.get("status") as string) || "completed"
  const chlorine   = formData.get("chlorine")   ? parseFloat(formData.get("chlorine")   as string) : null
  const ph         = formData.get("ph")         ? parseFloat(formData.get("ph")         as string) : null
  const alkalinity = formData.get("alkalinity") ? parseFloat(formData.get("alkalinity") as string) : null
  const calcium    = formData.get("calcium")    ? parseFloat(formData.get("calcium")    as string) : null
  const notes      = (formData.get("notes") as string) || null

  const visit = await db.serviceVisit.create({
    data: {
      customerId,
      routeId: (formData.get("routeId") as string) || null,
      status,
      notes,
      chlorine,
      ph,
      alkalinity,
      calcium,
    },
  })

  // Send completion email if status is completed and customer has an email
  if (status === "completed") {
    const [customer, company] = await Promise.all([
      db.customer.findUnique({ where: { id: customerId }, select: { email: true, firstName: true } }),
      db.company.findUnique({ where: { id: companyId }, select: { name: true, logoUrl: true, phone: true, bccEmail: true, replyToEmail: true } }),
    ])

    if (customer?.email && company) {
      const html = buildVisitCompletionHtml({
        companyName: company.name,
        companyLogoUrl: company.logoUrl,
        companyPhone: company.phone,
        customerFirstName: customer.firstName,
        visitedAt: visit.visitedAt,
        status: visit.status,
        notes: visit.notes,
        chlorine,
        ph,
        alkalinity,
        calcium,
      })

      const fromEmail = FROM.match(/<(.+)>/)?.[1] ?? FROM
      const subject = `Service completed — ${new Date(visit.visitedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`

      let emailStatus: "sent" | "failed" = "sent"
      try {
        await resend.emails.send({
          from: `${company.name} <${fromEmail}>`,
          to: customer.email,
          bcc: company.bccEmail ?? undefined,
          replyTo: company.replyToEmail ?? undefined,
          subject,
          html,
        })
      } catch {
        emailStatus = "failed"
      }

      await db.emailLog.create({
        data: {
          type: "visit",
          status: emailStatus,
          toEmail: customer.email,
          bccEmail: company.bccEmail ?? null,
          subject,
          customerId,
          companyId,
          serviceVisitId: visit.id,
        },
      })
    }
  }

  revalidatePath("/dashboard")
  revalidatePath("/schedule")
}
