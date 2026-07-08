import { NextRequest, NextResponse } from "next/server"
import { rateLimit } from "@/lib/rate-limit"
import { COOKIE_NAME } from "@/lib/auth"

const publicPrefixes = [
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/pricing",
  "/privacy",
  "/terms",
  "/contact",
  "/chemistry",
  "/api/auth",
  "/api/health",
  "/monitoring",
  "/opengraph-image",
  "/pay/",
  "/portal/",
  "/feedback/",
  "/blog",
  "/features",
  "/why",
  "/waitlist",
]

const WEBHOOK_PATHS = [
  "/api/stripe/webhook",
  "/api/stripe/billing-webhook",
]

// [pathPrefix, requestsAllowed, windowSeconds]
const RATE_RULES: [string, number, number][] = [
  ["/api/auth",        30,  60],
  ["/register",        15, 600],
  ["/forgot-password", 10, 600],
  ["/pay/",            60,  60],
  ["/portal/",         60,  60],
]

const SECURITY_HEADERS: Record<string, string> = {
  "X-Frame-Options":           "DENY",
  "X-Content-Type-Options":    "nosniff",
  "Referrer-Policy":           "strict-origin-when-cross-origin",
  "Permissions-Policy":        "camera=(), microphone=(), geolocation=()",
}

function clientIp(req: NextRequest): string {
  const fwd = req.headers.get("x-forwarded-for")
  if (fwd) return fwd.split(",")[0].trim()
  return req.headers.get("x-real-ip") ?? "unknown"
}

export default async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  if (!WEBHOOK_PATHS.some((p) => pathname.startsWith(p))) {
    const rule = RATE_RULES.find(([prefix]) => pathname.startsWith(prefix))
    if (rule) {
      const [prefix, limit, windowSec] = rule
      const result = await rateLimit(`${prefix}:${clientIp(req)}`, limit, windowSec * 1000)
      if (!result.allowed) {
        const retryAfter = Math.ceil((result.resetAt - Date.now()) / 1000)
        return new NextResponse("Too many requests — please wait and try again.", {
          status: 429,
          headers: {
            "Content-Type":          "text/plain",
            "Retry-After":           String(retryAfter),
            "X-RateLimit-Limit":     String(limit),
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset":     String(Math.ceil(result.resetAt / 1000)),
          },
        })
      }
    }
  }

  const isPublic =
    pathname === "/" ||
    pathname === "/sitemap.xml" ||
    pathname === "/robots.txt" ||
    publicPrefixes.some((p) => pathname.startsWith(p)) ||
    WEBHOOK_PATHS.some((p) => pathname.startsWith(p))

  const hasSession = req.cookies.has(COOKIE_NAME)

  if (!hasSession && !isPublic) {
    return NextResponse.redirect(new URL("/login", req.url))
  }

  const res = NextResponse.next()
  for (const [k, v] of Object.entries(SECURITY_HEADERS)) res.headers.set(k, v)
  return res
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|public).*)"],
}
