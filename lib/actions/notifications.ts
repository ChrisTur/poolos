"use server"

import { db } from "@/lib/db"
import { getSession } from "@/lib/auth"

export async function dismissNotification(notificationId: string) {
  const session = await getSession()
  if (!session?.companyId) return

  await db.dismissedNotification.upsert({
    where: { companyId_notificationId: { companyId: session.companyId, notificationId } },
    create: { companyId: session.companyId, notificationId },
    update: {},
  })
}

export async function dismissAdminNotification(notificationId: string) {
  const session = await getSession()
  if (session?.role !== "super_admin") return

  await db.adminDismissedNotification.upsert({
    where: { notificationId },
    create: { notificationId },
    update: {},
  })
}
