import type { MetadataRoute } from "next"

const BASE = process.env.NEXT_PUBLIC_APP_URL ?? "https://poolos.netlify.app"

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/register", "/login"],
        disallow: ["/dashboard", "/customers", "/invoices", "/schedule", "/routes",
                   "/estimates", "/expenses", "/reports", "/settings", "/admin", "/api/"],
      },
    ],
    sitemap: `${BASE}/sitemap.xml`,
  }
}
