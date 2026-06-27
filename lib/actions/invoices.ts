"use server"

import { db } from "@/lib/db"
import { requirePermission } from "@/lib/session"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { sendReceiptEmail } from "@/lib/actions/emails"
import { stripe } from "@/lib/stripe"

async function lastInvoiceNum(companyId: string): Promise<number> {
  const last = await db.invoice.findFirst({
    where: { companyId },
    orderBy: { invoiceNumber: "desc" },
    select: { invoiceNumber: true },
  })
  if (!last) return 0
  return parseInt(last.invoiceNumber.replace("INV-", "")) || 0
}

function invoiceNum(n: number) {
  return `INV-${String(n).padStart(4, "0")}`
}

export async function createInvoice(formData: FormData) {
  const { companyId } = await requirePermission("invoices.manage")

  const customerId   = formData.get("customerId") as string
  const dueDate      = new Date(formData.get("dueDate") as string)
  const notes        = (formData.get("notes") as string) || null
  const serviceType  = (formData.get("serviceType") as string) || null
  const descriptions = formData.getAll("description") as string[]
  const quantities   = formData.getAll("quantity") as string[]
  const unitPrices   = formData.getAll("unitPrice") as string[]

  const num = await lastInvoiceNum(companyId)
  const invoice = await db.invoice.create({
    data: {
      companyId,
      customerId,
      invoiceNumber: invoiceNum(num + 1),
      dueDate,
      notes,
      serviceType,
      status: "draft",
      payToken: crypto.randomUUID(),
      items: {
        create: descriptions.map((desc, i) => ({
          description: desc,
          quantity: parseFloat(quantities[i] || "1"),
          unitPrice: parseFloat(unitPrices[i] || "0"),
        })),
      },
    },
  })

  revalidatePath("/invoices")
  redirect(`/invoices/${invoice.id}`)
}

export async function updateInvoiceStatus(id: string, status: string) {
  const { companyId } = await requirePermission("invoices.manage")
  const inv = await db.invoice.findFirst({ where: { id, companyId } })
  if (!inv) return
  await db.invoice.update({ where: { id }, data: { status } })
  revalidatePath(`/invoices/${id}`)
  revalidatePath("/invoices")
  revalidatePath("/dashboard")
}

export async function markInvoicePaid(id: string, formData: FormData) {
  const { companyId } = await requirePermission("invoices.manage")
  const inv = await db.invoice.findFirst({
    where: { id, companyId },
    include: { items: true, payments: true, customer: true },
  })
  if (!inv) return

  const method = (formData.get("method") as string) || null

  const total   = inv.items.reduce((s, i) => s + i.quantity * i.unitPrice, 0)
  const paid    = inv.payments.reduce((s, p) => s + p.amount, 0)
  const balance = Math.round((total - paid) * 100) / 100

  if (balance > 0) {
    await db.payment.create({
      data: { invoiceId: id, amount: balance, method, notes: "Marked as paid" },
    })
  }

  await db.invoice.update({ where: { id }, data: { status: "paid", paidAt: new Date() } })

  if (inv.customer.email) {
    await sendReceiptEmail(id)
  }

  revalidatePath(`/invoices/${id}`)
  revalidatePath("/invoices")
  revalidatePath("/dashboard")
}

export async function addPayment(invoiceId: string, formData: FormData) {
  const { companyId } = await requirePermission("invoices.manage")
  const inv = await db.invoice.findFirst({ where: { id: invoiceId, companyId } })
  if (!inv) return

  const amount = parseFloat(formData.get("amount") as string)
  if (!amount) return

  await db.payment.create({
    data: {
      invoiceId,
      amount,
      method: (formData.get("method") as string) || null,
      reference: (formData.get("reference") as string) || null,
      notes: (formData.get("notes") as string) || null,
    },
  })

  const invoice = await db.invoice.findUnique({
    where: { id: invoiceId },
    include: { items: true, payments: true, customer: true },
  })
  if (invoice) {
    const total = invoice.items.reduce((s, i) => s + i.quantity * i.unitPrice, 0)
    const paid = invoice.payments.reduce((s, p) => s + p.amount, 0)
    if (paid >= total) {
      await db.invoice.update({ where: { id: invoiceId }, data: { status: "paid", paidAt: new Date() } })
    }
  }

  if (invoice?.customer.email) {
    await sendReceiptEmail(invoiceId)
  }

  revalidatePath(`/invoices/${invoiceId}`)
  revalidatePath("/dashboard")
}

