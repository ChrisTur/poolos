"use server"

import { bucket, publicUrl } from "@/lib/gcs"
import { db } from "@/lib/db"
import { requirePermission } from "@/lib/session"
import { revalidatePath } from "next/cache"

export async function getUploadUrl(filename: string, mimeType: string) {
  const { companyId } = await requirePermission("customers.edit")
  const safeFilename = filename.replace(/[^a-zA-Z0-9._-]/g, "_")
  const key = `${companyId}/${Date.now()}-${safeFilename}`

  const [url] = await bucket().file(key).getSignedUrl({
    version: "v4",
    action: "write",
    expires: Date.now() + 5 * 60 * 1000, // 5 minutes
    contentType: mimeType,
  })

  return { url, key }
}

export async function saveAttachment({
  key,
  filename,
  mimeType,
  size,
  customerId,
  serviceVisitId,
}: {
  key: string
  filename: string
  mimeType: string
  size: number
  customerId?: string
  serviceVisitId?: string
}) {
  const { companyId } = await requirePermission("customers.edit")

  await db.attachment.create({
    data: { key, filename, mimeType, size, customerId: customerId ?? null, serviceVisitId: serviceVisitId ?? null, companyId },
  })

  if (customerId) revalidatePath(`/customers/${customerId}`)
}

export async function deleteAttachment(id: string, customerId?: string) {
  const { companyId } = await requirePermission("customers.edit")

  const attachment = await db.attachment.findFirst({ where: { id, companyId } })
  if (!attachment) return

  try {
    await bucket().file(attachment.key).delete()
  } catch {
    // File may already be gone from GCS — still remove the DB record
  }

  await db.attachment.delete({ where: { id } })
  if (customerId) revalidatePath(`/customers/${customerId}`)
}

export async function getAttachmentUrl(key: string) {
  const { companyId: _ } = await requirePermission("customers.edit") // auth gate

  // Signed read URL valid for 1 hour
  const [url] = await bucket().file(key).getSignedUrl({
    version: "v4",
    action: "read",
    expires: Date.now() + 60 * 60 * 1000,
  })

  return url
}
