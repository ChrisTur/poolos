import { requireSuperAdmin } from "@/lib/session"
import { db } from "@/lib/db"
import { toCsv, csvResponse } from "@/lib/csv"
import { PLANS, type PlanId } from "@/lib/plans"

function monthKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
}
function monthLabel(key: string) {
  const [y, m] = key.split("-").map(Number)
  return new Date(y, m - 1, 1).toLocaleString("default", { month: "short", year: "numeric" })
}
function last12Months(): string[] {
  const now = new Date()
  return Array.from({ length: 12 }, (_, i) =>
    monthKey(new Date(now.getFullYear(), now.getMonth() - (11 - i), 1))
  )
}

const CATEGORY_LABELS: Record<string, string> = {
  cloud: "Cloud Computing", email: "Email Service", sem: "Search Ads / SEM",
  saas: "SaaS Tools", payroll: "Payroll / Contractors", other: "Other",
}

export async function GET() {
  await requireSuperAdmin()

  const now = new Date()
  const [companies, expenses] = await Promise.all([
    db.company.findMany({
      select: { id: true, name: true, plan: true, isActive: true, stripeSubStatus: true, createdAt: true },
    }),
    db.platformExpense.findMany({
      select: { amount: true, isRecurring: true, frequency: true, date: true, category: true, description: true, vendor: true },
      orderBy: { date: "asc" },
    }),
  ])

  // ── Revenue metrics ──────────────────────────────────────────────────────
  const stripeMrr = companies
    .filter((c) => c.stripeSubStatus === "active")
    .reduce((s, c) => s + (PLANS[c.plan as PlanId]?.priceMonthly ?? 0), 0)

  const expKey = (e: typeof expenses[0]) =>
    `${e.description}|||${e.vendor ?? ""}|||${e.amount}|||${e.category}|||${e.frequency}`
  const unique = new Map<string, typeof expenses[0]>()
  for (const e of expenses.filter((x) => x.isRecurring)) unique.set(expKey(e), e)
  const monthlyBurn = [...unique.values()].reduce((s, e) =>
    s + (e.frequency === "annual" ? e.amount / 12 : e.amount), 0)

  const thisYear = now.getFullYear()
  const ytdTotal = expenses.filter((e) => new Date(e.date).getFullYear() === thisYear)
    .reduce((s, e) => s + e.amount, 0)
  const mtdTotal = expenses.filter((e) => {
    const d = new Date(e.date)
    return d.getMonth() === now.getMonth() && d.getFullYear() === thisYear
  }).reduce((s, e) => s + e.amount, 0)

  const netMrr = stripeMrr - monthlyBurn
  const marginPct = stripeMrr > 0 ? Math.round((netMrr / stripeMrr) * 100) : null
  const payingCount = companies.filter((c) => c.isActive && c.plan !== "trial").length

  // ── Section 1: Key metrics ──────────────────────────────────────────────
  const metricsRows: Record<string, unknown>[] = [
    { Metric: "Report Date",        Value: now.toISOString().split("T")[0] },
    { Metric: "Stripe MRR",         Value: stripeMrr.toFixed(2) },
    { Metric: "ARR",                Value: (stripeMrr * 12).toFixed(2) },
    { Metric: "Monthly Burn Rate",  Value: monthlyBurn.toFixed(2) },
    { Metric: "Net MRR",            Value: netMrr.toFixed(2) },
    { Metric: "Margin %",           Value: marginPct !== null ? `${marginPct}%` : "" },
    { Metric: "YTD Spend",          Value: ytdTotal.toFixed(2) },
    { Metric: "This Month Spend",   Value: mtdTotal.toFixed(2) },
    { Metric: "Paying Companies",   Value: String(payingCount) },
    { Metric: "Trial Companies",    Value: String(companies.filter((c) => c.isActive && c.plan === "trial").length) },
  ]

  // ── Section 2: Monthly spend (last 12 months) ───────────────────────────
  const months = last12Months()
  const monthlySpend: Record<string, number> = {}
  for (const k of months) monthlySpend[k] = 0
  for (const e of expenses) {
    const k = monthKey(new Date(e.date))
    if (k in monthlySpend) monthlySpend[k] += e.amount
  }
  const monthlyRows: Record<string, unknown>[] = months.map((k) => ({
    Month: monthLabel(k),
    "Actual Spend": monthlySpend[k].toFixed(2),
  }))

  // ── Section 3: YTD category breakdown ──────────────────────────────────
  const byCat: Record<string, number> = {}
  for (const e of expenses.filter((e) => new Date(e.date).getFullYear() === thisYear)) {
    byCat[e.category] = (byCat[e.category] ?? 0) + e.amount
  }
  const categoryRows: Record<string, unknown>[] = Object.entries(byCat)
    .sort(([, a], [, b]) => b - a)
    .map(([cat, total]) => ({
      Category: CATEGORY_LABELS[cat] ?? cat,
      "YTD Amount": total.toFixed(2),
      "% of YTD": ytdTotal > 0 ? `${Math.round((total / ytdTotal) * 100)}%` : "",
    }))

  // ── Section 4: Plan breakdown ───────────────────────────────────────────
  const planMrr = companies
    .filter((c) => c.isActive && c.plan !== "trial")
    .reduce((s, c) => s + (PLANS[c.plan as PlanId]?.priceMonthly ?? 0), 0)

  const planRows: Record<string, unknown>[] = (["starter", "pro", "unlimited", "trial"] as PlanId[]).map((id) => {
    const members = companies.filter((c) => c.isActive && c.plan === id)
    const mrr = id !== "trial" ? members.length * (PLANS[id]?.priceMonthly ?? 0) : 0
    return {
      Plan: PLANS[id]?.label ?? id,
      Count: String(members.length),
      MRR: mrr.toFixed(2),
      "% of MRR": planMrr > 0 && mrr > 0 ? `${Math.round((mrr / planMrr) * 100)}%` : "",
    }
  })

  // Build the CSV from named sections with blank-line separators
  const sections = [
    ["KEY METRICS", metricsRows],
    ["MONTHLY SPEND — LAST 12 MONTHS", monthlyRows],
    ["YTD SPEND BY CATEGORY", categoryRows],
    ["PLAN BREAKDOWN", planRows],
  ] as [string, Record<string, unknown>[]][]

  const parts: string[] = []
  for (const [title, rows] of sections) {
    if (rows.length === 0) continue
    parts.push(`# ${title}`)
    parts.push(toCsv(rows))
  }

  return csvResponse(
    `admin-reports-${now.toISOString().split("T")[0]}.csv`,
    parts.join("\n\n")
  )
}
