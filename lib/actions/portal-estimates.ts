"use server"

import { db } from "@/lib/db"
import { resend, FROM } from "@/lib/email"
import { redirect } from "next/navigation"

async function loadCustomerByToken(token: string) {
  return db.customer.findUnique({
    where: { portalToken: token },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      companyId: true,
      company: {
        select: {
          name: true,
          replyToEmail: true,
          defaultDueDays: true,
        },
      },
    },
  })
}

export async function approveEstimate(formData: FormData) {
  const token         = formData.get("token") as string
  const estimateId    = formData.get("estimateId") as string
  const signatureData = (formData.get("signatureData") as string).trim()
  const signedByName  = (formData.get("signedByName") as string).trim()

  if (!signatureData || !signedByName) {
    redirect(`/portal/${token}/estimates/${estimateId}?error=missing_fields`)
  }

  const customer = await loadCustomerByToken(token)
  if (!customer) redirect(`/portal/${token}`)

  const estimate = await db.estimate.findFirst({
    where: { id: estimateId, customerId: customer.id, status: "sent" },
    include: { items: true },
  })
  if (!estimate) redirect(`/portal/${token}/estimates/${estimateId}?error=unavailable`)

  if (estimate.validUntil && estimate.validUntil < new Date()) {
    redirect(`/portal/${token}/estimates/${estimateId}?error=expired`)
  }

  // Compute next invoice number
  const lastInv = await db.invoice.findFirst({
    where:   { companyId: customer.companyId },
    orderBy: { invoiceNumber: "desc" },
    select:  { invoiceNumber: true },
  })
  const lastNum = lastInv ? parseInt(lastInv.invoiceNumber.replace("INV-", "")) || 0 : 0

  const customerDueDays = await db.customer.findUnique({
    where:  { id: customer.id },
    select: { dueDays: true },
  })
  const dueDays = customerDueDays?.dueDays ?? customer.company.defaultDueDays ?? 30
  const dueDate = new Date()
  dueDate.setDate(dueDate.getDate() + dueDays)

  const invoice = await db.invoice.create({
    data: {
      companyId:     customer.companyId,
      customerId:    customer.id,
      invoiceNumber: `INV-${String(lastNum + 1).padStart(4, "0")}`,
      dueDate,
      notes:         estimate.notes,
      serviceType:   estimate.serviceType,
      status:        "draft",
      items: {
        create: estimate.items.map((item) => ({
          description: item.description,
          quantity:    item.quantity,
          unitPrice:   item.unitPrice,
        })),
      },
    },
  })

  const now = new Date()
  await db.estimate.update({
    where: { id: estimateId },
    data: {
      status:            "accepted",
      approvedAt:        now,
      signedByName,
      signedAt:          now,
      signatureData,
      convertedInvoiceId: invoice.id,
    },
  })

  // Notify company
  if (customer.company.replyToEmail) {
    const total = estimate.items.reduce((s, i) => s + i.quantity * i.unitPrice, 0)
    const baseUrl = process.env.AUTH_URL ?? ""
    await resend.emails.send({
      from:    FROM,
      to:      customer.company.replyToEmail,
      subject: `${customer.firstName} ${customer.lastName} approved ${estimate.estimateNumber}`,
      html:    buildEstimateNotificationHtml({
        approved:       true,
        customerName:   `${customer.firstName} ${customer.lastName}`,
        signedByName,
        estimateNumber: estimate.estimateNumber,
        total,
        estimateUrl:    `${baseUrl}/estimates/${estimateId}`,
        invoiceUrl:     `${baseUrl}/invoices/${invoice.id}`,
        companyName:    customer.company.name,
      }),
    }).catch(() => {})
  }

  redirect(`/portal/${token}/estimates/${estimateId}?approved=1`)
}

