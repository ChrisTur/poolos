"use server"

import { db } from "@/lib/db"
import { requireSession } from "@/lib/session"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

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

  await db.serviceVisit.create({
    data: {
      customerId: formData.get("customerId") as string,
      routeId: (formData.get("routeId") as string) || null,
      status: (formData.get("status") as string) || "completed",
      notes: (formData.get("notes") as string) || null,
      chlorine: formData.get("chlorine") ? parseFloat(formData.get("chlorine") as string) : null,
      ph: formData.get("ph") ? parseFloat(formData.get("ph") as string) : null,
      alkalinity: formData.get("alkalinity") ? parseFloat(formData.get("alkalinity") as string) : null,
      calcium: formData.get("calcium") ? parseFloat(formData.get("calcium") as string) : null,
    },
  })
  revalidatePath("/dashboard")
  revalidatePath("/schedule")
}
