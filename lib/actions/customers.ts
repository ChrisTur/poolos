"use server"

import { db } from "@/lib/db"
import { requireSession } from "@/lib/session"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { resend, FROM, buildCustomerMessageHtml } from "@/lib/email"

export async function createCustomer(formData: FormData) {
  const { companyId } = await requireSession()

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
      monthlyRate: formData.get("monthlyRate") ? parseFloat(formData.get("monthlyRate") as string) : null,
      dueDays: formData.get("dueDays") ? parseInt(formData.get("dueDays") as string) : null,
      status: (formData.get("status") as string) || "active",
    },
  })
  revalidatePath("/customers")
  redirect(`/customers/${customer.id}`)
}

export async function updateCustomer(id: string, formData: FormData) {
  const { companyId } = await requireSession()
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
  const { companyId } = await requireSession()
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
  const { companyId } = await requireSession()
  const customer = await db.customer.findFirst({ where: { id: customerId, companyId } })
  if (!customer) return
  const body = formData.get("body") as string
  if (!body?.trim()) return
  await db.customerNote.create({ data: { customerId, body } })
  revalidatePath(`/customers/${customerId}`)
}

export async function deleteCustomerNote(id: string, customerId: string) {
  const { companyId } = await requireSession()
  const note = await db.customerNote.findFirst({
    where: { id, customer: { id: customerId, companyId } },
  })
  if (!note) return
  await db.customerNote.delete({ where: { id } })
  revalidatePath(`/customers/${customerId}`)
}

export async function disableAutoPay(customerId: string) {
  const { companyId } = await requireSession()
  await db.customer.updateMany({
    where: { id: customerId, companyId },
    data: { autoPayEnabled: false, autoPayMethodId: null },
  })
  revalidatePath(`/customers/${customerId}`)
}

export async function sendMessage(_: unknown, formData: FormData) {
  const { companyId, name: senderName } = await requireSession()

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
