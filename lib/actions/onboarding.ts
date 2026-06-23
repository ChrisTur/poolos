"use server"

import { cookies } from "next/headers"
import { revalidatePath } from "next/cache"

export async function dismissOnboarding() {
  const cookieStore = await cookies()
  cookieStore.set("poolos_onboarding_dismissed", "1", {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 365,
    path: "/",
  })
  revalidatePath("/dashboard")
}
