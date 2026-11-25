import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { randomBytes } from "crypto"

export async function GET() {
  const state = randomBytes(16).toString("hex")

  const jar = await cookies()
  jar.set("google_oauth_state", state, {
    httpOnly: true,
    secure: (process.env.AUTH_URL ?? "").startsWith("https://"),
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 10, // 10 minutes
  })

  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID!,
    redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/google/callback`,
    response_type: "code",
    scope: "openid email profile",
    state,
    access_type: "online",
    prompt: "select_account",
  })

  return NextResponse.redirect(
    `https://accounts.google.com/o/oauth2/v2/auth?${params}`
  )
}
