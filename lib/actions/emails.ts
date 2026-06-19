"use server"

import { db } from "@/lib/db"
import { requireSession } from "@/lib/session"
import { redirect } from "next/navigation"
import { resend, FROM, buildInvoiceHtml, buildReceiptHtml } from "@/lib/email"

async function fetchInvoiceForEmail(invoiceId: string, companyId: string) {
  const invoice = await db.invoice.findFirst({
    where: { id: invoiceId, companyId },
    include: { customer: true, items: true, payments: true, company: true },
  })
  // Lazily generate payToken for invoices created before Stripe integration
  if (invoice && !invoice.payToken) {
    const updated = await db.invoice.update({
      where: { id: invoiceId },
      data: { payToken: crypto.randomUUID() },
    })
    invoice.payToken = updated.payToken
  }
  return invoice
}

function buildEmailData(invoice: NonNullable<Awaited<ReturnType<typeof fetchInvoiceForEmail>>>, customMessage?: string | null) {
  return {
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
    customerEmail: invoice.customer.email!,
    items: invoice.items,
    payments: invoice.payments,
    notes: invoice.notes,
    customMessage,
    paymentLinks: {
      venmoHandle:  invoice.company.venmoHandle,
      paypalHandle: invoice.company.paypalHandle,
      cashAppHandle:invoice.company.cashAppHandle,
      zellePhone:   invoice.company.zellePhone,
      zelleEmail:   invoice.company.zelleEmail,
    },
    payToken:        invoice.payToken,
    stripeConnected: !!invoice.company.stripeAccountId,
  }
}

function buildSendParams(invoice: NonNullable<Awaited<ReturnType<typeof fetchInvoiceForEmail>>>) {
  const fromEmail = FROM.match(/<(.+)>/)?.[1] ?? FROM
  return {
    from: `${invoice.company.name} <${fromEmail}>`,
    bcc: invoice.company.bccEmail ?? undefined,
    replyTo: invoice.company.replyToEmail ?? undefined,
  }
}

export async function sendInvoiceEmail(invoiceId: string, formData: FormData) {
  const { companyId } = await requireSession()
  const customMessage = (formData.get("message") as string) || null

  const invoice = await fetchInvoiceForEmail(invoiceId, companyId)
  if (!invoice) redirect(`/invoices/${invoiceId}?emailError=not_found`)
  if (!invoice.customer.email) redirect(`/invoices/${invoiceId}?emailError=no_email`)

  const html = buildInvoiceHtml(buildEmailData(invoice, customMessage))
  const { from, bcc, replyTo } = buildSendParams(invoice)
  const subject = `Invoice ${invoice.invoiceNumber} from ${invoice.company.name}`

  let status: "sent" | "failed" = "sent"
  try {
    await resend.emails.send({ from, to: invoice.customer.email, bcc, replyTo, subject, html })
  } catch {
    status = "failed"
  }

  await db.emailLog.create({
    data: {
      type: "invoice",
      status,
      toEmail: invoice.customer.email,
      bccEmail: bcc ?? null,
      subject,
      invoiceId,
      customerId: invoice.customerId,
      companyId,
    },
  })

  if (status === "failed") redirect(`/invoices/${invoiceId}?emailError=send_failed`)

  if (invoice.status === "draft") {
    await db.invoice.update({ where: { id: invoiceId }, data: { status: "sent" } })
  }

  redirect(`/invoices/${invoiceId}?emailed=1`)
}

export async function sendReminderEmail(invoiceId: string, formData: FormData) {
  const { companyId } = await requireSession()
  const customMessage = (formData.get("message") as string) || null

  const invoice = await fetchInvoiceForEmail(invoiceId, companyId)
  if (!invoice) redirect(`/invoices/${invoiceId}?emailError=not_found`)
  if (!invoice.customer.email) redirect(`/invoices/${invoiceId}?emailError=no_email`)

  const html = buildInvoiceHtml(buildEmailData(invoice, customMessage), true)
  const { from, bcc, replyTo } = buildSendParams(invoice)
  const subject = `Payment Reminder: ${invoice.invoiceNumber} from ${invoice.company.name}`

  let status: "sent" | "failed" = "sent"
  try {
    await resend.emails.send({ from, to: invoice.customer.email, bcc, replyTo, subject, html })
  } catch {
    status = "failed"
  }

  await db.emailLog.create({
    data: {
      type: "reminder",
      status,
      toEmail: invoice.customer.email,
      bccEmail: bcc ?? null,
      subject,
      invoiceId,
      customerId: invoice.customerId,
      companyId,
    },
  })

  if (status === "failed") redirect(`/invoices/${invoiceId}?emailError=send_failed`)

  if (invoice.status === "draft") {
    await db.invoice.update({ where: { id: invoiceId }, data: { status: "sent" } })
  }

  redirect(`/invoices/${invoiceId}?reminded=1`)
}

