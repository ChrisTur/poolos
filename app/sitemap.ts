import type { MetadataRoute } from "next"
import { db } from "@/lib/db"

const BASE = process.env.NEXT_PUBLIC_APP_URL ?? "https://poolos.biz"

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const publicProfiles = await db.company.findMany({
    where: { publicPageEnabled: true, isActive: true },
    select: { slug: true, updatedAt: true },
  })

  return [
    { url: `${BASE}/`,          changeFrequency: "weekly",  priority: 1.0 },
    { url: `${BASE}/features`,  changeFrequency: "weekly",  priority: 0.9 },
    { url: `${BASE}/why`,       changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE}/pricing`,   changeFrequency: "weekly",  priority: 0.9 },
    { url: `${BASE}/chemistry`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE}/register`,  changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE}/login`,     changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE}/contact`,   changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE}/privacy`,   changeFrequency: "yearly",  priority: 0.3 },
    { url: `${BASE}/terms`,     changeFrequency: "yearly",  priority: 0.3 },
    ...publicProfiles.map((c) => ({
      url:             `${BASE}/pro/${c.slug}`,
      changeFrequency: "weekly" as const,
      priority:        0.7,
      lastModified:    c.updatedAt,
    })),
  ]
}
