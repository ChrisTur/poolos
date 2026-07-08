"use server"

import { db } from "@/lib/db"
import { requirePermission, requireSession } from "@/lib/session"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { resend, FROM, buildCustomerMessageHtml } from "@/lib/email"

export async function createCustomer(formData: FormData) {
  const { companyId } = await requirePermission("customers.edit")

  const customer = await db.customer.create({
    data: {
      companyId,
      firstName: formData.get("firstName") as string,
      lastName: formData.get("lastName") as string,
      email: (formData.get("email") as string) || null,
      phone: (formData.get("phone") as string) || null,
      address: formData.get("address") as string,
      city: formData.get("city") as string,
      state: formData.get("state") as string,
      zip: formData.get("zip") as string,
      poolType: (formData.get("poolType") as string) || null,
      poolSize: (formData.get("poolSize") as string) || null,
      poolNotes: (formData.get("poolNotes") as string) || null,
      accessNotes: (formData.get("accessNotes") as string) || null,
      monthlyRate: formData.get("monthlyRate") ? parseFloat(formData.get("monthlyRate") as string) : null,
      dueDays: formData.get("dueDays") ? parseInt(formData.get("dueDays") as string) : null,
      status: (formData.get("status") as string) || "active",
    },
  })
  revalidatePath("/customers")
  redirect(`/customers/${customer.id}`)
}

export async function updateCustomer(id: string, formData: FormData) {
  const { companyId } = await requirePermission("customers.edit")
  const customer = await db.customer.findFirst({ where: { id, companyId } })
  if (!customer) return

  await db.customer.update({
    where: { id },
    data: {
      firstName: formData.get("firstName") as string,
      lastName: formData.get("lastName") as string,
      email: (formData.get("email") as string) || null,
      phone: (formData.get("phone") as string) || null,
      address: formData.get("address") as string,
      city: formData.get("city") as string,
      state: formData.get("state") as string,
      zip: formData.get("zip") as string,
      poolType: (formData.get("poolType") as string) || null,
      poolSize: (formData.get("poolSize") as string) || null,
      poolNotes: (formData.get("poolNotes") as string) || null,
      accessNotes: (formData.get("accessNotes") as string) || null,
      monthlyRate: formData.get("monthlyRate") ? parseFloat(formData.get("monthlyRate") as string) : null,
      dueDays: formData.get("dueDays") ? parseInt(formData.get("dueDays") as string) : null,
      status: formData.get("status") as string,
      serviceFrequency: (formData.get("serviceFrequency") as string) || null,
    },
  })
  revalidatePath(`/customers/${id}`)
  revalidatePath("/customers")
  redirect(`/customers/${id}`)
}

export async function deleteCustomer(id: string) {
  const { companyId } = await requirePermission("customers.edit")
  const customer = await db.customer.findFirst({ where: { id, companyId } })
  if (!customer) redirect("/customers")

  // Explicitly delete related records in case DB cascades aren't applied
  await db.customerNote.deleteMany({ where: { customerId: id } })
  await db.serviceVisit.deleteMany({ where: { customerId: id } })
  await db.routeStop.deleteMany({ where: { customerId: id } })
  await db.invoiceItem.deleteMany({ where: { invoice: { customerId: id } } })
  await db.payment.deleteMany({ where: { invoice: { customerId: id } } })
  await db.invoice.deleteMany({ where: { customerId: id } })
  await db.customer.delete({ where: { id } })

  revalidatePath("/customers")
  redirect("/customers")
}

export async function addCustomerNote(customerId: string, formData: FormData) {
  const { companyId } = await requirePermission("customers.edit")
  const customer = await db.customer.findFirst({ where: { id: customerId, companyId } })
  if (!customer) return
  const body = formData.get("body") as string
  if (!body?.trim()) return
  await db.customerNote.create({ data: { customerId, body } })
  revalidatePath(`/customers/${customerId}`)
}

export async function deleteCustomerNote(id: string, customerId: string) {
  const { companyId } = await requirePermission("customers.edit")
  const note = await db.customerNote.findFirst({
    where: { id, customer: { id: customerId, companyId } },
  })
  if (!note) return
  await db.customerNote.delete({ where: { id } })
  revalidatePath(`/customers/${customerId}`)
}

