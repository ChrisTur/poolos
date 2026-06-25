"use server"

import { db } from "@/lib/db"
import { requireSession } from "@/lib/session"

export async function getMonthVisits(year: number, month: number) {
  const { companyId } = await requireSession()
  const start = new Date(year, month, 1)
  const end   = new Date(year, month + 1, 0, 23, 59, 59, 999)

  return db.serviceVisit.findMany({
    where: {
      customer: { companyId },
      visitedAt: { gte: start, lte: end },
    },
    select: {
      id:          true,
      visitedAt:   true,
      status:      true,
      customer:    { select: { id: true, firstName: true, lastName: true } },
      route:       { select: { id: true, name: true } },
      technician:  { select: { id: true, firstName: true, lastName: true } },
    },
    orderBy: { visitedAt: "asc" },
  })
}
