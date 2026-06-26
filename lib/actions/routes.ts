"use server"

import crypto from "crypto"
import { db } from "@/lib/db"
import { requireSession } from "@/lib/session"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { resend, FROM, buildVisitCompletionHtml } from "@/lib/email"
import { geocodeAddress, nearestNeighborOrder } from "@/lib/geocode"

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

  const assignedUserId = formData.get("assignedUserId") as string | null
  await db.route.update({
    where: { id },
    data: {
      name:           formData.get("name") as string,
      description:    (formData.get("description") as string) || null,
      dayOfWeek:      formData.get("dayOfWeek") !== "" ? parseInt(formData.get("dayOfWeek") as string) : null,
      isActive:       formData.get("isActive") === "true",
      assignedUserId: assignedUserId || null,
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
  const session = await requireSession()
  const { companyId } = session

  const customerId       = formData.get("customerId") as string
  const status           = (formData.get("status") as string) || "completed"
  const attachmentKeys   = formData.getAll("attachmentKey") as string[]
  const technicianId     = (formData.get("technicianId") as string) || null
  const chlorine    = formData.get("chlorine")   ? parseFloat(formData.get("chlorine")   as string) : null
  const ph          = formData.get("ph")         ? parseFloat(formData.get("ph")         as string) : null
  const alkalinity  = formData.get("alkalinity") ? parseFloat(formData.get("alkalinity") as string) : null
  const calcium     = formData.get("calcium")    ? parseFloat(formData.get("calcium")    as string) : null
  const cya         = formData.get("cya")        ? parseFloat(formData.get("cya")        as string) : null
  const salt        = formData.get("salt")       ? parseFloat(formData.get("salt")       as string) : null
  const saltwater   = formData.get("saltwater") === "true"
  const notes       = (formData.get("notes") as string) || null

  // Resolve which technician's name to use in notifications
  let technicianName = session.name as string
  if (technicianId) {
    const tech = await db.user.findUnique({ where: { id: technicianId }, select: { firstName: true, lastName: true } })
    if (tech) technicianName = `${tech.firstName} ${tech.lastName}`
  }

  const visit = await db.serviceVisit.create({
    data: {
      customerId,
      routeId: (formData.get("routeId") as string) || null,
      technicianId,
      status,
      notes,
      chlorine,
      ph,
      alkalinity,
      calcium,
      cya,
      salt,
      saltwater,
    },
  })

  // On completed visits: store a CustomerMessage in the thread, optionally email the customer
  if (status === "completed") {
    const [customer, company] = await Promise.all([
      db.customer.findUnique({ where: { id: customerId }, select: { email: true, firstName: true, portalToken: true } }),
      db.company.findUnique({ where: { id: companyId }, select: { name: true, logoUrl: true, phone: true, bccEmail: true, replyToEmail: true } }),
    ])

    if (customer && company) {
      // Build a human-readable visit summary for the message thread
      const parts: string[] = [`Visit on ${new Date(visit.visitedAt).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}`]
      if (notes) parts.push(`Notes: ${notes}`)
      const readings: string[] = []
      if (chlorine   != null) readings.push(`Chlorine ${chlorine} ppm`)
      if (ph         != null) readings.push(`pH ${ph}`)
      if (alkalinity != null) readings.push(`Alkalinity ${alkalinity} ppm`)
      if (calcium    != null) readings.push(`Calcium ${calcium} ppm`)
      if (readings.length) parts.push(`Chemicals: ${readings.join(", ")}`)
      const messageBody = parts.join("\n")

      let emailSent = false

      const portalUrl = customer.portalToken
        ? `${process.env.NEXT_PUBLIC_APP_URL}/portal/${customer.portalToken}`
        : null

      // Generate feedback token and attach to visit
      let feedbackUrl: string | null = null
      if (customer.email) {
        const feedbackToken = crypto.randomUUID()
        await db.serviceVisit.update({ where: { id: visit.id }, data: { feedbackToken } })
        feedbackUrl = `${process.env.NEXT_PUBLIC_APP_URL}/feedback/${feedbackToken}`
      }

      if (customer.email) {
        const html = buildVisitCompletionHtml({
          companyName: company.name,
          companyLogoUrl: company.logoUrl,
          companyPhone: company.phone,
          customerFirstName: customer.firstName,
          visitedAt: visit.visitedAt,
          status: visit.status,
          notes: visit.notes,
          portalUrl,
          technicianName,
          chlorine,
          ph,
          alkalinity,
          calcium,
          feedbackUrl,
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
          emailSent = true
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

      await db.customerMessage.create({
        data: {
          body: messageBody,
          fromCompany: true,
          sentViaEmail: emailSent,
          sentByName: technicianName,
          serviceVisitId: visit.id,
          customerId,
          companyId,
        },
      })
    }
  }

  // Save any photos uploaded during visit logging
  if (attachmentKeys.length > 0) {
    await db.attachment.createMany({
      data: attachmentKeys.map((key) => ({
        key,
        filename: key.split("/").pop() ?? key,
        mimeType: "image/jpeg",
        customerId,
        serviceVisitId: visit.id,
        companyId,
      })),
    })
  }

  // Save chemical usages if provided
  const chemicalUsagesRaw = formData.get("chemicalUsages") as string | null
  if (chemicalUsagesRaw) {
    try {
      const usages = JSON.parse(chemicalUsagesRaw) as Array<{
        productName: string
        quantity: number
        unit: string
        unitCost: number
        totalCost: number
      }>
      const validUsages = usages.filter((u) => u.productName.trim() && u.quantity > 0)
      if (validUsages.length > 0) {
        await db.chemicalUsage.createMany({
          data: validUsages.map((u) => ({ ...u, visitId: visit.id, companyId })),
        })
      }
    } catch { /* ignore parse errors */ }
  }

  revalidatePath("/dashboard")
  revalidatePath("/schedule")
}

export async function optimizeRoute(routeId: string): Promise<{ optimized: boolean; message: string }> {
  const { companyId } = await requireSession()

  const route = await db.route.findFirst({
    where: { id: routeId, companyId },
    include: {
      stops: {
        orderBy: { position: "asc" },
        include: { customer: true },
      },
    },
  })

  if (!route) return { optimized: false, message: "Route not found." }
  if (route.stops.length < 3) return { optimized: false, message: "Need at least 3 stops to optimize." }

  const coords = await Promise.all(
    route.stops.map((stop) =>
      geocodeAddress(
        `${stop.customer.address}, ${stop.customer.city}, ${stop.customer.state} ${stop.customer.zip}`,
      ),
    ),
  )

  if (coords.some((c) => c === null)) {
    return { optimized: false, message: "Could not geocode all addresses — check that every stop has a full address." }
  }

  const order = nearestNeighborOrder(coords as Array<{ lat: number; lng: number }>)
  const orderedIds = order.map((i) => route.stops[i].id)

  for (let i = 0; i < orderedIds.length; i++) {
    await db.routeStop.update({ where: { id: orderedIds[i] }, data: { position: i } })
  }

  revalidatePath(`/routes/${routeId}`)
  return { optimized: true, message: `Optimized ${route.stops.length} stops.` }
}
