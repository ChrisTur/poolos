"use server"

import { db } from "@/lib/db"
import { requirePermission, requireSuperAdmin } from "@/lib/session"
import { resend, FROM } from "@/lib/email"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

const ADMIN_EMAIL = "hello@poolos.biz"
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://poolos.biz"

export async function submitTicket(_: unknown, formData: FormData) {
  const user = await requirePermission("support.view")
  const companyId = user.companyId as string

  const subject  = (formData.get("subject")  as string | null)?.trim()
  const category = (formData.get("category") as string | null)?.trim()
  const body     = (formData.get("body")     as string | null)?.trim()

  if (!subject || !category || !body) return { error: "All fields are required." }
  if (body.length > 5000) return { error: "Message is too long (max 5,000 characters)." }

  const ticket = await db.supportTicket.create({
    data: {
      subject,
      category,
      companyId,
      submittedById: user.id ?? undefined,
      messages: {
        create: {
          body,
          fromAdmin:  false,
          authorName: user.name ?? user.email ?? "Company",
        },
      },
    },
    include: { company: { select: { name: true } } },
  })

  // Notify admin
  try {
    await resend.emails.send({
      from:    FROM,
      to:      ADMIN_EMAIL,
      subject: `[Support] ${subject} — ${ticket.company.name}`,
      html: `
        <p><strong>New support ticket from ${ticket.company.name}</strong></p>
        <p><strong>Category:</strong> ${category}</p>
        <p><strong>Subject:</strong> ${subject}</p>
        <p><strong>Message:</strong></p>
        <blockquote style="border-left:3px solid #0ea5e9;padding-left:12px;color:#374151">
          ${body.replace(/\n/g, "<br>")}
        </blockquote>
        <p><a href="${APP_URL}/admin/support/${ticket.id}">View ticket →</a></p>
      `,
    })
  } catch { /* don't fail if email fails — ticket is saved */ }

  redirect(`/support/${ticket.id}`)
}

export async function replyToTicket(_: unknown, formData: FormData) {
  const user = await requirePermission("support.view")
  const ticketId = formData.get("ticketId") as string
  const body     = (formData.get("body") as string | null)?.trim()

  if (!ticketId || !body) return { error: "Reply cannot be empty." }

  const ticket = await db.supportTicket.findFirst({
    where: { id: ticketId, companyId: user.companyId as string },
  })
  if (!ticket) return { error: "Ticket not found." }
  if (ticket.status === "closed") return { error: "This ticket is closed." }

  await db.supportTicketMessage.create({
    data: {
      ticketId,
      body,
      fromAdmin:  false,
      authorName: user.name ?? user.email ?? "Company",
    },
  })

  // Re-open if resolved so admin sees the follow-up
  if (ticket.status === "resolved") {
    await db.supportTicket.update({
      where: { id: ticketId },
      data: { status: "open", updatedAt: new Date() },
    })
  } else {
    await db.supportTicket.update({ where: { id: ticketId }, data: { updatedAt: new Date() } })
  }

  revalidatePath(`/support/${ticketId}`)
  return { success: true }
}

export async function adminReplyToTicket(_: unknown, formData: FormData) {
  const session = await requireSuperAdmin()

  const ticketId   = formData.get("ticketId")  as string
  const body       = (formData.get("body")     as string | null)?.trim()
  const nextStatus = (formData.get("status")   as string | null) ?? undefined

  if (!ticketId || !body) return { error: "Reply cannot be empty." }

  const ticket = await db.supportTicket.findUnique({
    where: { id: ticketId },
    include: {
      company: {
        include: {
          users: { where: { role: "owner" }, select: { email: true, firstName: true }, take: 1 },
        },
      },
    },
  })
  if (!ticket) return { error: "Ticket not found." }

  const adminName = session.name ?? "PoolOS Support"

  await db.$transaction([
    db.supportTicketMessage.create({
      data: { ticketId, body, fromAdmin: true, authorName: adminName },
    }),
    db.supportTicket.update({
      where: { id: ticketId },
      data: {
        status:    nextStatus ?? (ticket.status === "open" ? "in_progress" : ticket.status),
        updatedAt: new Date(),
      },
    }),
  ])

  // Email company owner
  const owner = ticket.company.users[0]
  if (owner) {
    try {
      await resend.emails.send({
        from:    FROM,
        replyTo: ADMIN_EMAIL,
        to:      owner.email,
        subject: `Re: ${ticket.subject} [Ticket #${ticket.id.slice(-6).toUpperCase()}]`,
        html: `
          <p>Hi ${owner.firstName},</p>
          <p>We've replied to your support ticket:</p>
          <blockquote style="border-left:3px solid #0ea5e9;padding-left:12px;color:#374151">
            ${body.replace(/\n/g, "<br>")}
          </blockquote>
          <p><a href="${APP_URL}/support/${ticket.id}">View ticket & reply →</a></p>
          <p style="color:#6b7280;font-size:12px">Ticket #${ticket.id.slice(-6).toUpperCase()} · ${ticket.subject}</p>
        `,
      })
    } catch { /* don't fail if email fails */ }
  }

  revalidatePath(`/admin/support/${ticketId}`)
  revalidatePath("/admin/support")
  return { success: true }
}

export async function updateTicketStatus(ticketId: string, status: string) {
  await requireSuperAdmin()
  await db.supportTicket.update({ where: { id: ticketId }, data: { status, updatedAt: new Date() } })
  revalidatePath(`/admin/support/${ticketId}`)
  revalidatePath("/admin/support")
}
