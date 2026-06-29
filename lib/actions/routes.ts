"use server"

import crypto from "crypto"
import { db } from "@/lib/db"
import { requirePermission } from "@/lib/session"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { resend, FROM, buildVisitCompletionHtml, buildReviewRequestHtml } from "@/lib/email"
import { geocodeAddress, nearestNeighborOrder, nearestNeighborOrderFromStart } from "@/lib/geocode"

export async function createRoute(formData: FormData) {
  const { companyId } = await requirePermission("routes.manage")

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
  const { companyId } = await requirePermission("routes.manage")
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
  const { companyId } = await requirePermission("routes.manage")
  await db.route.deleteMany({ where: { id, companyId } })
  revalidatePath("/routes")
  redirect("/routes")
}

export async function addStopToRoute(routeId: string, formData: FormData) {
  const { companyId } = await requirePermission("routes.manage")
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
  const { companyId } = await requirePermission("routes.manage")
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
  const { companyId } = await requirePermission("routes.manage")
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

// Move a stop to a different route (or reorder within same route).
// toRouteId = null means remove from all routes (back to unscheduled).
// customerId + toRouteId used when dragging an unscheduled customer onto a route.
export async function moveStopToRoute({
  stopId,
  customerId,
  fromRouteId,
  toRouteId,
  toPosition,
}: {
  stopId?: string
  customerId?: string
  fromRouteId?: string
  toRouteId: string | null
  toPosition: number
}) {
  const { companyId } = await requirePermission("routes.manage")

  // Dropping onto unscheduled — remove the stop
  if (!toRouteId) {
    if (!stopId) return
    const stop = await db.routeStop.findFirst({
      where: { id: stopId, route: { companyId } },
    })
    if (!stop) return
    await db.routeStop.delete({ where: { id: stopId } })
    // Compact positions on the source route
    const remaining = await db.routeStop.findMany({
      where: { routeId: stop.routeId },
      orderBy: { position: "asc" },
    })
    for (let i = 0; i < remaining.length; i++) {
      await db.routeStop.update({ where: { id: remaining[i].id }, data: { position: i } })
    }
    revalidatePath("/routes")
    if (fromRouteId) revalidatePath(`/routes/${fromRouteId}`)
    return
  }

  // Verify target route belongs to company
  const targetRoute = await db.route.findFirst({ where: { id: toRouteId, companyId } })
  if (!targetRoute) return

  // Dragging an unscheduled customer onto a route — create new stop
  if (!stopId && customerId) {
    const exists = await db.routeStop.findFirst({ where: { routeId: toRouteId, customerId } })
    if (exists) return
    // Make room at toPosition
    await db.routeStop.updateMany({
      where: { routeId: toRouteId, position: { gte: toPosition } },
      data: { position: { increment: 1 } },
    })
    await db.routeStop.create({ data: { routeId: toRouteId, customerId, position: toPosition } })
    revalidatePath("/routes")
    revalidatePath(`/routes/${toRouteId}`)
    return
  }

  if (!stopId) return
  const stop = await db.routeStop.findFirst({
    where: { id: stopId, route: { companyId } },
  })
  if (!stop) return

  const sameRoute = stop.routeId === toRouteId

  if (sameRoute) {
    // Reorder within same route
    const stops = await db.routeStop.findMany({
      where: { routeId: toRouteId },
      orderBy: { position: "asc" },
    })
    const reordered = stops.filter((s) => s.id !== stopId)
    reordered.splice(toPosition, 0, stop)
    for (let i = 0; i < reordered.length; i++) {
      await db.routeStop.update({ where: { id: reordered[i].id }, data: { position: i } })
    }
    revalidatePath(`/routes/${toRouteId}`)
  } else {
    // Move to different route — check unique constraint first
    const alreadyOnTarget = await db.routeStop.findFirst({
      where: { routeId: toRouteId, customerId: stop.customerId },
    })
    if (alreadyOnTarget) return

    // Remove from source and compact
    await db.routeStop.delete({ where: { id: stopId } })
    const sourceRemaining = await db.routeStop.findMany({
      where: { routeId: stop.routeId },
      orderBy: { position: "asc" },
    })
    for (let i = 0; i < sourceRemaining.length; i++) {
      await db.routeStop.update({ where: { id: sourceRemaining[i].id }, data: { position: i } })
    }

    // Insert at position in target route
    await db.routeStop.updateMany({
      where: { routeId: toRouteId, position: { gte: toPosition } },
      data: { position: { increment: 1 } },
    })
    await db.routeStop.create({
      data: { routeId: toRouteId, customerId: stop.customerId, position: toPosition },
    })

    revalidatePath("/routes")
    revalidatePath(`/routes/${stop.routeId}`)
    revalidatePath(`/routes/${toRouteId}`)
  }
}

export async function logVisit(formData: FormData) {
  const session = await requirePermission("schedule.log")
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
      db.customer.findUnique({ where: { id: customerId }, select: { email: true, firstName: true, portalToken: true, reviewRequestSentAt: true } }),
      db.company.findUnique({ where: { id: companyId }, select: { name: true, logoUrl: true, phone: true, bccEmail: true, replyToEmail: true, reviewRequestEnabled: true, reviewRequestAfterVisits: true, googleReviewUrl: true } }),
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

      // Review request: send once when customer hits the configured visit threshold
      if (
        company.reviewRequestEnabled &&
        company.googleReviewUrl &&
        customer.email &&
        !customer.reviewRequestSentAt
      ) {
        const completedCount = await db.serviceVisit.count({
          where: { customerId, customer: { companyId }, status: "completed" },
        })
        if (completedCount >= company.reviewRequestAfterVisits) {
          const fromEmail = FROM.match(/<(.+)>/)?.[1] ?? FROM
          const reviewSubject = `Quick favor — leave us a review?`
          const { data: reviewData, error: reviewError } = await resend.emails.send({
            from: `${company.name} <${fromEmail}>`,
            to: customer.email,
            replyTo: company.replyToEmail ?? undefined,
            subject: reviewSubject,
            html: buildReviewRequestHtml({
              companyName: company.name,
              companyLogoUrl: company.logoUrl,
              companyPhone: company.phone,
              customerFirstName: customer.firstName,
              googleReviewUrl: company.googleReviewUrl,
              sentByName: session.name,
            }),
          })
          const reviewStatus = reviewError ? "failed" : "sent"
          await Promise.all([
            db.emailLog.create({
              data: {
                type: "review_request",
                status: reviewStatus,
                toEmail: customer.email,
                subject: reviewSubject,
                resendId: reviewData?.id ?? null,
                customerId,
                companyId,
                serviceVisitId: visit.id,
              },
            }),
            reviewStatus === "sent"
              ? db.customer.update({ where: { id: customerId }, data: { reviewRequestSentAt: new Date() } })
              : Promise.resolve(),
          ])
        }
      }
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

export async function optimizeRoute(
  routeId: string,
  startAddress?: string,
): Promise<{ optimized: boolean; message: string }> {
  const { companyId } = await requirePermission("routes.manage")

  const [route, company] = await Promise.all([
    db.route.findFirst({
      where: { id: routeId, companyId },
      include: {
        stops: { orderBy: { position: "asc" }, include: { customer: true } },
        assignedUser: { select: { defaultStartAddress: true } },
      },
    }),
    db.company.findUnique({
      where: { id: companyId },
      select: { address: true, city: true, state: true, zip: true },
    }),
  ])

  if (!route) return { optimized: false, message: "Route not found." }
  if (route.stops.length < 3) return { optimized: false, message: "Need at least 3 stops to optimize." }

  const stopCoords = await Promise.all(
    route.stops.map((stop) =>
      geocodeAddress(`${stop.customer.address}, ${stop.customer.city}, ${stop.customer.state} ${stop.customer.zip}`)
    ),
  )

  if (stopCoords.some((c) => c === null)) {
    return { optimized: false, message: "Could not geocode all addresses — check that every stop has a full address." }
  }

  // Resolve start address: ad-hoc > tech default > company address
  const resolvedStart =
    startAddress?.trim() ||
    route.assignedUser?.defaultStartAddress ||
    (company?.address ? `${company.address}, ${company.city}, ${company.state} ${company.zip}` : null)

  const startCoord = resolvedStart ? await geocodeAddress(resolvedStart) : null

  const orderedIndices = startCoord
    ? nearestNeighborOrderFromStart(stopCoords as Array<{ lat: number; lng: number }>, startCoord)
    : nearestNeighborOrder(stopCoords as Array<{ lat: number; lng: number }>)

  const orderedIds = orderedIndices.map((i) => route.stops[i].id)

  for (let i = 0; i < orderedIds.length; i++) {
    await db.routeStop.update({ where: { id: orderedIds[i] }, data: { position: i } })
  }

  revalidatePath(`/routes/${routeId}`)
  return { optimized: true, message: `Optimized ${route.stops.length} stops.` }
}