export async function disableAutoPay(customerId: string) {
  const { companyId } = await requirePermission("customers.edit")
  await db.customer.updateMany({
    where: { id: customerId, companyId },
    data: { autoPayEnabled: false, autoPayMethodId: null },
  })
  revalidatePath(`/customers/${customerId}`)
}

export async function broadcastMessage(
  customerIds: string[],
  subject: string,
  body: string,
): Promise<{ sent: number; skipped: number; error?: string }> {
  const { companyId, name: senderName } = await requirePermission("messages.send")

  if (!subject.trim() || !body.trim()) return { sent: 0, skipped: 0, error: "Subject and message are required." }

  const [customers, company] = await Promise.all([
    db.customer.findMany({
      where: { companyId, id: { in: customerIds } },
      select: { id: true, email: true, firstName: true, portalToken: true },
    }),
    db.company.findUnique({
      where: { id: companyId },
      select: { name: true, logoUrl: true, phone: true, replyToEmail: true },
    }),
  ])

  if (!company) return { sent: 0, skipped: 0, error: "Company not found." }

  const fromEmail = FROM.match(/<(.+)>/)?.[1] ?? FROM
  const withEmail = customers.filter((c) => c.email)
  const noEmail = customers.length - withEmail.length

  if (withEmail.length === 0) return { sent: 0, skipped: noEmail, error: "None of the selected customers have email addresses." }

  // Build batch payload (Resend batch max = 100 per call)
  const buildEmail = (c: (typeof withEmail)[0]) => {
    const portalUrl = c.portalToken
      ? `${process.env.NEXT_PUBLIC_APP_URL}/portal/${c.portalToken}`
      : null
    return {
      from: `${company.name} <${fromEmail}>`,
      to: c.email!,
      replyTo: company.replyToEmail ?? undefined,
      subject,
      html: buildCustomerMessageHtml({
        companyName: company.name,
        companyLogoUrl: company.logoUrl,
        companyPhone: company.phone,
        customerFirstName: c.firstName,
        message: body,
        portalUrl,
        sentByName: senderName,
      }),
    }
  }

  let sent = 0
  let sendFailed = 0
  for (let i = 0; i < withEmail.length; i += 100) {
    const chunk = withEmail.slice(i, i + 100)
    try {
      await resend.batch.send(chunk.map(buildEmail))
      sent += chunk.length
    } catch {
      sendFailed += chunk.length
    }
  }

  if (sent > 0) {
    await db.customerMessage.createMany({
      data: withEmail.slice(0, sent).map((c) => ({
        body,
        fromCompany: true,
        sentViaEmail: true,
        sentByName: senderName,
        customerId: c.id,
        companyId,
      })),
    })
  }

  revalidatePath("/customers")
  return { sent, skipped: noEmail + sendFailed }
}

