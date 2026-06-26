"use server"

import { db } from "@/lib/db"
import { resend, buildContactReplyHtml } from "@/lib/email"
import { requireSuperAdmin } from "@/lib/session"
import { revalidatePath } from "next/cache"

export async function submitContactForm(_: unknown, formData: FormData) {
  const name    = (formData.get("name")    as string | null)?.trim()
  const email   = (formData.get("email")   as string | null)?.trim()
  const subject = (formData.get("subject") as string | null)?.trim() || null
  const body    = (formData.get("body")    as string | null)?.trim()

  if (!name || !email || !body) {
    return { error: "Name, email, and message are required." }
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: "Please enter a valid email address." }
  }
  if (body.length > 5000) {
    return { error: "Message is too long (max 5000 characters)." }
  }

  await db.contactMessage.create({ data: { name, email, subject, body } })

  // Notify hello@poolos.biz so we don't miss inbound inquiries
  try {
    await resend.emails.send({
      from:    "PoolOS <billing@poolos.biz>",
      to:      "hello@poolos.biz",
      replyTo: email,
      subject: subject ? `Contact: ${subject}` : `New contact message from ${name}`,
      html:    `<p><strong>From:</strong> ${name} &lt;${email}&gt;</p><p><strong>Message:</strong></p><blockquote style="border-left:3px solid #0ea5e9;padding-left:12px;color:#374151">${body.replace(/\n/g, "<br>")}</blockquote>`,
    })
  } catch {
    // Don't fail the form if notification email fails — message is already saved
  }

  return { success: true }
}

export async function markContactRead(id: string) {
  await requireSuperAdmin()
  await db.contactMessage.update({
    where: { id },
    data: { status: "read" },
  })
  revalidatePath("/admin/contact")
}

export async function replyToContact(_: unknown, formData: FormData) {
  const session = await requireSuperAdmin()

  const id        = formData.get("id")        as string
  const replyBody = (formData.get("replyBody") as string | null)?.trim()

  if (!id || !replyBody) return { error: "Reply cannot be empty." }

  const msg = await db.contactMessage.findUnique({ where: { id } })
  if (!msg) return { error: "Message not found." }

  await resend.emails.send({
    from:     "PoolOS <billing@poolos.biz>",
    replyTo:  "hello@poolos.biz",
    to:       msg.email,
    subject:  msg.subject ? `Re: ${msg.subject}` : "Re: Your message to PoolOS",
    html:     buildContactReplyHtml({
      name:         msg.name,
      originalBody: msg.body,
      replyBody,
    }),
  })

  await db.contactMessage.update({
    where: { id },
    data: {
      status:    "replied",
      replyBody,
      repliedAt: new Date(),
      repliedBy: session.name ?? session.email ?? "Admin",
    },
  })

  revalidatePath("/admin/contact")
  revalidatePath(`/admin/contact/${id}`)
  return { success: true }
}

export async function deleteContactMessage(id: string) {
  await requireSuperAdmin()
  await db.contactMessage.delete({ where: { id } })
  revalidatePath("/admin/contact")
}
