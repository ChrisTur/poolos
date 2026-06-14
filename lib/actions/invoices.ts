"use server"

import { db } from "@/lib/db"
import { requireSession } from "@/lib/session"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

async function nextInvoiceNumber(companyId: string): Promise<string> {
  const last = await db.invoice.findFirst({
    where: { companyId },
    orderBy: { invoiceNumber: "desc" },
  })
  if (!last) return "INV-0001"
  const num = parseInt(last.invoiceNumber.replace("INV-", "")) + 1
  return `INV-${String(num).padStart(4, "0")}`
}

export async function createInvoice(formData: FormData) {
  const { companyId } = await requireSession()

  const customerId = formData.get("customerId") as string
  const dueDate = new Date(formData.get("dueDate") as string)
  const notes = (formData.get("notes") as string) || null
  const descriptions = formData.getAll("description") as string[]
  const quantities = formData.getAll("quantity") as string[]
  const unitPrices = formData.getAll("unitPrice") as string[]

  const invoice = await db.invoice.create({
    data: {
      companyId,
      customerId,
      invoiceNumber: await nextInvoiceNumber(companyId),
      dueDate,
      notes,
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

  revalidatePath("/invoices")
  redirect(`/invoices/${invoice.id}`)
}

export async function updateInvoiceStatus(id: string, status: string) {
  const { companyId } = await requireSession()
  const inv = await db.invoice.findFirst({ where: { id, companyId } })
  if (!inv) return

  const data: Record<string, unknown> = { status }
  if (status === "paid") data.paidAt = new Date()
  await db.invoice.update({ where: { id }, data })
  revalidatePath(`/invoices/${id}`)
  revalidatePath("/invoices")
  revalidatePath("/dashboard")
}

export async function addPayment(invoiceId: string, formData: FormData) {
  const { companyId } = await requireSession()
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
    include: { items: true, payments: true },
  })
  if (invoice) {
    const total = invoice.items.reduce((s, i) => s + i.quantity * i.unitPrice, 0)
    const paid = invoice.payments.reduce((s, p) => s + p.amount, 0)
    if (paid >= total) {
      await db.invoice.update({ where: { id: invoiceId }, data: { status: "paid", paidAt: new Date() } })
    }
  }

  revalidatePath(`/invoices/${invoiceId}`)
  revalidatePath("/dashboard")
}

export async function deleteInvoice(id: string) {
  const { companyId } = await requireSession()
  await db.invoice.deleteMany({ where: { id, companyId } })
  revalidatePath("/invoices")
  redirect("/invoices")
}
