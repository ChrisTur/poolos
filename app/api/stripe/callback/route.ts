import { requireSession } from "@/lib/session"
import { stripe } from "@/lib/stripe"
import { db } from "@/lib/db"
import { NextRequest, NextResponse } from "next/server"

export async function GET(req: NextRequest) {
  const { companyId } = await requireSession()
  const appUrl = process.env.NEXT_PUBLIC_APP_URL!

  const code  = req.nextUrl.searchParams.get("code")
  const state = req.nextUrl.searchParams.get("state")
  const error = req.nextUrl.searchParams.get("error")

  if (error) {
    return NextResponse.redirect(`${appUrl}/settings/payments?stripeError=${error}`)
  }

  // state must match the session's companyId (CSRF guard)
  if (!code || state !== companyId) {
    return NextResponse.redirect(`${appUrl}/settings/payments?stripeError=invalid_state`)
  }

  try {
    const response = await stripe.oauth.token({ grant_type: "authorization_code", code })
    const stripeAccountId = response.stripe_user_id!

    await db.company.update({
      where: { id: companyId },
      data: { stripeAccountId },
    })

    return NextResponse.redirect(`${appUrl}/settings/payments?stripeConnected=1`)
  } catch {
    return NextResponse.redirect(`${appUrl}/settings/payments?stripeError=token_exchange_failed`)
  }
}
