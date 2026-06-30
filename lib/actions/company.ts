"use server"

import { db } from "@/lib/db"
import { requireSession, requirePermission } from "@/lib/session"
import { bucket } from "@/lib/gcs"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { cookies } from "next/headers"
import bcrypt from "bcryptjs"
import crypto from "crypto"

function checkbox(formData: FormData, name: string): boolean {
  return formData.getAll(name).includes("true")
}

export async function completeOnboarding(formData: FormData) {
  const user = await requireSession()

  await db.company.update({
    where: { id: user.companyId },
    data: {
      phone: (formData.get("phone") as string) || null,
      address: (formData.get("address") as string) || null,
      city: (formData.get("city") as string) || null,
      state: (formData.get("state") as string) || null,
      zip: (formData.get("zip") as string) || null,
      website: (formData.get("website") as string) || null,
    },
  })

  redirect("/dashboard")
}

export async function updateCompany(formData: FormData) {
  const user = await requirePermission("settings.company")

  await db.company.update({
    where: { id: user.companyId },
    data: {
      name: formData.get("name") as string,
      phone: (formData.get("phone") as string) || null,
      address: (formData.get("address") as string) || null,
      city: (formData.get("city") as string) || null,
      state: (formData.get("state") as string) || null,
      zip: (formData.get("zip") as string) || null,
      website: (formData.get("website") as string) || null,
      bccEmail: (formData.get("bccEmail") as string) || null,
      replyToEmail: (formData.get("replyToEmail") as string) || null,
      defaultDueDays: parseInt((formData.get("defaultDueDays") as string) || "30") || 30,
      lateFeeEnabled:   checkbox(formData, "lateFeeEnabled"),
      lateFeePercent:   parseFloat((formData.get("lateFeePercent") as string) || "1.5") || 1.5,
      lateFeeGraceDays: parseInt((formData.get("lateFeeGraceDays") as string) || "0") || 0,
      cardFeeEnabled:   checkbox(formData, "cardFeeEnabled"),
      cardFeePercent:   parseFloat((formData.get("cardFeePercent") as string) || "2.9") || 2.9,
      cardFeeFixed:     parseFloat((formData.get("cardFeeFixed") as string) || "0.30") || 0,
      reviewRequestEnabled:     checkbox(formData, "reviewRequestEnabled"),
      reviewRequestAfterVisits: parseInt((formData.get("reviewRequestAfterVisits") as string) || "5") || 5,
      googleReviewUrl:          (formData.get("googleReviewUrl") as string) || null,
      publicPageEnabled:  checkbox(formData, "publicPageEnabled"),
      publicPageTagline:  (formData.get("publicPageTagline") as string) || null,
      publicPageAbout:    (formData.get("publicPageAbout") as string) || null,
      serviceArea:        (formData.get("serviceArea") as string) || null,
    },
  })

  revalidatePath("/settings/company")
}

export async function updatePublicPage(formData: FormData) {
  const user = await requirePermission("settings.company")

  await db.company.update({
    where: { id: user.companyId },
    data: {
      publicPageEnabled:     checkbox(formData, "publicPageEnabled"),
      publicPageTagline:     (formData.get("publicPageTagline") as string) || null,
      publicPageAbout:       (formData.get("publicPageAbout") as string) || null,
      serviceArea:           (formData.get("serviceArea") as string) || null,
      publicPageShowPhone:   checkbox(formData, "publicPageShowPhone"),
      publicPageShowWebsite: checkbox(formData, "publicPageShowWebsite"),
      publicPageShowAddress: checkbox(formData, "publicPageShowAddress"),
      publicPageShowEmail:   checkbox(formData, "publicPageShowEmail"),
      publicPageShowReviews: checkbox(formData, "publicPageShowReviews"),
    },
  })

  revalidatePath("/settings/company")
}

export async function toggleGalleryPhoto(attachmentId: string) {
  const { companyId } = await requirePermission("settings.company")
  const att = await db.attachment.findFirst({ where: { id: attachmentId, companyId } })
  if (!att) return
  await db.attachment.update({ where: { id: attachmentId }, data: { isPublicGallery: !att.isPublicGallery } })
  revalidatePath("/settings/company")
}

export async function uploadGalleryPhoto(formData: FormData) {
  const { companyId } = await requirePermission("settings.company")
  const file = formData.get("photo") as File
  if (!file || file.size === 0) return
  if (file.size > 10 * 1024 * 1024) return

  const allowed = ["image/jpeg", "image/png", "image/webp"]
  if (!allowed.includes(file.type)) return

  const bytes = await file.arrayBuffer()
  const header = new Uint8Array(bytes.slice(0, 12))
  const isJpeg = header[0] === 0xff && header[1] === 0xd8
  const isPng  = header[0] === 0x89 && header[1] === 0x50 && header[2] === 0x4e && header[3] === 0x47
  const isWebp = header[0] === 0x52 && header[1] === 0x49 && header[2] === 0x46 && header[3] === 0x46 &&
                 header[8] === 0x57 && header[9] === 0x45 && header[10] === 0x42 && header[11] === 0x50
  if (!isJpeg && !isPng && !isWebp) return

  const ext = isJpeg ? "jpg" : isPng ? "png" : "webp"
  const key = `gallery/${companyId}/${Date.now()}.${ext}`

  await bucket().file(key).save(Buffer.from(bytes), {
    contentType: file.type,
    metadata: { cacheControl: "public, max-age=31536000" },
  })

  await db.attachment.create({
    data: {
      key,
      filename: file.name,
      mimeType: file.type,
      size: file.size,
      companyId,
      isPublicGallery: true,
    },
  })

  revalidatePath("/settings/company")
}

