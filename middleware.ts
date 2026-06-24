import NextAuth from "next-auth"
import { authConfig } from "@/auth.config"
import { NextResponse } from "next/server"
import { rateLimit } from "@/lib/rate-limit"

const { auth } = NextAuth(authConfig)

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
  "/pay/",         // public invoice payment pages
  "/portal/",      // customer portal (token-based)
]

// Stripe sends bursts of retries — never rate-limit webhooks.
const WEBHOOK_PATHS = [
  "/api/stripe/webhook",
  "/api/stripe/billing-webhook",
]

// [pathPrefix, requestsAllowed, windowSeconds]
const RATE_RULES: [string, number, number][] = [
  ["/api/auth",        30,  60],   // auth endpoints  — 30 req/min  (brute-force)
  ["/register",        15, 600],   // sign-ups        — 15 per 10 min per IP
  ["/forgot-password", 10, 600],   // password reset  — 10 per 10 min per IP
  ["/pay/",            60,  60],   // public pay page — 60 req/min
  ["/portal/",         60,  60],   // customer portal — 60 req/min
]

function clientIp(req: Request): string {
  const fwd = (req.headers as Headers).get("x-forwarded-for")
  if (fwd) return fwd.split(",")[0].trim()
  return (req.headers as Headers).get("x-real-ip") ?? "unknown"
}

export default auth((req) => {
  const { pathname } = req.nextUrl

  // Rate limiting — skip Stripe webhooks.
  if (!WEBHOOK_PATHS.some((p) => pathname.startsWith(p))) {
    const rule = RATE_RULES.find(([prefix]) => pathname.startsWith(prefix))
    if (rule) {
      const [prefix, limit, windowSec] = rule
      const result = rateLimit(`${prefix}:${clientIp(req)}`, limit, windowSec * 1000)
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

  // Auth guard.
  const isPublic =
    pathname === "/" ||
    pathname === "/sitemap.xml" ||
    pathname === "/robots.txt" ||
    publicPrefixes.some((p) => pathname.startsWith(p)) ||
    WEBHOOK_PATHS.some((p) => pathname.startsWith(p))

  if (!req.auth && !isPublic) {
    return NextResponse.redirect(new URL("/login", req.url))
  }

  if (pathname.startsWith("/admin")) {
    if (req.auth?.user?.email !== process.env.SUPER_ADMIN_EMAIL) {
      return NextResponse.redirect(new URL("/dashboard", req.url))
    }
  }

  return NextResponse.next()
})

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|public).*)"],
}
