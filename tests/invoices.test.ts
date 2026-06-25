import { describe, it, expect, vi, beforeEach } from "vitest"

// ── Mocks ────────────────────────────────────────────────────────────────────

vi.mock("@/lib/db", () => ({
  db: {
    invoice: {
      findFirst:  vi.fn(),
      findUnique: vi.fn(),
      create:     vi.fn(),
      update:     vi.fn(),
    },
    payment: {
      create: vi.fn(),
    },
    customer: {
      findFirst: vi.fn(),
    },
  },
}))

vi.mock("@/lib/session", () => ({
  requireSession: vi.fn().mockResolvedValue({
    id: "user-1",
    companyId: "company-1",
    companyName: "Test Pool Co",
    role: "owner",
    email: "owner@testpool.com",
  }),
}))

vi.mock("@/lib/stripe", () => ({
  stripe: {
    paymentIntents: { create: vi.fn() },
  },
}))

vi.mock("@/lib/actions/emails", () => ({
  sendReceiptEmail: vi.fn().mockResolvedValue(undefined),
}))

vi.mock("@/lib/logger", () => ({
  default:    { child: () => ({ info: vi.fn(), warn: vi.fn(), error: vi.fn() }) },
  authLog:    { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
  invoiceLog: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
  paymentLog: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
  emailLog:   { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
  storageLog: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}))

vi.mock("next/navigation", () => ({
  redirect: vi.fn((url: string) => {
    throw Object.assign(new Error("NEXT_REDIRECT"), { digest: `NEXT_REDIRECT:${url}` })
  }),
}))

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }))

// ── Tests ────────────────────────────────────────────────────────────────────

describe("invoice number generation", () => {
  beforeEach(() => { vi.clearAllMocks() })

  it("formats invoice numbers with 4-digit zero-padded suffix", async () => {
    const { db } = await import("@/lib/db")

    // First invoice for a company (no existing invoices)
    vi.mocked(db.invoice.findFirst).mockResolvedValueOnce(null)
    vi.mocked(db.invoice.create).mockResolvedValueOnce({ id: "inv-1" } as never)

    const fd = new FormData()
    fd.set("customerId", "cust-1")
    fd.set("dueDate", "2026-07-01")
    fd.append("description", "Monthly service")
    fd.append("quantity", "1")
    fd.append("unitPrice", "150")

    const { createInvoice } = await import("@/lib/actions/invoices")
    await expect(createInvoice(fd)).rejects.toMatchObject({ digest: expect.stringContaining("NEXT_REDIRECT") })

    const callArg = vi.mocked(db.invoice.create).mock.calls[0][0]
    expect(callArg.data.invoiceNumber).toBe("INV-0001")
  })

  it("increments from the last invoice number", async () => {
    const { db } = await import("@/lib/db")

    vi.mocked(db.invoice.findFirst).mockResolvedValueOnce({ invoiceNumber: "INV-0042" } as never)
    vi.mocked(db.invoice.create).mockResolvedValueOnce({ id: "inv-43" } as never)

    const fd = new FormData()
    fd.set("customerId", "cust-1")
    fd.set("dueDate", "2026-07-01")
    fd.append("description", "Chemical service")
    fd.append("quantity", "1")
    fd.append("unitPrice", "75")

    const { createInvoice } = await import("@/lib/actions/invoices")
    await expect(createInvoice(fd)).rejects.toMatchObject({ digest: expect.stringContaining("NEXT_REDIRECT") })

    const callArg = vi.mocked(db.invoice.create).mock.calls[0][0]
    expect(callArg.data.invoiceNumber).toBe("INV-0043")
  })

  it("creates line items from FormData arrays", async () => {
    const { db } = await import("@/lib/db")

    vi.mocked(db.invoice.findFirst).mockResolvedValueOnce(null)
    vi.mocked(db.invoice.create).mockResolvedValueOnce({ id: "inv-1" } as never)

    const fd = new FormData()
    fd.set("customerId", "cust-1")
    fd.set("dueDate", "2026-07-01")
    fd.append("description", "Weekly service")
    fd.append("description", "Chemical treatment")
    fd.append("quantity", "4")
    fd.append("quantity", "1")
    fd.append("unitPrice", "50")
    fd.append("unitPrice", "30")

    const { createInvoice } = await import("@/lib/actions/invoices")
    await expect(createInvoice(fd)).rejects.toMatchObject({ digest: expect.stringContaining("NEXT_REDIRECT") })

    const call = vi.mocked(db.invoice.create).mock.calls[0]
    const items = (call![0].data.items as { create: Array<Record<string, unknown>> }).create
    expect(items).toHaveLength(2)
    expect(items[0]).toMatchObject({ description: "Weekly service",    quantity: 4,  unitPrice: 50 })
    expect(items[1]).toMatchObject({ description: "Chemical treatment", quantity: 1, unitPrice: 30 })
  })

  it("creates invoice in draft status with a payToken", async () => {
    const { db } = await import("@/lib/db")

    vi.mocked(db.invoice.findFirst).mockResolvedValueOnce(null)
    vi.mocked(db.invoice.create).mockResolvedValueOnce({ id: "inv-1" } as never)

    const fd = new FormData()
    fd.set("customerId", "cust-1")
    fd.set("dueDate", "2026-07-01")
    fd.append("description", "Service")
    fd.append("quantity", "1")
    fd.append("unitPrice", "100")

    const { createInvoice } = await import("@/lib/actions/invoices")
    await expect(createInvoice(fd)).rejects.toMatchObject({ digest: expect.stringContaining("NEXT_REDIRECT") })

    const data = vi.mocked(db.invoice.create).mock.calls[0][0].data
    expect(data.status).toBe("draft")
    expect(data.payToken).toBeTruthy()
    expect(data.companyId).toBe("company-1")
  })
})
