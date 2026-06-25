import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"

// Route Handler logout — more reliable than a server action because Set-Cookie headers
// are set directly on the NextResponse object and are guaranteed to be included in the
// HTTP 303 redirect, regardless of Next.js action response pipeline behavior.
export async function POST(req: NextRequest) {
  const proto  = req.headers.get("x-forwarded-proto") ?? req.nextUrl.protocol.replace(":", "")
  const secure = proto === "https"
  const p      = secure ? "__Secure-" : ""
  const hp     = secure ? "__Host-"   : ""

  const res = NextResponse.redirect(new URL("/login", req.url), { status: 303 })

  const base = { value: "", maxAge: 0, path: "/", httpOnly: true, sameSite: "lax" as const, secure }

  // Clear session-token and any chunked variants NextAuth may have created (.0, .1, …)
  const sessionBase = `${p}authjs.session-token`
  for (const cookie of req.cookies.getAll()) {
    if (cookie.name === sessionBase || cookie.name.startsWith(`${sessionBase}.`)) {
      res.cookies.set({ name: cookie.name, ...base })
    }
  }

  res.cookies.set({ name: `${p}authjs.callback-url`, ...base })
  // __Host- cookies must have Secure flag and no Domain; base already omits Domain
  res.cookies.set({ name: `${hp}authjs.csrf-token`, ...base, secure: true })

  return res
}
