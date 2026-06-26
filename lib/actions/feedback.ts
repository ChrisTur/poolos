"use server"

import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"

export async function submitFeedback(token: string, rating: number, comment: string) {
  if (rating < 1 || rating > 5) return { error: "Invalid rating" }

  const visit = await db.serviceVisit.findUnique({
    where: { feedbackToken: token },
    select: {
      id: true, rating: true, customerId: true,
      customer: { select: { firstName: true, lastName: true } },
    },
  })
  if (!visit) return { error: "Invalid link" }
  if (visit.rating != null) return { error: "Already submitted" }

  await db.serviceVisit.update({
    where: { id: visit.id },
    data: { rating, feedbackComment: comment.trim() || null },
  })

  // Low rating (1 or 2) — we store the rating and getCompanyNotifications
  // will pick it up as a low_rating notification via the serviceVisit query.

  revalidatePath(`/customers/${visit.customerId}`)
  return { success: true }
}
