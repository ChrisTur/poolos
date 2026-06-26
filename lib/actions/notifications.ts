"use server"

import { db } from "@/lib/db"
import { requireSession } from "@/lib/session"
import { requireSuperAdmin } from "@/lib/session"
import { revalidatePath } from "next/cache"

export async function dismissNotification(notificationId: string) {
  const { companyId } = await requireSession()

  await db.dismissedNotification.upsert({
    where: { companyId_notificationId: { companyId, notificationId } },
    create: { companyId, notificationId },
    update: {},
  })

  revalidatePath("/", "layout")
}

export async function dismissAdminNotification(notificationId: string) {
  await requireSuperAdmin()

  await db.adminDismissedNotification.upsert({
    where: { notificationId },
    create: { notificationId },
    update: {},
  })

  revalidatePath("/", "layout")
}
