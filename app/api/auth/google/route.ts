import { NextRequest, NextResponse } from "next/server"
import { randomBytes } from "crypto"

export async function GET(request: NextRequest) {
  const origin = new URL(request.url).origin
  const state = randomBytes(16).toString("hex")

  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID!,
    redirect_uri: `${origin}/api/auth/google/callback`,
    response_type: "code",
    scope: "openid email profile",
    state,
    access_type: "online",
    prompt: "select_account",
  })

  const response = NextResponse.redirect(
    `https://accounts.google.com/o/oauth2/v2/auth?${params}`
  )

  // Set cookie on the redirect response directly — cookies() from next/headers
  // doesn't merge its Set-Cookie headers onto a NextResponse.redirect object.
  response.cookies.set("google_oauth_state", state, {
    httpOnly: true,
    secure: origin.startsWith("https://"),
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 10,
  })

  return response
}
