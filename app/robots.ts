import type { MetadataRoute } from "next"

const BASE = process.env.NEXT_PUBLIC_APP_URL ?? "https://poolos.biz"

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/pricing", "/chemistry", "/register", "/login", "/privacy", "/terms", "/contact"],
        disallow: [
          "/admin",
          "/api/",
          "/dashboard",
          "/customers",
          "/invoices",
          "/estimates",
          "/expenses",
          "/reports",
          "/routes",
          "/schedule",
          "/settings",
          "/pay/",      // token-based invoice pay — not useful to index
          "/portal/",   // token-based customer portal — not useful to index
        ],
      },
    ],
    sitemap: `${BASE}/sitemap.xml`,
  }
}