export async function sendUpsellCampaign(
  sinceDate: string,
  subject: string,
  body: string,
): Promise<{ sent: number; skipped: number; error?: string }> {
  const { companyId, name: senderName } = await requirePermission("messages.send")

  if (!subject.trim() || !body.trim()) return { sent: 0, skipped: 0, error: "Subject and message are required." }
  if (!sinceDate) return { sent: 0, skipped: 0, error: "Please select a cutoff date." }

  const since = new Date(sinceDate)

  // Find active customers whose latest visit is before sinceDate (or they've never been visited)
  const allCustomers = await db.customer.findMany({
    where: { companyId, status: "active" },
    select: {
      id: true, email: true, firstName: true, portalToken: true,
      serviceVisits: { orderBy: { visitedAt: "desc" }, take: 1, select: { visitedAt: true } },
    },
  })

  const targets = allCustomers.filter((c) => {
    const lastVisit = c.serviceVisits[0]?.visitedAt
    return !lastVisit || lastVisit < since
  })

  if (targets.length === 0) return { sent: 0, skipped: 0, error: "No customers match this filter." }

  const company = await db.company.findUnique({
    where: { id: companyId },
    select: { name: true, logoUrl: true, phone: true, replyToEmail: true },
  })
  if (!company) return { sent: 0, skipped: 0, error: "Company not found." }

  const fromEmail = FROM.match(/<(.+)>/)?.[1] ?? FROM
  const withEmail = targets.filter((c) => c.email)
  const noEmail = targets.length - withEmail.length

  if (withEmail.length === 0) return { sent: 0, skipped: noEmail, error: "None of the matching customers have email addresses." }

  const buildEmail = (c: (typeof withEmail)[0]) => {
    const portalUrl = c.portalToken
      ? `${process.env.NEXT_PUBLIC_APP_URL}/portal/${c.portalToken}`
      : null
    return {
      from: `${company.name} <${fromEmail}>`,
      to: c.email!,
      replyTo: company.replyToEmail ?? undefined,
      subject,
      html: buildCustomerMessageHtml({
        companyName: company.name,
        companyLogoUrl: company.logoUrl,
        companyPhone: company.phone,
        customerFirstName: c.firstName,
        message: body,
        portalUrl,
        sentByName: senderName,
      }),
    }
  }

  let sent = 0
  let sendFailed = 0
  for (let i = 0; i < withEmail.length; i += 100) {
    const chunk = withEmail.slice(i, i + 100)
    try {
      await resend.batch.send(chunk.map(buildEmail))
      sent += chunk.length
    } catch {
      sendFailed += chunk.length
    }
  }

  if (sent > 0) {
    await db.customerMessage.createMany({
      data: withEmail.slice(0, sent).map((c) => ({
        body,
        fromCompany: true,
        sentViaEmail: true,
        sentByName: senderName,
        customerId: c.id,
        companyId,
      })),
    })
  }

  return { sent, skipped: noEmail + sendFailed }
}

export async function sendMessage(_: unknown, formData: FormData) {
  const { companyId, name: senderName } = await requirePermission("messages.send")

  const customerId = formData.get("customerId") as string
  const body = (formData.get("body") as string | null)?.trim()

  if (!body) return { error: "Message cannot be empty." }

  const [customer, company] = await Promise.all([
    db.customer.findFirst({
      where: { id: customerId, companyId },
      select: { email: true, firstName: true, portalToken: true },
    }),
    db.company.findUnique({
      where: { id: companyId },
      select: { name: true, logoUrl: true, phone: true, bccEmail: true, replyToEmail: true },
    }),
  ])

  if (!customer || !company) return { error: "Not found." }

  let emailSent = false
  if (customer.email) {
    const portalUrl = customer.portalToken
      ? `${process.env.NEXT_PUBLIC_APP_URL}/portal/${customer.portalToken}`
      : null

    const html = buildCustomerMessageHtml({
      companyName: company.name,
      companyLogoUrl: company.logoUrl,
      companyPhone: company.phone,
      customerFirstName: customer.firstName,
      message: body,
      portalUrl,
      sentByName: senderName,
    })
    const fromEmail = FROM.match(/<(.+)>/)?.[1] ?? FROM
    try {
      await resend.emails.send({
        from: `${company.name} <${fromEmail}>`,
        to: customer.email,
        bcc: company.bccEmail ?? undefined,
        replyTo: company.replyToEmail ?? undefined,
        subject: `Message from ${company.name}`,
        html,
      })
      emailSent = true
    } catch {
      // Message still saves even if email fails
    }
  }

  await db.customerMessage.create({
    data: { body, fromCompany: true, sentViaEmail: emailSent, sentByName: senderName, customerId, companyId },
  })

  revalidatePath(`/customers/${customerId}`)
  return { success: true }
}

export type RecentReading = {
  id: string
  visitedAt: Date
  chlorine: number | null
  ph: number | null
  alkalinity: number | null
  calcium: number | null
  cya: number | null
  salt: number | null
}

export async function getRecentReadings(customerId: string): Promise<RecentReading[]> {
  const { companyId } = await requireSession()
  return db.serviceVisit.findMany({
    where: {
      customerId,
      customer: { companyId },
      OR: [
        { chlorine: { not: null } },
        { ph: { not: null } },
        { alkalinity: { not: null } },
        { calcium: { not: null } },
        { cya: { not: null } },
        { salt: { not: null } },
      ],
    },
    orderBy: { visitedAt: "desc" },
    take: 3,
    select: { id: true, visitedAt: true, chlorine: true, ph: true, alkalinity: true, calcium: true, cya: true, salt: true },
  })
}
