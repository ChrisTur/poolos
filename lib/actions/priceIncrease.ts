"use server"

import { db } from "@/lib/db"
import { requirePermission } from "@/lib/session"
import { revalidatePath } from "next/cache"
import { resend, FROM, buildRateIncreaseHtml } from "@/lib/email"

export type PriceIncreasePayload = {
  customerIds: string[]
  newRates: Record<string, number>  // customerId → new rate
  sendEmail: boolean
  effectiveDate: string
  note: string
}

export async function applyPriceIncrease(
  payload: PriceIncreasePayload,
): Promise<{ updated: number; emailed: number; error?: string }> {
  const { companyId, userId, name: senderName } = await requirePermission("customers.edit")

  const { customerIds, newRates, sendEmail, effectiveDate, note } = payload
  if (customerIds.length === 0) return { updated: 0, emailed: 0, error: "No customers selected." }

  const customers = await db.customer.findMany({
    where: { id: { in: customerIds }, companyId },
    select: {
      id: true, firstName: true, lastName: true, email: true,
      monthlyRate: true, portalToken: true,
    },
  })

  const company = await db.company.findUnique({
    where: { id: companyId },
    select: { name: true, logoUrl: true, phone: true, replyToEmail: true, bccEmail: true },
  })
  if (!company) return { updated: 0, emailed: 0, error: "Company not found." }

  // Apply rate updates + log history in a transaction
  await db.$transaction(
    customers.map((c) => {
      const newRate = newRates[c.id]
      if (newRate === undefined || newRate === c.monthlyRate) return db.customer.findUnique({ where: { id: c.id } })
      return db.customer.update({
        where: { id: c.id },
        data: {
          monthlyRate: newRate,
          rateHistory: {
            create: {
              oldRate: c.monthlyRate ?? 0,
              newRate,
              note: note || "Price increase wizard",
              changedById: userId,
              companyId,
            },
          },
        },
      })
    }),
  )

  let emailed = 0
  if (sendEmail) {
    const fromEmail = FROM.match(/<(.+)>/)?.[1] ?? FROM
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? ""

    for (const c of customers) {
      if (!c.email) continue
      const newRate = newRates[c.id]
      if (newRate === undefined) continue
      const portalUrl = c.portalToken ? `${appUrl}/portal/${c.portalToken}` : null

      const { error } = await resend.emails.send({
        from: `${company.name} <${fromEmail}>`,
        to: c.email,
        bcc: company.bccEmail ?? undefined,
        replyTo: company.replyToEmail ?? undefined,
        subject: `Your ${company.name} service rate is changing`,
        html: buildRateIncreaseHtml({
          companyName: company.name,
          companyLogoUrl: company.logoUrl,
          companyPhone: company.phone,
          customerFirstName: c.firstName,
          oldRate: c.monthlyRate ?? 0,
          newRate,
          effectiveDate,
          portalUrl,
          sentByName: senderName,
        }),
      })
      if (!error) emailed++
    }
  }

  revalidatePath("/customers")
  revalidatePath("/reports/profitability")
  return { updated: customers.length, emailed }
}