export async function denyEstimate(formData: FormData) {
  const token      = formData.get("token") as string
  const estimateId = formData.get("estimateId") as string
  const reason     = ((formData.get("reason") as string) ?? "").trim() || null

  const customer = await loadCustomerByToken(token)
  if (!customer) redirect(`/portal/${token}`)

  const estimate = await db.estimate.findFirst({
    where: { id: estimateId, customerId: customer.id, status: "sent" },
  })
  if (!estimate) redirect(`/portal/${token}/estimates/${estimateId}?error=unavailable`)

  const now = new Date()
  await db.estimate.update({
    where: { id: estimateId },
    data: { status: "declined", deniedAt: now, denialReason: reason },
  })

  const body = reason
    ? `Declined estimate ${estimate.estimateNumber}.\n\nReason: ${reason}`
    : `Declined estimate ${estimate.estimateNumber}.`

  await db.customerMessage.create({
    data: {
      body,
      fromCompany: false,
      customerId:  customer.id,
      companyId:   customer.companyId,
    },
  })

  // Notify company
  if (customer.company.replyToEmail) {
    const total = 0 // no items loaded — just context in subject is enough
    void total
    const baseUrl = process.env.AUTH_URL ?? ""
    await resend.emails.send({
      from:    FROM,
      to:      customer.company.replyToEmail,
      subject: `${customer.firstName} ${customer.lastName} declined ${estimate.estimateNumber}`,
      html:    buildEstimateNotificationHtml({
        approved:       false,
        customerName:   `${customer.firstName} ${customer.lastName}`,
        estimateNumber: estimate.estimateNumber,
        reason,
        estimateUrl:    `${baseUrl}/estimates/${estimateId}`,
        companyName:    customer.company.name,
      }),
    }).catch(() => {})
  }

  redirect(`/portal/${token}/estimates/${estimateId}?declined=1`)
}

// ── Notification email (internal — to company) ────────────────────────────────

function fmt(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n)
}

function buildEstimateNotificationHtml(data: {
  approved: boolean
  customerName: string
  signedByName?: string
  estimateNumber: string
  total?: number
  reason?: string | null
  estimateUrl: string
  invoiceUrl?: string
  companyName: string
}): string {
  const color  = data.approved ? "#16a34a" : "#dc2626"
  const label  = data.approved ? "Approved" : "Declined"
  const icon   = data.approved ? "✅" : "❌"

  return `<!DOCTYPE html>
<html lang="en">
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f9fafb;margin:0;padding:24px 8px">
  <div style="max-width:520px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,.1)">
    <div style="background:${color};padding:20px 24px">
      <p style="margin:0;font-size:20px;font-weight:700;color:#ffffff">${icon} Estimate ${label}</p>
    </div>
    <div style="padding:24px">
      <p style="margin:0 0 16px;font-size:15px;color:#374151">
        <strong>${data.customerName}</strong> has ${label.toLowerCase()} estimate <strong>${data.estimateNumber}</strong>${data.total ? ` (${fmt(data.total)})` : ""}.
      </p>
      ${data.signedByName ? `<p style="margin:0 0 16px;font-size:14px;color:#6b7280">Signed by: <strong>${data.signedByName}</strong></p>` : ""}
      ${data.reason ? `<div style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:12px 16px;margin-bottom:16px;font-size:14px;color:#991b1b">${data.reason}</div>` : ""}
      <a href="${data.estimateUrl}" style="display:inline-block;background:#1e293b;color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;padding:10px 20px;border-radius:8px;margin-right:8px">View Estimate</a>
      ${data.invoiceUrl ? `<a href="${data.invoiceUrl}" style="display:inline-block;background:#0ea5e9;color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;padding:10px 20px;border-radius:8px">View Auto-Created Invoice</a>` : ""}
    </div>
    <div style="background:#f9fafb;border-top:1px solid #f3f4f6;padding:12px 24px;font-size:12px;color:#9ca3af;text-align:center">
      ${data.companyName} · Powered by PoolOS
    </div>
  </div>
</body>
</html>`
}
