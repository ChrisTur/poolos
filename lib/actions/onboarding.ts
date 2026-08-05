"use server"

import { db } from "@/lib/db"
import { requireSession } from "@/lib/session"
import { revalidatePath } from "next/cache"

export async function dismissOnboarding() {
  const { companyId } = await requireSession()
  await db.company.update({
    where: { id: companyId },
    data: { onboardingDismissedAt: new Date() },
  })
  revalidatePath("/dashboard")
}
