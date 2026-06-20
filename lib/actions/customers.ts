"use server"

import { db } from "@/lib/db"
import { requireSession } from "@/lib/session"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

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
