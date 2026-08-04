import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount)
}

export function formatDate(date: Date | string) {
  return new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
}

export function formatPhone(phone: string) {
  const digits = phone.replace(/\D/g, "")
  if (digits.length === 10) return `(${digits.slice(0,3)}) ${digits.slice(3,6)}-${digits.slice(6)}`
  return phone
}

export const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]

export function invoiceTotal(items: { quantity: number; unitPrice: number }[]) {
  return items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0)
}

export function paymentTotal(payments: { amount: number }[]) {
  return payments.reduce((sum, p) => sum + p.amount, 0)
}

// Date inputs return YYYY-MM-DD — parse as local midnight to avoid UTC shift.
export function parseDate(raw: string): Date {
  const [y, m, d] = raw.split("-").map(Number)
  return new Date(y, m - 1, d)
}

export function parseLineItems(formData: FormData, suffix = ""): { description: string; quantity: number; unitPrice: number }[] {
  const descriptions = formData.getAll(`description${suffix}`) as string[]
  const quantities   = formData.getAll(`quantity${suffix}`) as string[]
  const unitPrices   = formData.getAll(`unitPrice${suffix}`) as string[]
  return descriptions.map((desc, i) => ({
    description: desc,
    quantity:    parseFloat(quantities[i] || "1"),
    unitPrice:   parseFloat(unitPrices[i]  || "0"),
  }))
}
