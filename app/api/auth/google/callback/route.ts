import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { db } from "@/lib/db"
import { createSession, COOKIE_NAME } from "@/lib/auth"

interface GoogleTokenResponse {
  access_token: string
  id_token:     string
  token_type:   string
}

interface GoogleUserInfo {
  sub:         string
  email:       string
  name:        string
  given_name:  string
  family_name: string
  picture?:    string
}

export async function GET(req: NextRequest) {
  const origin = new URL(req.url).origin
  const { searchParams } = req.nextUrl
  const code  = searchParams.get("code")
  const state = searchParams.get("state")

  // Read state from request cookies (reading from next/headers works fine)
  const jar = await cookies()
  const savedState = jar.get("google_oauth_state")?.value

  if (!code || !state || state !== savedState) {
    const res = NextResponse.redirect(`${origin}/login?error=${encodeURIComponent("Invalid OAuth state. Please try again.")}`)
    res.cookies.set("google_oauth_state", "", { maxAge: 0, path: "/" })
    return res
  }

  // Exchange code for tokens
  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id:     process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri:  `${origin}/api/auth/google/callback`,
      grant_type:    "authorization_code",
    }),
  })

  if (!tokenRes.ok) {
    const res = NextResponse.redirect(`${origin}/login?error=${encodeURIComponent("Failed to authenticate with Google.")}`)
    res.cookies.set("google_oauth_state", "", { maxAge: 0, path: "/" })
    return res
  }

  const tokens: GoogleTokenResponse = await tokenRes.json()

  const userInfoRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  })

  if (!userInfoRes.ok) {
    return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent("Failed to get user info from Google.")}`)
  }

  const googleUser: GoogleUserInfo = await userInfoRes.json()

  if (!googleUser.email) {
    return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent("Google account has no email address.")}`)
  }

  const isSecure = origin.startsWith("https://")

  // Find existing user by googleId or email
  const existing = await db.user.findFirst({
    where: { OR: [{ googleId: googleUser.sub }, { email: googleUser.email }] },
    include: { company: true },
  })

  if (existing) {
    if (!existing.isActive || !existing.company.isActive) {
      return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent("Your account is inactive. Please contact support.")}`)
    }

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

    const res = NextResponse.redirect(`${origin}/dashboard`)
    res.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure:   isSecure,
      sameSite: "lax",
      path:     "/",
      expires:  expiresAt,
    })
    res.cookies.set("google_oauth_state", "", { maxAge: 0, path: "/" })
    return res
  }

  // New user — store Google profile in a short-lived cookie, redirect to finish-signup
  const profile = JSON.stringify({
    googleId:  googleUser.sub,
    email:     googleUser.email,
    firstName: googleUser.given_name ?? googleUser.name.split(" ")[0],
    lastName:  googleUser.family_name ?? googleUser.name.split(" ").slice(1).join(" "),
  })

  const res = NextResponse.redirect(`${origin}/register/google-finish`)
  res.cookies.set("google_pending_profile", profile, {
    httpOnly: true,
    secure:   isSecure,
    sameSite: "lax",
    path:     "/",
    maxAge:   60 * 15,
  })
  res.cookies.set("google_oauth_state", "", { maxAge: 0, path: "/" })
  return res
}
