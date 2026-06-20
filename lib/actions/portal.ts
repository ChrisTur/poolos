"use server"

import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { resend, FROM, buildPortalReplyNotificationHtml } from "@/lib/email"

export async function sendPortalMessage(_: unknown, formData: FormData) {
  const token = formData.get("token") as string
  const body = (formData.get("body") as string | null)?.trim()

  if (!body) return { error: "Message cannot be empty." }

  const customer = await db.customer.findUnique({
    where: { portalToken: token },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      companyId: true,
      company: {
        select: { name: true, replyToEmail: true, bccEmail: true },
      },
    },
  })

  if (!customer) return { error: "Invalid session." }

  await db.customerMessage.create({
    data: {
      body,
      fromCompany: false,
      sentViaEmail: false,
      customerId: customer.id,
      companyId: customer.companyId,
    },
  })

  // Notify the company by email if they have a reply-to address
  const notifyEmail = customer.company.replyToEmail ?? customer.company.bccEmail
  if (notifyEmail) {
    const html = buildPortalReplyNotificationHtml({
      companyName: customer.company.name,
      customerFirstName: customer.firstName,
      customerLastName: customer.lastName,
      message: body,
    })
    const fromEmail = FROM.match(/<(.+)>/)?.[1] ?? FROM
    try {
      await resend.emails.send({
        from: `${customer.company.name} via PoolOS <${fromEmail}>`,
        to: notifyEmail,
        subject: `${customer.firstName} ${customer.lastName} sent you a message`,
        html,
      })
    } catch {
      // Non-fatal
    }
  }

  revalidatePath(`/portal/${token}`)
  return { success: true }
}
