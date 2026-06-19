import { requireSession } from "@/lib/session"
import { db } from "@/lib/db"
import { NextResponse } from "next/server"

export async function POST() {
  const { companyId } = await requireSession()

  await db.company.update({
    where: { id: companyId },
    data: { stripeAccountId: null },
  })

  return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/settings/payments`)
}
