import { auth } from "@/auth"
import { redirect } from "next/navigation"

export async function requireSession() {
  const session = await auth()
  if (!session?.user) redirect("/login")
  return session.user
}

export async function requireOwner() {
  const user = await requireSession()
  if (user.role !== "owner") redirect("/dashboard")
  return user
}
