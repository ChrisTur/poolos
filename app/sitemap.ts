import type { MetadataRoute } from "next"

const BASE = process.env.NEXT_PUBLIC_APP_URL ?? "https://poolos.biz"

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: `${BASE}/`,         changeFrequency: "weekly",  priority: 1.0 },
    { url: `${BASE}/pricing`,   changeFrequency: "weekly",  priority: 0.9 },
    { url: `${BASE}/chemistry`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE}/register`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE}/login`,    changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE}/contact`,  changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE}/privacy`,  changeFrequency: "yearly",  priority: 0.3 },
    { url: `${BASE}/terms`,    changeFrequency: "yearly",  priority: 0.3 },
  ]
}
