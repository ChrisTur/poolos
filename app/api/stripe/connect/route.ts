import { requireSession } from "@/lib/session"
import { NextResponse } from "next/server"

export async function GET() {
  const { companyId } = await requireSession()

  const clientId  = process.env.STRIPE_CLIENT_ID!
  const appUrl    = process.env.NEXT_PUBLIC_APP_URL!
  const redirectUri = `${appUrl}/api/stripe/callback`

  const url = new URL("https://connect.stripe.com/oauth/authorize")
  url.searchParams.set("response_type", "code")
  url.searchParams.set("client_id", clientId)
  url.searchParams.set("scope", "read_write")
  url.searchParams.set("redirect_uri", redirectUri)
  url.searchParams.set("state", companyId) // verified in callback via session

  return NextResponse.redirect(url.toString())
}
