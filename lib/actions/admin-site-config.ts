"use server"

import { requireSuperAdmin } from "@/lib/session"
import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"

export async function saveSiteConfig(formData: FormData) {
  await requireSuperAdmin()

  const heroVideoUrl = ((formData.get("hero_video_url") as string) ?? "").trim()
  const waitlistCta  = ((formData.get("waitlist_cta")   as string) ?? "").trim()

  await Promise.all([
    db.siteConfig.upsert({
      where:  { key: "hero_video_url" },
      create: { key: "hero_video_url", value: heroVideoUrl },
      update: { value: heroVideoUrl },
    }),
    db.siteConfig.upsert({
      where:  { key: "waitlist_cta" },
      create: { key: "waitlist_cta", value: waitlistCta || "Join the waitlist" },
      update: { value: waitlistCta || "Join the waitlist" },
    }),
  ])

  revalidatePath("/")
  revalidatePath("/admin/site-config")
}
