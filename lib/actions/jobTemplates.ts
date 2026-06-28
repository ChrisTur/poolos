"use server"

import { db } from "@/lib/db"
import { requirePermission } from "@/lib/session"
import { refresh } from "next/cache"

export async function createJobTemplate(formData: FormData) {
  const { companyId } = await requirePermission("settings.templates")
  const name             = (formData.get("name") as string)?.trim()
  const description      = (formData.get("description") as string)?.trim() || null
  const defaultNotes     = (formData.get("defaultNotes") as string)?.trim() || null
  const estimatedMinutes = formData.get("estimatedMinutes") ? parseInt(formData.get("estimatedMinutes") as string) : null

  if (!name) return
  await db.jobTemplate.create({ data: { companyId, name, description, defaultNotes, estimatedMinutes } })
  refresh()
}

export async function updateJobTemplate(id: string, formData: FormData) {
  const { companyId } = await requirePermission("settings.templates")
  const name             = (formData.get("name") as string)?.trim()
  const description      = (formData.get("description") as string)?.trim() || null
  const defaultNotes     = (formData.get("defaultNotes") as string)?.trim() || null
  const estimatedMinutes = formData.get("estimatedMinutes") ? parseInt(formData.get("estimatedMinutes") as string) : null

  if (!name) return
  await db.jobTemplate.updateMany({ where: { id, companyId }, data: { name, description, defaultNotes, estimatedMinutes } })
  refresh()
}

export async function deleteJobTemplate(id: string) {
  const { companyId } = await requirePermission("settings.templates")
  await db.jobTemplate.deleteMany({ where: { id, companyId } })
  refresh()
}

export async function toggleJobTemplate(id: string, isActive: boolean) {
  const { companyId } = await requirePermission("settings.templates")
  await db.jobTemplate.updateMany({ where: { id, companyId }, data: { isActive } })
  refresh()
}

export async function addTemplateStep(templateId: string, formData: FormData) {
  const { companyId } = await requirePermission("settings.templates")
  const label = (formData.get("label") as string)?.trim()
  if (!label) return

  // Verify template belongs to company
  const template = await db.jobTemplate.findFirst({ where: { id: templateId, companyId }, select: { id: true } })
  if (!template) return

  const last = await db.jobTemplateStep.findFirst({
    where: { templateId },
    orderBy: { position: "desc" },
    select: { position: true },
  })
  await db.jobTemplateStep.create({ data: { templateId, label, position: (last?.position ?? -1) + 1 } })
  refresh()
}

export async function deleteTemplateStep(stepId: string) {
  const { companyId } = await requirePermission("settings.templates")
  // Verify ownership via template → company
  const step = await db.jobTemplateStep.findFirst({
    where: { id: stepId, template: { companyId } },
    select: { id: true },
  })
  if (!step) return
  await db.jobTemplateStep.delete({ where: { id: stepId } })
  refresh()
}
