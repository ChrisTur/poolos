"use server"

import { db } from "@/lib/db"

export async function joinWaitlist(formData: FormData) {
  const email = ((formData.get("email") as string) ?? "").trim().toLowerCase()
  const name  = ((formData.get("name")  as string) ?? "").trim() || null

  if (!email || !email.includes("@")) {
    return { success: false, alreadyJoined: false, error: "A valid email address is required." }
  }

  const existing = await db.waitlistEntry.findUnique({ where: { email } })
  if (existing) {
    return { success: true, alreadyJoined: true }
  }

  await db.waitlistEntry.create({
    data: { email, name, source: "landing" },
  })

  return { success: true, alreadyJoined: false }
}
