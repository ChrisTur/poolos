import { NextRequest, NextResponse } from "next/server"
import { randomBytes } from "crypto"

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const isConnect = searchParams.get("connect") === "1"
  const origin = new URL(request.url).origin
  const state = randomBytes(16).toString("hex")
  const isSecure = origin.startsWith("https://")

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

  response.cookies.set("google_oauth_state", state, {
    httpOnly: true,
    secure: isSecure,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 10,
  })

  if (isConnect) {
    response.cookies.set("google_oauth_action", "connect", {
      httpOnly: true,
      secure: isSecure,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 10,
    })
  }

  return response
}
