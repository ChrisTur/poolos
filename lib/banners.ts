import { db } from "@/lib/db"

export async function getActiveBanner(context: "marketing" | "app") {
  const now = new Date()
  return db.promoBanner.findFirst({
    where: {
      active: true,
      ...(context === "marketing" ? { showOnMarketing: true } : { showInApp: true }),
      OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
    },
    orderBy: { createdAt: "desc" },
  })
}

export type BannerData = {
  id: string
  message: string
  code: string | null
  bgColor: string
  dismissible: boolean
}
