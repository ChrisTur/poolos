"use server"

import { db } from "@/lib/db"
import { requireSession } from "@/lib/session"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { resend, FROM, buildEstimateHtml } from "@/lib/email"

async function lastEstimateNum(companyId: string): Promise<number> {
  const last = await db.estimate.findFirst({
    where: { companyId },
    orderBy: { estimateNumber: "desc" },
    select: { estimateNumber: true },
  })
  if (!last) return 0
  return parseInt(last.estimateNumber.replace("EST-", "")) || 0
}

function estimateNum(n: number) {
  return `EST-${String(n).padStart(4, "0")}`
}

export async function createEstimate(formData: FormData) {
  const { companyId } = await requireSession()

  const customerId  = formData.get("customerId") as string
  const validUntil  = formData.get("validUntil") ? new Date(formData.get("validUntil") as string) : null
  const notes       = (formData.get("notes") as string) || null
  const serviceType = (formData.get("serviceType") as string) || null
  const descriptions = formData.getAll("description") as string[]
  const quantities   = formData.getAll("quantity") as string[]
  const unitPrices   = formData.getAll("unitPrice") as string[]

  const num = await lastEstimateNum(companyId)
  const estimate = await db.estimate.create({
    data: {
      companyId,
      customerId,
      estimateNumber: estimateNum(num + 1),
      validUntil,
      notes,
      serviceType,
      status: "draft",
      items: {
        create: descriptions.map((desc, i) => ({
          description: desc,
          quantity: parseFloat(quantities[i] || "1"),
          unitPrice: parseFloat(unitPrices[i] || "0"),
        })),
      },
    },
  })

  revalidatePath("/estimates")
  redirect(`/estimates/${estimate.id}`)
}

export async function updateEstimate(id: string, formData: FormData) {
  const { companyId } = await requireSession()
  const est = await db.estimate.findFirst({ where: { id, companyId } })
  if (!est) return

  const validUntil   = formData.get("validUntil") ? new Date(formData.get("validUntil") as string) : null
  const notes        = (formData.get("notes") as string) || null
  const serviceType  = (formData.get("serviceType") as string) || null
  const descriptions = formData.getAll("description") as string[]
  const quantities   = formData.getAll("quantity") as string[]
  const unitPrices   = formData.getAll("unitPrice") as string[]

  await db.estimateItem.deleteMany({ where: { estimateId: id } })
  await db.estimate.update({
    where: { id },
    data: {
      validUntil,
      notes,
      serviceType,
      items: {
        create: descriptions.map((desc, i) => ({
          description: desc,
          quantity: parseFloat(quantities[i] || "1"),
          unitPrice: parseFloat(unitPrices[i] || "0"),
        })),
      },
    },
  })

  revalidatePath(`/estimates/${id}`)
  revalidatePath("/estimates")
  redirect(`/estimates/${id}`)
}

export async function updateEstimateStatus(id: string, status: string) {
  const { companyId } = await requireSession()
  const est = await db.estimate.findFirst({ where: { id, companyId } })
  if (!est) return
  await db.estimate.update({ where: { id }, data: { status } })
  revalidatePath(`/estimates/${id}`)
}

export async function deleteEstimate(id: string) {
  const { companyId } = await requireSession()
  const est = await db.estimate.findFirst({ where: { id, companyId } })
  if (!est) return
  await db.estimate.delete({ where: { id } })
  revalidatePath("/estimates")
  redirect("/estimates")
}

export async function sendEstimateEmail(estimateId: string, formData: FormData) {
  const { companyId } = await requireSession()
  const customMessage = (formData.get("message") as string) || null

  const estimate = await db.estimate.findFirst({
    where: { id: estimateId, companyId },
    include: { customer: true, items: true, company: true },
  })
  if (!estimate) redirect(`/estimates/${estimateId}?emailError=not_found`)
  if (!estimate.customer.email) redirect(`/estimates/${estimateId}?emailError=no_email`)

  const total = estimate.items.reduce((s, i) => s + i.quantity * i.unitPrice, 0)
  const html = buildEstimateHtml({
    estimateNumber: estimate.estimateNumber,
    companyName: estimate.company.name,
    companyLogoUrl: estimate.company.logoUrl,
    companyAddress: estimate.company.address,
    companyCity: estimate.company.city,
    companyState: estimate.company.state,
    companyZip: estimate.company.zip,
    companyPhone: estimate.company.phone,
    companyReplyTo: estimate.company.replyToEmail,
    customerFirstName: estimate.customer.firstName,
    customerLastName: estimate.customer.lastName,
    customerAddress: estimate.customer.address,
    customerCity: estimate.customer.city,
    customerState: estimate.customer.state,
    customerZip: estimate.customer.zip,
    items: estimate.items,
    total,
    validUntil: estimate.validUntil,
    notes: estimate.notes,
    customMessage,
    issuedAt: estimate.createdAt,
  })

  const fromEmail = FROM.match(/<(.+)>/)?.[1] ?? FROM
  const from = `${estimate.company.name} <${fromEmail}>`
  const bcc  = estimate.company.bccEmail ?? undefined
  const replyTo = estimate.company.replyToEmail ?? undefined
  const subject = `Estimate ${estimate.estimateNumber} from ${estimate.company.name}`

  let status: "sent" | "failed" = "sent"
  try {
    await resend.emails.send({ from, to: estimate.customer.email, bcc, replyTo, subject, html })
  } catch {
    status = "failed"
  }

  await db.emailLog.create({
    data: {
      type: "estimate",
      status,
      toEmail: estimate.customer.email,
      bccEmail: bcc ?? null,
      subject,
      estimateId,
      customerId: estimate.customerId,
      companyId,
    },
  })

  if (status === "failed") redirect(`/estimates/${estimateId}?emailError=send_failed`)

  if (estimate.status === "draft") {
    await db.estimate.update({ where: { id: estimateId }, data: { status: "sent" } })
  }

  redirect(`/estimates/${estimateId}?emailed=1`)
}

export async function convertEstimateToInvoice(estimateId: string) {
  const { companyId } = await requireSession()

  const estimate = await db.estimate.findFirst({
    where: { id: estimateId, companyId },
    include: { items: true },
  })
  if (!estimate || estimate.status === "converted") return

  // Compute next invoice number
  const lastInv = await db.invoice.findFirst({
    where: { companyId },
    orderBy: { invoiceNumber: "desc" },
    select: { invoiceNumber: true },
  })
  const lastNum = lastInv ? parseInt(lastInv.invoiceNumber.replace("INV-", "")) || 0 : 0

  // Compute default due date from company settings
  const company = await db.company.findUnique({ where: { id: companyId }, select: { defaultDueDays: true } })
  const customer = await db.customer.findUnique({ where: { id: estimate.customerId }, select: { dueDays: true } })
  const dueDays = customer?.dueDays ?? company?.defaultDueDays ?? 30
  const dueDate = new Date()
  dueDate.setDate(dueDate.getDate() + dueDays)

  const invoice = await db.invoice.create({
    data: {
      companyId,
      customerId: estimate.customerId,
      invoiceNumber: `INV-${String(lastNum + 1).padStart(4, "0")}`,
      dueDate,
      notes: estimate.notes,
      serviceType: estimate.serviceType,
      status: "draft",
      items: {
        create: estimate.items.map((item) => ({
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
        })),
      },
    },
  })

  await db.estimate.update({
    where: { id: estimateId },
    data: { status: "converted", convertedInvoiceId: invoice.id },
  })

  revalidatePath("/estimates")
  revalidatePath("/invoices")
  redirect(`/invoices/${invoice.id}`)
}
