import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  // Build redirect URL from forwarded headers so it's correct behind Netlify's proxy
  const proto = req.headers.get("x-forwarded-proto") ?? req.nextUrl.protocol.replace(":", "")
  const host  = req.headers.get("x-forwarded-host") ?? req.headers.get("host") ?? req.nextUrl.host
  const res   = NextResponse.redirect(`${proto}://${host}/login`, { status: 303 })

  // Delete the 3 NextAuth cookies using the exact names and attributes the browser expects.
  // __Host- cookies require Secure=true and Path=/; __Secure- cookies require Secure=true.
  // Deleting with maxAge=0 is more reliable than cookies.delete() which may omit the Secure flag.
  const secure = { value: "", maxAge: 0, path: "/", httpOnly: true, sameSite: "lax" as const, secure: true }
  const open   = { ...secure, secure: false }

  // Production cookies (__Secure- / __Host- prefixed)
  res.cookies.set({ name: "__Host-authjs.csrf-token",        ...secure })
  res.cookies.set({ name: "__Secure-authjs.callback-url",    ...secure })
  res.cookies.set({ name: "__Secure-authjs.session-token",   ...secure })

  // Development cookies (no prefix)
  res.cookies.set({ name: "authjs.csrf-token",     ...open })
  res.cookies.set({ name: "authjs.callback-url",   ...open })
  res.cookies.set({ name: "authjs.session-token",  ...open })

  // Also clear any chunked session-token variants NextAuth may have created (.0, .1, …)
  for (const cookie of req.cookies.getAll()) {
    if (cookie.name.startsWith("__Secure-authjs.session-token.") ||
        cookie.name.startsWith("authjs.session-token.")) {
      const isSecure = cookie.name.startsWith("__Secure-")
      res.cookies.set({ name: cookie.name, ...(isSecure ? secure : open) })
    }
  }

  return res
}
