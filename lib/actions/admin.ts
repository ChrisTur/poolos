"use server"

import { auth } from "@/auth"
import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

async function requireSuperAdmin() {
  const session = await auth()
  if (session?.user?.email !== process.env.SUPER_ADMIN_EMAIL) redirect("/dashboard")
  return session!
}

export async function toggleCompany(id: string, isActive: boolean) {
  await requireSuperAdmin()
  await db.company.update({ where: { id }, data: { isActive } })
  revalidatePath("/admin/companies")
}