export async function updateInvoice(id: string, formData: FormData) {
  const { companyId } = await requirePermission("invoices.manage")
  const inv = await db.invoice.findFirst({ where: { id, companyId } })
  if (!inv) return

  const dueDate      = new Date(formData.get("dueDate") as string)
  const notes        = (formData.get("notes") as string) || null
  const serviceType  = (formData.get("serviceType") as string) || null
  const descriptions = formData.getAll("description") as string[]
  const quantities   = formData.getAll("quantity") as string[]
  const unitPrices   = formData.getAll("unitPrice") as string[]

  await db.invoiceItem.deleteMany({ where: { invoiceId: id } })
  await db.invoice.update({
    where: { id },
    data: {
      dueDate,
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

  revalidatePath(`/invoices/${id}`)
  revalidatePath("/invoices")
  redirect(`/invoices/${id}`)
}

export async function deletePayment(paymentId: string, invoiceId: string) {
  const { companyId } = await requirePermission("invoices.manage")
  const inv = await db.invoice.findFirst({ where: { id: invoiceId, companyId } })
  if (!inv) return

  await db.payment.delete({ where: { id: paymentId } })

  const updated = await db.invoice.findUnique({
    where: { id: invoiceId },
    include: { items: true, payments: true },
  })
  if (updated && inv.status === "paid") {
    const total = updated.items.reduce((s, i) => s + i.quantity * i.unitPrice, 0)
    const paid = updated.payments.reduce((s, p) => s + p.amount, 0)
    if (paid < total) {
      const newStatus = updated.dueDate < new Date() ? "overdue" : "sent"
      await db.invoice.update({ where: { id: invoiceId }, data: { status: newStatus, paidAt: null } })
    }
  }

  revalidatePath(`/invoices/${invoiceId}`)
}

export async function markOverdueInvoices(companyId: string) {
  const now = new Date()

  const toMark = await db.invoice.findMany({
    where: { companyId, status: "sent", dueDate: { lt: now } },
    include: { items: true, payments: true },
  })
  if (toMark.length === 0) return

  const company = await db.company.findUnique({
    where: { id: companyId },
    select: { lateFeeEnabled: true, lateFeePercent: true, lateFeeGraceDays: true },
  })

  for (const inv of toMark) {
    await db.invoice.update({ where: { id: inv.id }, data: { status: "overdue" } })

    if (company?.lateFeeEnabled && !inv.lateFeeApplied) {
      const graceDeadline = new Date(inv.dueDate)
      graceDeadline.setDate(graceDeadline.getDate() + (company.lateFeeGraceDays ?? 0))
      if (now >= graceDeadline) {
        const subtotal = inv.items.reduce((s, i) => s + i.quantity * i.unitPrice, 0)
        const paid     = inv.payments.reduce((s, p) => s + p.amount, 0)
        const balance  = Math.max(0, subtotal - paid)
        if (balance > 0) {
          const fee = Math.round(balance * (company.lateFeePercent / 100) * 100) / 100
          if (fee > 0) {
            await db.invoiceItem.create({
              data: {
                invoiceId:   inv.id,
                description: `Late fee (${company.lateFeePercent}%)`,
                quantity:    1,
                unitPrice:   fee,
              },
            })
            await db.invoice.update({ where: { id: inv.id }, data: { lateFeeApplied: true } })
          }
        }
      }
    }
  }
}

export async function deleteInvoice(id: string) {
  const { companyId } = await requirePermission("invoices.manage")
  await db.invoice.deleteMany({ where: { id, companyId } })
  revalidatePath("/invoices")
  redirect("/invoices")
}

export async function generateMonthlyInvoices(formData: FormData) {
  const { companyId } = await requirePermission("invoices.manage")

  const month = parseInt(formData.get("month") as string) // 1–12
  const year = parseInt(formData.get("year") as string)
  const dueDay = parseInt((formData.get("dueDay") as string) || "30")

  // All active customers with a monthly rate
  const customers = await db.customer.findMany({
    where: { companyId, status: "active", monthlyRate: { not: null, gt: 0 } },
    select: { id: true, monthlyRate: true, autoPayEnabled: true, autoPayMethodId: true, stripeCustomerId: true },
  })

  if (customers.length === 0) redirect("/invoices/generate?result=none")

  // Find customers already billed in this calendar month
  const startOfMonth = new Date(year, month - 1, 1)
  const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999)
  const existing = await db.invoice.findMany({
    where: { companyId, issuedAt: { gte: startOfMonth, lte: endOfMonth } },
    select: { customerId: true },
  })
  const alreadyBilled = new Set(existing.map((i) => i.customerId))

  const toCreate = customers.filter((c) => !alreadyBilled.has(c.id))
  if (toCreate.length === 0) redirect("/invoices/generate?result=skipped")

  // Due date = Nth day of next month
  const dueDate = new Date(year, month, Math.min(dueDay, 28))

  let nextNum = await lastInvoiceNum(companyId)

  const company = await db.company.findUnique({
    where: { id: companyId },
    select: { stripeAccountId: true },
  })

  let autoCharged = 0

  for (const customer of toCreate) {
    nextNum++
    const token = crypto.randomUUID()
    const invoice = await db.invoice.create({
      data: {
        companyId,
        customerId: customer.id,
        invoiceNumber: invoiceNum(nextNum),
        dueDate,
        issuedAt: startOfMonth,
        status: "draft",
        serviceType: "monthly",
        payToken: token,
        items: {
          create: [{ description: "Monthly pool service", quantity: 1, unitPrice: customer.monthlyRate! }],
        },
      },
    })

    // Auto-charge customers with a saved card
    if (
      customer.autoPayEnabled &&
      customer.autoPayMethodId &&
      customer.stripeCustomerId &&
      company?.stripeAccountId
    ) {
      try {
        const pi = await stripe.paymentIntents.create(
          {
            amount: Math.round(customer.monthlyRate! * 100),
            currency: "usd",
            customer: customer.stripeCustomerId,
            payment_method: customer.autoPayMethodId,
            confirm: true,
            off_session: true,
            metadata: { invoiceId: invoice.id, companyId },
          },
          { stripeAccount: company.stripeAccountId }
        )
        if (pi.status === "succeeded") {
          await db.payment.create({
            data: {
              invoiceId: invoice.id,
              amount: customer.monthlyRate!,
              method: "card",
              reference: pi.id,
              notes: "Auto-pay via saved card",
            },
          })
          await db.invoice.update({
            where: { id: invoice.id },
            data: { status: "paid", paidAt: new Date() },
          })
          autoCharged++
        }
      } catch {
        // Auto-pay failed (expired card, etc.) — invoice stays as draft, customer pays manually
      }
    }
  }

  revalidatePath("/invoices")
  redirect(
    `/invoices/generate?result=generated&month=${month}&year=${year}&count=${toCreate.length}&autoCharged=${autoCharged}`
  )
}
