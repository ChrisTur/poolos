import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { db } from "@/lib/db"
import { createSession, setSessionCookie } from "@/lib/auth"

interface GoogleTokenResponse {
  access_token: string
  id_token:     string
  token_type:   string
}

interface GoogleUserInfo {
  sub:        string
  email:      string
  name:       string
  given_name: string
  family_name: string
  picture?:   string
}

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://poolos.biz"

function errorRedirect(msg: string) {
  return NextResponse.redirect(`${APP_URL}/login?error=${encodeURIComponent(msg)}`)
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const code  = searchParams.get("code")
  const state = searchParams.get("state")

  const jar = await cookies()
  const savedState = jar.get("google_oauth_state")?.value
  jar.set("google_oauth_state", "", { maxAge: 0, path: "/" })

  if (!code || !state || state !== savedState) {
    return errorRedirect("Invalid OAuth state. Please try again.")
  }

  // Exchange code for tokens
  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id:     process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri:  `${APP_URL}/api/auth/google/callback`,
      grant_type:    "authorization_code",
    }),
  })

  if (!tokenRes.ok) return errorRedirect("Failed to authenticate with Google.")

  const tokens: GoogleTokenResponse = await tokenRes.json()

  // Get user info
  const userInfoRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  })

  if (!userInfoRes.ok) return errorRedirect("Failed to get user info from Google.")

  const googleUser: GoogleUserInfo = await userInfoRes.json()

  if (!googleUser.email) return errorRedirect("Google account has no email address.")

  // Find existing user by googleId or email
  const existing = await db.user.findFirst({
    where: { OR: [{ googleId: googleUser.sub }, { email: googleUser.email }] },
    include: { company: true },
  })

  if (existing) {
    if (!existing.isActive || !existing.company.isActive) {
      return errorRedirect("Your account is inactive. Please contact support.")
    }

    // Link googleId if signing in via email match for the first time
    if (!existing.googleId) {
      await db.user.update({ where: { id: existing.id }, data: { googleId: googleUser.sub } })
    }

    await db.user.update({ where: { id: existing.id }, data: { lastLoginAt: new Date() } })

    const { token, expiresAt } = await createSession({
      userId:             existing.id,
      role:               existing.role,
      email:              existing.email,
      name:               `${existing.firstName} ${existing.lastName}`,
      companyId:          existing.companyId,
      companyName:        existing.company.name,
      mustChangePassword: false,
    })
    await setSessionCookie(token, expiresAt)
    return NextResponse.redirect(`${APP_URL}/dashboard`)
  }

  // New user — store Google profile in a short-lived cookie, redirect to finish-signup
  const profile = JSON.stringify({
    googleId:  googleUser.sub,
    email:     googleUser.email,
    firstName: googleUser.given_name ?? googleUser.name.split(" ")[0],
    lastName:  googleUser.family_name ?? googleUser.name.split(" ").slice(1).join(" "),
  })

  jar.set("google_pending_profile", profile, {
    httpOnly: true,
    secure: APP_URL.startsWith("https://"),
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 15, // 15 minutes to finish signup
  })

  return NextResponse.redirect(`${APP_URL}/register/google-finish`)
}