export async function deleteGalleryPhoto(attachmentId: string) {
  const { companyId } = await requirePermission("settings.company")
  const att = await db.attachment.findFirst({ where: { id: attachmentId, companyId } })
  if (!att) return
  try { await bucket().file(att.key).delete() } catch {}
  await db.attachment.delete({ where: { id: attachmentId } })
  revalidatePath("/settings/company")
}

export async function inviteUser(formData: FormData) {
  const owner = await requirePermission("settings.team")

  const email = (formData.get("email") as string).toLowerCase()
  const existing = await db.user.findUnique({ where: { email } })
  if (existing) redirect("/settings/users?inviteError=exists")

  const tempPassword = crypto.randomBytes(10).toString("hex")
  const hashed = await bcrypt.hash(tempPassword, 12)

  await db.user.create({
    data: {
      email,
      firstName: formData.get("firstName") as string,
      lastName: formData.get("lastName") as string,
      password: hashed,
      role: (formData.get("role") as string) || "technician",
      companyId: owner.companyId,
      mustChangePassword: true,
    },
  })

  const cookieStore = await cookies()
  cookieStore.set("_flash_cred", JSON.stringify({ password: tempPassword, email, type: "invited" }), {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    maxAge: 120,
    path: "/settings/users",
  })
  redirect("/settings/users")
}

export async function deactivateUser(userId: string) {
  const owner = await requirePermission("settings.team")
  const target = await db.user.findUnique({ where: { id: userId } })
  if (!target || target.companyId !== owner.companyId) return
  await db.user.update({ where: { id: userId }, data: { isActive: false } })
  revalidatePath("/settings/users")
}

export async function updatePaymentLinks(formData: FormData) {
  const user = await requirePermission("settings.payments")

  await db.company.update({
    where: { id: user.companyId },
    data: {
      venmoHandle:  (formData.get("venmoHandle")  as string) || null,
      paypalHandle: (formData.get("paypalHandle") as string) || null,
      cashAppHandle:(formData.get("cashAppHandle")as string) || null,
      zellePhone:   (formData.get("zellePhone")   as string) || null,
      zelleEmail:   (formData.get("zelleEmail")   as string) || null,
    },
  })

  revalidatePath("/settings/payments")
}

export async function uploadLogo(formData: FormData) {
  const user = await requirePermission("settings.company")
  const file = formData.get("logo") as File
  if (!file || file.size === 0) return
  if (file.size > 2 * 1024 * 1024) return // 2MB limit
  const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"]
  if (!allowed.includes(file.type)) return

  const bytes = await file.arrayBuffer()
  const header = new Uint8Array(bytes.slice(0, 12))

  // Verify magic bytes — never trust client-supplied MIME type
  const isJpeg = header[0] === 0xff && header[1] === 0xd8 && header[2] === 0xff
  const isPng  = header[0] === 0x89 && header[1] === 0x50 && header[2] === 0x4e && header[3] === 0x47
  const isWebp = header[0] === 0x52 && header[1] === 0x49 && header[2] === 0x46 && header[3] === 0x46 &&
                 header[8] === 0x57 && header[9] === 0x45 && header[10] === 0x42 && header[11] === 0x50
  const isGif  = header[0] === 0x47 && header[1] === 0x49 && header[2] === 0x46 && header[3] === 0x38
  if (!isJpeg && !isPng && !isWebp && !isGif) return

  const detectedType = isJpeg ? "image/jpeg" : isPng ? "image/png" : isWebp ? "image/webp" : "image/gif"
  const base64 = Buffer.from(bytes).toString("base64")
  const dataUrl = `data:${detectedType};base64,${base64}`

  await db.company.update({ where: { id: user.companyId }, data: { logoUrl: dataUrl } })
  revalidatePath("/settings/company")
}

export async function updateUserStartAddress(formData: FormData) {
  const { companyId } = await requirePermission("settings.team")
  const userId = formData.get("userId") as string
  const address = (formData.get("defaultStartAddress") as string)?.trim() || null
  await db.user.updateMany({ where: { id: userId, companyId }, data: { defaultStartAddress: address } })
  revalidatePath("/settings/users")
}

export async function resetUserPassword(userId: string) {
  const owner = await requirePermission("settings.team")
  const target = await db.user.findUnique({ where: { id: userId } })
  if (!target || target.companyId !== owner.companyId) return

  const tempPassword = crypto.randomBytes(10).toString("hex")
  const hashed = await bcrypt.hash(tempPassword, 12)
  await db.user.update({ where: { id: userId }, data: { password: hashed, isActive: true, mustChangePassword: true } })
  const cookieStore = await cookies()
  cookieStore.set("_flash_cred", JSON.stringify({ password: tempPassword, email: target.email, type: "reset" }), {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    maxAge: 120,
    path: "/settings/users",
  })
  redirect("/settings/users")
}
