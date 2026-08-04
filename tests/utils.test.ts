import { describe, it, expect } from "vitest"
import { formatCurrency, formatDate, formatPhone, invoiceTotal, paymentTotal, parseDate, parseLineItems } from "@/lib/utils"

describe("formatCurrency()", () => {
  it("formats a whole-dollar amount", () => {
    expect(formatCurrency(150)).toBe("$150.00")
  })

  it("formats a decimal amount", () => {
    expect(formatCurrency(49.99)).toBe("$49.99")
  })

  it("formats zero", () => {
    expect(formatCurrency(0)).toBe("$0.00")
  })

  it("formats negative amounts", () => {
    expect(formatCurrency(-25)).toBe("-$25.00")
  })

  it("formats large amounts with commas", () => {
    expect(formatCurrency(12345.67)).toBe("$12,345.67")
  })
})

describe("formatDate()", () => {
  it("formats a Date object", () => {
    expect(formatDate(new Date(2026, 0, 15))).toBe("Jan 15, 2026")
  })

  it("formats an ISO date string", () => {
    expect(formatDate("2026-07-04T00:00:00.000Z")).toMatch(/Jul \d, 2026/)
  })
})

describe("formatPhone()", () => {
  it("formats a 10-digit string", () => {
    expect(formatPhone("8005551234")).toBe("(800) 555-1234")
  })

  it("formats digits with existing punctuation", () => {
    expect(formatPhone("800-555-1234")).toBe("(800) 555-1234")
  })

  it("returns non-10-digit strings unchanged", () => {
    expect(formatPhone("555-1234")).toBe("555-1234")
  })

  it("returns empty string unchanged", () => {
    expect(formatPhone("")).toBe("")
  })
})

describe("invoiceTotal()", () => {
  it("returns 0 for empty items", () => {
    expect(invoiceTotal([])).toBe(0)
  })

  it("computes a single line item", () => {
    expect(invoiceTotal([{ quantity: 4, unitPrice: 50 }])).toBe(200)
  })

  it("sums multiple line items", () => {
    expect(invoiceTotal([
      { quantity: 1, unitPrice: 99 },
      { quantity: 2, unitPrice: 25 },
      { quantity: 3, unitPrice: 10 },
    ])).toBe(179)
  })

  it("handles fractional unit prices", () => {
    expect(invoiceTotal([{ quantity: 3, unitPrice: 33.33 }])).toBeCloseTo(99.99, 2)
  })
})

describe("paymentTotal()", () => {
  it("returns 0 for empty payments", () => {
    expect(paymentTotal([])).toBe(0)
  })

  it("sums a single payment", () => {
    expect(paymentTotal([{ amount: 75.50 }])).toBe(75.50)
  })

  it("sums multiple payments", () => {
    expect(paymentTotal([{ amount: 100 }, { amount: 50.25 }, { amount: 24.75 }])).toBe(175)
  })
})

describe("parseDate()", () => {
  it("parses YYYY-MM-DD as local midnight, not UTC", () => {
    const d = parseDate("2026-07-04")
    expect(d.getFullYear()).toBe(2026)
    expect(d.getMonth()).toBe(6)   // 0-indexed
    expect(d.getDate()).toBe(4)
    expect(d.getHours()).toBe(0)
    expect(d.getMinutes()).toBe(0)
  })

  it("handles start-of-year dates", () => {
    const d = parseDate("2026-01-01")
    expect(d.getFullYear()).toBe(2026)
    expect(d.getMonth()).toBe(0)
    expect(d.getDate()).toBe(1)
  })
})

describe("parseLineItems()", () => {
  it("returns empty array when FormData has no line items", () => {
    expect(parseLineItems(new FormData())).toEqual([])
  })

  it("parses a single line item", () => {
    const fd = new FormData()
    fd.append("description", "Monthly service")
    fd.append("quantity",    "1")
    fd.append("unitPrice",   "150")

    expect(parseLineItems(fd)).toEqual([
      { description: "Monthly service", quantity: 1, unitPrice: 150 },
    ])
  })

  it("parses multiple line items in order", () => {
    const fd = new FormData()
    fd.append("description", "Weekly service")
    fd.append("description", "Chemical treatment")
    fd.append("quantity",    "4")
    fd.append("quantity",    "1")
    fd.append("unitPrice",   "50")
    fd.append("unitPrice",   "30")

    expect(parseLineItems(fd)).toEqual([
      { description: "Weekly service",    quantity: 4, unitPrice: 50 },
      { description: "Chemical treatment", quantity: 1, unitPrice: 30 },
    ])
  })

  it("supports a custom suffix (e.g. '[]' for template forms)", () => {
    const fd = new FormData()
    fd.append("description[]", "Filter clean")
    fd.append("quantity[]",    "1")
    fd.append("unitPrice[]",   "75")

    expect(parseLineItems(fd, "[]")).toEqual([
      { description: "Filter clean", quantity: 1, unitPrice: 75 },
    ])
  })

  it("defaults missing quantity to 1 and missing unitPrice to 0", () => {
    const fd = new FormData()
    fd.append("description", "Partial item")
    fd.append("quantity",    "")
    fd.append("unitPrice",   "")

    expect(parseLineItems(fd)).toEqual([
      { description: "Partial item", quantity: 1, unitPrice: 0 },
    ])
  })
})
