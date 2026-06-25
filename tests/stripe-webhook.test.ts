import { describe, it, expect, vi, beforeEach } from "vitest"
import { NextRequest } from "next/server"

// ── Mocks ────────────────────────────────────────────────────────────────────

vi.mock("@/lib/stripe", () => ({
  stripe: {
    webhooks: {
      constructEvent: vi.fn(),
    },
  },
}))

vi.mock("@/lib/db", () => ({
  db: {
    invoice: {
      findUnique: vi.fn(),
      update:     vi.fn(),
    },
    payment: {
      findFirst: vi.fn(),
      create:    vi.fn(),
    },
    customer: {
      updateMany: vi.fn(),
    },
  },
}))

vi.mock("@/lib/logger", () => ({
  default:    { child: () => ({ info: vi.fn(), warn: vi.fn(), error: vi.fn() }) },
  authLog:    { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
  invoiceLog: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
  paymentLog: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
  emailLog:   { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
  storageLog: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}))

// ── Helpers ──────────────────────────────────────────────────────────────────

function makeRequest(body: string, sig = "valid-sig"): NextRequest {
  return new NextRequest("http://localhost/api/stripe/webhook", {
    method: "POST",
    body,
    headers: { "stripe-signature": sig },
  })
}

function makePaymentIntentEvent(overrides: Record<string, unknown> = {}) {
  return {
    type: "payment_intent.succeeded",
    data: {
      object: {
        id: "pi_test123",
        amount_received: 15000, // $150.00
        payment_method: "pm_test456",
        customer: "cus_test789",
        setup_future_usage: null,
        metadata: { invoiceId: "inv-1" },
        ...overrides,
      },
    },
  }
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe("POST /api/stripe/webhook", () => {
  beforeEach(() => { vi.clearAllMocks() })

  it("returns 400 when stripe-signature header is missing", async () => {
    const req = new NextRequest("http://localhost/api/stripe/webhook", {
      method: "POST",
      body: "{}",
    })

    const { POST } = await import("@/app/api/stripe/webhook/route")
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it("returns 400 when signature verification fails", async () => {
    const { stripe } = await import("@/lib/stripe")
    vi.mocked(stripe.webhooks.constructEvent).mockImplementationOnce(() => {
      throw new Error("No signatures found matching the expected signature")
    })

    const { POST } = await import("@/app/api/stripe/webhook/route")
    const res = await POST(makeRequest("bad-body"))
    expect(res.status).toBe(400)
  })

  it("returns 200 and skips when payment_intent has no invoiceId", async () => {
    const { stripe } = await import("@/lib/stripe")
    vi.mocked(stripe.webhooks.constructEvent).mockReturnValueOnce(
      makePaymentIntentEvent({ metadata: {} }) as never,
    )

    const { POST } = await import("@/app/api/stripe/webhook/route")
    const res = await POST(makeRequest("body"))
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json).toEqual({ received: true })
  })

  it("creates a payment record and marks invoice paid when total is met", async () => {
    const { stripe } = await import("@/lib/stripe")
    const { db }     = await import("@/lib/db")

    vi.mocked(stripe.webhooks.constructEvent).mockReturnValueOnce(
      makePaymentIntentEvent() as never,
    )
    vi.mocked(db.invoice.findUnique).mockResolvedValueOnce({
      id: "inv-1",
      customerId: "cust-1",
      status: "sent",
      items:    [{ quantity: 1, unitPrice: 150 }],
      payments: [],
    } as never)
    vi.mocked(db.payment.findFirst).mockResolvedValueOnce(null)
    vi.mocked(db.payment.create).mockResolvedValueOnce({} as never)
    vi.mocked(db.invoice.update).mockResolvedValueOnce({} as never)

    const { POST } = await import("@/app/api/stripe/webhook/route")
    const res = await POST(makeRequest("body"))

    expect(res.status).toBe(200)
    expect(db.payment.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ invoiceId: "inv-1", amount: 150, method: "card", reference: "pi_test123" }),
      }),
    )
    expect(db.invoice.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: "paid" }) }),
    )
  })

  it("skips duplicate payment when PI was already recorded", async () => {
    const { stripe } = await import("@/lib/stripe")
    const { db }     = await import("@/lib/db")

    vi.mocked(stripe.webhooks.constructEvent).mockReturnValueOnce(
      makePaymentIntentEvent() as never,
    )
    vi.mocked(db.invoice.findUnique).mockResolvedValueOnce({
      id: "inv-1",
      customerId: "cust-1",
      status: "sent",
      items:    [{ quantity: 1, unitPrice: 150 }],
      payments: [{ amount: 150 }],
    } as never)
    // PI already recorded
    vi.mocked(db.payment.findFirst).mockResolvedValueOnce({ id: "pay-existing" } as never)

    const { POST } = await import("@/app/api/stripe/webhook/route")
    await POST(makeRequest("body"))

    expect(db.payment.create).not.toHaveBeenCalled()
  })

  it("skips when invoice is already marked paid", async () => {
    const { stripe } = await import("@/lib/stripe")
    const { db }     = await import("@/lib/db")

    vi.mocked(stripe.webhooks.constructEvent).mockReturnValueOnce(
      makePaymentIntentEvent() as never,
    )
    vi.mocked(db.invoice.findUnique).mockResolvedValueOnce({
      id: "inv-1",
      status: "paid",
      items: [],
      payments: [],
    } as never)

    const { POST } = await import("@/app/api/stripe/webhook/route")
    await POST(makeRequest("body"))

    expect(db.payment.create).not.toHaveBeenCalled()
    expect(db.invoice.update).not.toHaveBeenCalled()
  })

  it("stores autopay method on customer when setup_future_usage is off_session", async () => {
    const { stripe } = await import("@/lib/stripe")
    const { db }     = await import("@/lib/db")

    vi.mocked(stripe.webhooks.constructEvent).mockReturnValueOnce(
      makePaymentIntentEvent({ setup_future_usage: "off_session" }) as never,
    )
    vi.mocked(db.invoice.findUnique).mockResolvedValueOnce({
      id: "inv-1",
      customerId: "cust-1",
      status: "sent",
      items:    [{ quantity: 1, unitPrice: 150 }],
      payments: [],
    } as never)
    vi.mocked(db.payment.findFirst).mockResolvedValueOnce(null)
    vi.mocked(db.payment.create).mockResolvedValueOnce({} as never)
    vi.mocked(db.invoice.update).mockResolvedValueOnce({} as never)
    vi.mocked(db.customer.updateMany).mockResolvedValueOnce({ count: 1 } as never)

    const { POST } = await import("@/app/api/stripe/webhook/route")
    await POST(makeRequest("body"))

    expect(db.customer.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "cust-1" },
        data:  expect.objectContaining({ autoPayEnabled: true, autoPayMethodId: "pm_test456" }),
      }),
    )
  })
})
