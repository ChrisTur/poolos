"use server"

import { db } from "@/lib/db"
import { requireSession } from "@/lib/session"
import { redirect } from "next/navigation"
import { resend, FROM, buildInvoiceHtml } from "@/lib/email"

export async function sendInvoiceEmail(invoiceId: string) {
  const { companyId } = await requireSession()

  const invoice = await db.invoice.findFirst({
    where: { id: invoiceId, companyId },
    include: {
      customer: true,
      items: true,
      payments: true,
      company: true,
    },
  })

  if (!invoice) redirect(`/invoices/${invoiceId}?emailError=not_found`)
  if (!invoice.customer.email) redirect(`/invoices/${invoiceId}?emailError=no_email`)

  const html = buildInvoiceHtml({
    invoiceNumber: invoice.invoiceNumber,
    issuedAt: invoice.issuedAt,
    dueDate: invoice.dueDate,
    companyName: invoice.company.name,
    companyAddress: invoice.company.address,
    companyCity: invoice.company.city,
    companyState: invoice.company.state,
    companyZip: invoice.company.zip,
    companyPhone: invoice.company.phone,
    companyLogoUrl: invoice.company.logoUrl,
    customerFirstName: invoice.customer.firstName,
    customerLastName: invoice.customer.lastName,
    customerAddress: invoice.customer.address,
    customerCity: invoice.customer.city,
    customerState: invoice.customer.state,
    customerZip: invoice.customer.zip,
    customerEmail: invoice.customer.email,
    items: invoice.items,
    payments: invoice.payments,
    notes: invoice.notes,
  })

  const fromEmail = FROM.match(/<(.+)>/)?.[1] ?? FROM
  const from = `${invoice.company.name} <${fromEmail}>`

  try {
    await resend.emails.send({
      from,
      to: invoice.customer.email,
      subject: `Invoice ${invoice.invoiceNumber} from ${invoice.company.name}`,
      html,
    })
  } catch {
    redirect(`/invoices/${invoiceId}?emailError=send_failed`)
  }

  redirect(`/invoices/${invoiceId}?emailed=1`)
}

export async function sendReminderEmail(invoiceId: string) {
  const { companyId } = await requireSession()

  const invoice = await db.invoice.findFirst({
    where: { id: invoiceId, companyId },
    include: {
      customer: true,
      items: true,
      payments: true,
      company: true,
    },
  })

  if (!invoice) redirect(`/invoices/${invoiceId}?emailError=not_found`)
  if (!invoice.customer.email) redirect(`/invoices/${invoiceId}?emailError=no_email`)

  const html = buildInvoiceHtml(
    {
      invoiceNumber: invoice.invoiceNumber,
      issuedAt: invoice.issuedAt,
      dueDate: invoice.dueDate,
      companyName: invoice.company.name,
      companyAddress: invoice.company.address,
      companyCity: invoice.company.city,
      companyState: invoice.company.state,
      companyZip: invoice.company.zip,
      companyPhone: invoice.company.phone,
      companyLogoUrl: invoice.company.logoUrl,
      customerFirstName: invoice.customer.firstName,
      customerLastName: invoice.customer.lastName,
      customerAddress: invoice.customer.address,
      customerCity: invoice.customer.city,
      customerState: invoice.customer.state,
      customerZip: invoice.customer.zip,
      customerEmail: invoice.customer.email,
      items: invoice.items,
      payments: invoice.payments,
      notes: invoice.notes,
    },
    true // isReminder
  )

  const fromEmail = FROM.match(/<(.+)>/)?.[1] ?? FROM
  const from = `${invoice.company.name} <${fromEmail}>`

  try {
    await resend.emails.send({
      from,
      to: invoice.customer.email,
      subject: `Payment Reminder: ${invoice.invoiceNumber} from ${invoice.company.name}`,
      html,
    })
  } catch {
    redirect(`/invoices/${invoiceId}?emailError=send_failed`)
  }

  redirect(`/invoices/${invoiceId}?reminded=1`)
}