export async function sendReceiptEmail(invoiceId: string) {
  const { companyId } = await requireSession()

  const invoice = await db.invoice.findFirst({
    where: { id: invoiceId, companyId },
    include: { customer: true, items: true, payments: true, company: true },
  })
  if (!invoice || !invoice.customer.email) return

  const total = invoice.items.reduce((s, i) => s + i.quantity * i.unitPrice, 0)
  const paid = invoice.payments.reduce((s, p) => s + p.amount, 0)
  const lastPayment = invoice.payments.at(-1)

  const html = buildReceiptHtml({
    invoiceNumber: invoice.invoiceNumber,
    companyName: invoice.company.name,
    companyLogoUrl: invoice.company.logoUrl,
    customerFirstName: invoice.customer.firstName,
    paymentAmount: lastPayment?.amount ?? paid,
    paymentMethod: lastPayment?.method ?? null,
    paymentDate: lastPayment?.createdAt ?? new Date(),
    balanceRemaining: Math.max(0, total - paid),
  })

  const { from, bcc, replyTo } = buildSendParams(invoice)
  const subject = `Payment received — ${invoice.invoiceNumber}`

  let status: "sent" | "failed" = "sent"
  try {
    await resend.emails.send({ from, to: invoice.customer.email, bcc, replyTo, subject, html })
  } catch {
    status = "failed"
  }

  await db.emailLog.create({
    data: {
      type: "receipt",
      status,
      toEmail: invoice.customer.email,
      bccEmail: bcc ?? null,
      subject,
      invoiceId,
      customerId: invoice.customerId,
      companyId,
    },
  })
}

export async function sendBulkOverdueReminders(_formData: FormData) {
  const { companyId } = await requireSession()

  const invoices = await db.invoice.findMany({
    where: {
      companyId,
      status: "overdue",
      customer: { email: { not: null } },
    },
    include: { customer: true, items: true, payments: true, company: true },
  })

  let sent = 0
  let failed = 0

  for (const invoice of invoices) {
    if (!invoice.customer.email) continue

    // Ensure payToken exists for older invoices
    if (!invoice.payToken) {
      const updated = await db.invoice.update({
        where: { id: invoice.id },
        data: { payToken: crypto.randomUUID() },
      })
      invoice.payToken = updated.payToken
    }

    const html = buildInvoiceHtml(buildEmailData(invoice), true)
    const { from, bcc, replyTo } = buildSendParams(invoice)
    const subject = `Payment Reminder: Invoice ${invoice.invoiceNumber} — ${invoice.company.name}`

    let status: "sent" | "failed" = "sent"
    try {
      await resend.emails.send({ from, to: invoice.customer.email, bcc, replyTo, subject, html })
      sent++
    } catch {
      status = "failed"
      failed++
    }

    await db.emailLog.create({
      data: {
        type: "reminder",
        status,
        toEmail: invoice.customer.email,
        bccEmail: bcc ?? null,
        subject,
        invoiceId: invoice.id,
        customerId: invoice.customerId,
        companyId,
      },
    })
  }

  redirect(`/invoices?status=overdue&reminded=${sent}&failed=${failed}`)
}

export async function sendBulkInvoiceEmails(formData: FormData) {
  const { companyId } = await requireSession()
  const month = parseInt(formData.get("month") as string)
  const year = parseInt(formData.get("year") as string)

  const startOfMonth = new Date(year, month - 1, 1)
  const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999)

  const invoices = await db.invoice.findMany({
    where: {
      companyId,
      issuedAt: { gte: startOfMonth, lte: endOfMonth },
      status: { not: "cancelled" },
      customer: { email: { not: null } },
    },
    include: { customer: true, items: true, payments: true, company: true },
  })

  let sent = 0
  let failed = 0

  for (const invoice of invoices) {
    if (!invoice.customer.email) continue

    const html = buildInvoiceHtml(buildEmailData(invoice))
    const { from, bcc, replyTo } = buildSendParams(invoice)
    const subject = `Invoice ${invoice.invoiceNumber} from ${invoice.company.name}`

    let status: "sent" | "failed" = "sent"
    try {
      await resend.emails.send({ from, to: invoice.customer.email, bcc, replyTo, subject, html })
      sent++
    } catch {
      status = "failed"
      failed++
    }

    await db.emailLog.create({
      data: {
        type: "invoice",
        status,
        toEmail: invoice.customer.email,
        bccEmail: bcc ?? null,
        subject,
        invoiceId: invoice.id,
        customerId: invoice.customerId,
        companyId,
      },
    })

    if (status === "sent" && invoice.status === "draft") {
      await db.invoice.update({ where: { id: invoice.id }, data: { status: "sent" } })
    }
  }

  redirect(`/invoices/generate?result=emailed&sent=${sent}&failed=${failed}`)
}
