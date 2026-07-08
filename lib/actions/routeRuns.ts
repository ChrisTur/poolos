"use server"

import { db } from "@/lib/db"
import { requirePermission } from "@/lib/session"
import { revalidatePath } from "next/cache"

function todayMidnight() {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d
}

export async function startRouteRun(formData: FormData) {
  const { companyId, userId } = await requirePermission("routes.view")
  const routeId = formData.get("routeId") as string
  const odometerStart = formData.get("odometerStart") ? parseFloat(formData.get("odometerStart") as string) : null

  const route = await db.route.findFirst({ where: { id: routeId, companyId } })
  if (!route) return

  // Only one active run per route per day
  const existing = await db.routeRun.findFirst({
    where: { routeId, companyId, date: todayMidnight(), completedAt: null },
  })
  if (existing) return

  await db.routeRun.create({
    data: {
      routeId,
      companyId,
      technicianId: userId,
      date: todayMidnight(),
      startedAt: new Date(),
      odometerStart,
    },
  })

  revalidatePath(`/routes/${routeId}`)
}

export async function completeRouteRun(formData: FormData) {
  const { companyId } = await requirePermission("routes.view")
  const runId = formData.get("runId") as string
  const odometerEnd = formData.get("odometerEnd") ? parseFloat(formData.get("odometerEnd") as string) : null
  const notes = (formData.get("notes") as string) || null

  const run = await db.routeRun.findFirst({ where: { id: runId, companyId } })
  if (!run) return

  await db.routeRun.update({
    where: { id: runId },
    data: { completedAt: new Date(), odometerEnd, notes },
  })

  revalidatePath(`/routes/${run.routeId}`)
}

export async function addExtraStop(formData: FormData) {
  const { companyId } = await requirePermission("routes.view")
  const runId = formData.get("runId") as string
  const type  = formData.get("type") as string
  const label = (formData.get("label") as string).trim()
  const notes = (formData.get("notes") as string) || null

  const run = await db.routeRun.findFirst({ where: { id: runId, companyId } })
  if (!run || !label) return

  await db.routeRunExtraStop.create({
    data: { routeRunId: runId, type, label, notes },
  })

  revalidatePath(`/routes/${run.routeId}`)
}

export async function deleteExtraStop(stopId: string, routeId: string) {
  const { companyId } = await requirePermission("routes.view")
  const stop = await db.routeRunExtraStop.findFirst({
    where: { id: stopId, routeRun: { companyId } },
  })
  if (!stop) return
  await db.routeRunExtraStop.delete({ where: { id: stopId } })
  revalidatePath(`/routes/${routeId}`)
}
