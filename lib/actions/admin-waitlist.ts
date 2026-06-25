"use server"

import { requireSuperAdmin } from "@/lib/session"
import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"

export async function deleteWaitlistEntry(formData: FormData) {
  await requireSuperAdmin()
  const id = formData.get("id") as string
  await db.waitlistEntry.delete({ where: { id } })
  revalidatePath("/admin/waitlist")
}
