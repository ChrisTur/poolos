"use server"

import { db } from "@/lib/db"
import { requireSession } from "@/lib/session"
import { getPlanFromDb } from "@/lib/plans-db"

// ── CSV parser ──────────────────────────────────────────────────────────────
// Handles quoted fields, escaped quotes (""), CRLF + LF line endings.

function parseCSV(text: string): string[][] {
  const rows: string[][] = []
  const lines = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n")

  for (const line of lines) {
    if (!line.trim()) continue
    const fields: string[] = []
    let i = 0

    while (i < line.length) {
      if (line[i] === '"') {
        i++
        let field = ""
        while (i < line.length) {
          if (line[i] === '"' && line[i + 1] === '"') { field += '"'; i += 2 }
          else if (line[i] === '"') { i++; break }
          else { field += line[i]; i++ }
        }
        fields.push(field.trim())
        if (line[i] === ",") i++
      } else {
        const end = line.indexOf(",", i)
        if (end === -1) { fields.push(line.slice(i).trim()); break }
        fields.push(line.slice(i, end).trim())
        i = end + 1
      }
    }
    // Trailing comma produces an empty last field — push it
    if (line.endsWith(",")) fields.push("")
    rows.push(fields)
  }

  return rows
}

// ── Column aliases ──────────────────────────────────────────────────────────
// Maps common header variations to canonical field names.

const ALIASES: Record<string, string> = {
  // firstName
  firstname: "firstName", first_name: "firstName", first: "firstName",
  "first name": "firstName",
  // lastName
  lastname: "lastName", last_name: "lastName", last: "lastName",
  "last name": "lastName",
  // email
  email: "email", "email address": "email",
  // phone
  phone: "phone", "phone number": "phone", mobile: "phone", cell: "phone",
  // address
  address: "address", "street address": "address", street: "address",
  // city
  city: "city",
  // state
  state: "state", st: "state",
  // zip
  zip: "zip", "zip code": "zip", zipcode: "zip", postal: "zip",
  "postal code": "zip",
  // optional
  monthlyrate: "monthlyRate", monthly_rate: "monthlyRate",
  "monthly rate": "monthlyRate", rate: "monthlyRate",
  pooltype: "poolType", pool_type: "poolType", "pool type": "poolType",
  poolsize: "poolSize", pool_size: "poolSize", "pool size": "poolSize",
  poolnotes: "poolNotes", pool_notes: "poolNotes", "pool notes": "poolNotes",
  notes: "poolNotes",
  servicefrequency: "serviceFrequency", service_frequency: "serviceFrequency",
  "service frequency": "serviceFrequency", frequency: "serviceFrequency",
  status: "status",
}

const REQUIRED = ["firstName", "lastName", "address", "city", "state", "zip"] as const

export type ImportResult = {
  imported: number
  skipped:  { row: number; reason: string; data: string }[]
  limitReached: boolean
}

export async function importCustomersFromCSV(
  _: unknown,
  formData: FormData,
): Promise<ImportResult> {
  const { companyId } = await requireSession()

  const file = formData.get("file") as File | null
  if (!file || file.size === 0) {
    return { imported: 0, skipped: [{ row: 0, reason: "No file provided.", data: "" }], limitReached: false }
  }
  if (!file.name.endsWith(".csv") && file.type !== "text/csv") {
    return { imported: 0, skipped: [{ row: 0, reason: "File must be a .csv", data: "" }], limitReached: false }
  }
  if (file.size > 5 * 1024 * 1024) {
    return { imported: 0, skipped: [{ row: 0, reason: "File exceeds 5 MB limit.", data: "" }], limitReached: false }
  }

  const text = await file.text()
  const rows = parseCSV(text)
  if (rows.length < 2) {
    return { imported: 0, skipped: [{ row: 0, reason: "File has no data rows.", data: "" }], limitReached: false }
  }

  // Map headers → canonical field names
  const rawHeaders = rows[0].map((h) => ALIASES[h.toLowerCase().trim()] ?? h.toLowerCase().trim())

  // Check plan limit
  const [plan, currentCount] = await Promise.all([
    getPlanFromDb((await db.company.findUnique({ where: { id: companyId }, select: { plan: true } }))?.plan),
    db.customer.count({ where: { companyId } }),
  ])
  const limit = plan.limits.customers
  let remaining = limit === Infinity ? Infinity : limit - currentCount

  const toCreate: Parameters<typeof db.customer.create>[0]["data"][] = []
  const skipped:  ImportResult["skipped"] = []

  for (let i = 1; i < rows.length; i++) {
    const raw = rows[i]
    if (raw.every((c) => !c)) continue   // blank row

    const rowNum = i + 1
    const record: Record<string, string> = {}
    rawHeaders.forEach((h, idx) => { if (raw[idx] !== undefined) record[h] = raw[idx] })

    // Validate required fields
    const missing = REQUIRED.filter((f) => !record[f]?.trim())
    if (missing.length) {
      skipped.push({ row: rowNum, reason: `Missing: ${missing.join(", ")}`, data: raw.join(", ") })
      continue
    }

    // Plan limit
    if (remaining <= 0) {
      skipped.push({ row: rowNum, reason: "Plan customer limit reached — upgrade to import more.", data: raw.join(", ") })
      continue
    }

    // monthlyRate — must be a valid number if provided
    let monthlyRate: number | undefined
    if (record.monthlyRate) {
      const n = parseFloat(record.monthlyRate.replace(/[$,]/g, ""))
      if (isNaN(n) || n < 0) {
        skipped.push({ row: rowNum, reason: `Invalid monthly rate: "${record.monthlyRate}"`, data: raw.join(", ") })
        continue
      }
      monthlyRate = n
    }

    toCreate.push({
      companyId,
      firstName:        record.firstName.trim(),
      lastName:         record.lastName.trim(),
      email:            record.email?.trim()   || null,
      phone:            record.phone?.trim()   || null,
      address:          record.address.trim(),
      city:             record.city.trim(),
      state:            record.state.trim(),
      zip:              record.zip.trim(),
      monthlyRate:      monthlyRate ?? null,
      poolType:         record.poolType?.trim()         || null,
      poolSize:         record.poolSize?.trim()         || null,
      poolNotes:        record.poolNotes?.trim()        || null,
      serviceFrequency: record.serviceFrequency?.trim() || null,
      status:           ["active","inactive","suspended"].includes(record.status?.toLowerCase())
                          ? record.status.toLowerCase()
                          : "active",
    })

    remaining--
  }

  if (toCreate.length > 0) {
    // toCreate is built from CSV row objects; cast through unknown to satisfy Prisma's overloaded createMany signature
    await db.customer.createMany({ data: toCreate as unknown as Parameters<typeof db.customer.createMany>[0] extends { data: infer D } ? D : never })
  }

  return {
    imported:     toCreate.length,
    skipped,
    limitReached: remaining <= 0 && skipped.some((s) => s.reason.includes("limit")),
  }
}
