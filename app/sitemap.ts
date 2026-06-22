import type { MetadataRoute } from "next"

const BASE = process.env.NEXT_PUBLIC_APP_URL ?? "https://poolos.netlify.app"

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: BASE,              lastModified: new Date(), changeFrequency: "monthly", priority: 1.0 },
    { url: `${BASE}/register`, lastModified: new Date(), changeFrequency: "yearly",  priority: 0.9 },
    { url: `${BASE}/login`,    lastModified: new Date(), changeFrequency: "yearly",  priority: 0.5 },
  ]
}
