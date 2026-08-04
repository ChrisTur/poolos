import { describe, it, expect, vi, beforeEach } from "vitest"

// ── Mocks ────────────────────────────────────────────────────────────────────

vi.mock("@/lib/db", () => ({
  db: {
    customer: {
      findUnique: vi.fn(),
    },
    estimate: {
      findFirst: vi.fn(),
      update:    vi.fn(),
    },
    invoice: {
      findMany: vi.fn(),
      create:   vi.fn(),
    },
    customerMessage: {
      create: vi.fn(),
    },
  },
}))

vi.mock("@/lib/email", () => ({
  resend: { emails: { send: vi.fn().mockResolvedValue({}) } },
  FROM:   "billing@poolos.biz",
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

// ── Fixtures ──────────────────────────────────────────────────────────────────

const CUSTOMER = {
  id:        "cust-1",
  firstName: "Jane",
  lastName:  "Smith",
  companyId: "co-1",
  company: {
    name:           "Best Pools LLC",
    replyToEmail:   "owner@bestpools.com",
    defaultDueDays: 30,
  },
}

const ESTIMATE = {
  id:             "est-1",
  estimateNumber: "EST-0001",
  customerId:     "cust-1",
  status:         "sent",
  validUntil:     null,
  notes:          null,
  serviceType:    null,
  items: [
    { description: "Pool opening", quantity: 1, unitPrice: 299 },
  ],
}

function approvalFormData(overrides: Record<string, string> = {}): FormData {
  const fd = new FormData()
  fd.set("token",         "portal-token-abc")
  fd.set("estimateId",    "est-1")
  fd.set("signatureData", "data:image/png;base64,abc")
  fd.set("signedByName",  "Jane Smith")
  for (const [k, v] of Object.entries(overrides)) fd.set(k, v)
  return fd
}

// ── approveEstimate() ────────────────────────────────────────────────────────

describe("approveEstimate()", () => {
  beforeEach(() => { vi.clearAllMocks() })

  it("redirects to portal root when customer token is invalid", async () => {
    const { db } = await import("@/lib/db")
    vi.mocked(db.customer.findUnique).mockResolvedValueOnce(null)

    const { approveEstimate } = await import("@/lib/actions/portal-estimates")
    await expect(approveEstimate(approvalFormData()))
      .rejects.toMatchObject({ digest: expect.stringContaining("/portal/portal-token-abc") })
  })

  it("redirects when estimate is not found or already accepted", async () => {
    const { db } = await import("@/lib/db")
    vi.mocked(db.customer.findUnique).mockResolvedValueOnce(CUSTOMER as never)
    vi.mocked(db.estimate.findFirst).mockResolvedValueOnce(null)

    const { approveEstimate } = await import("@/lib/actions/portal-estimates")
    await expect(approveEstimate(approvalFormData()))
      .rejects.toMatchObject({ digest: expect.stringContaining("error=unavailable") })
  })

  it("redirects when estimate is past its validUntil date", async () => {
    const { db } = await import("@/lib/db")
    vi.mocked(db.customer.findUnique).mockResolvedValueOnce(CUSTOMER as never)
    vi.mocked(db.estimate.findFirst).mockResolvedValueOnce({
      ...ESTIMATE,
      validUntil: new Date("2020-01-01"), // in the past
    } as never)

    const { approveEstimate } = await import("@/lib/actions/portal-estimates")
    await expect(approveEstimate(approvalFormData()))
      .rejects.toMatchObject({ digest: expect.stringContaining("error=expired") })
  })

  it("redirects with error when signature fields are missing", async () => {
    const { approveEstimate } = await import("@/lib/actions/portal-estimates")
    const fd = approvalFormData({ signatureData: "   ", signedByName: "" })

    await expect(approveEstimate(fd))
      .rejects.toMatchObject({ digest: expect.stringContaining("error=missing_fields") })
  })

  it("creates invoice INV-0001 for a company with no prior invoices", async () => {
    const { db } = await import("@/lib/db")
    vi.mocked(db.customer.findUnique)
      .mockResolvedValueOnce(CUSTOMER as never)  // loadCustomerByToken
      .mockResolvedValueOnce({ dueDays: null } as never)  // dueDays lookup
    vi.mocked(db.estimate.findFirst).mockResolvedValueOnce(ESTIMATE as never)
    vi.mocked(db.invoice.findMany).mockResolvedValueOnce([])
    vi.mocked(db.invoice.create).mockResolvedValueOnce({ id: "inv-new" } as never)
    vi.mocked(db.estimate.update).mockResolvedValueOnce({} as never)

    const { approveEstimate } = await import("@/lib/actions/portal-estimates")
    await expect(approveEstimate(approvalFormData()))
      .rejects.toMatchObject({ digest: expect.stringContaining("approved=1") })

    expect(db.invoice.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ invoiceNumber: "INV-0001" }),
      }),
    )
  })

  it("increments from the numeric max of existing invoices (not string sort)", async () => {
    const { db } = await import("@/lib/db")
    vi.mocked(db.customer.findUnique)
      .mockResolvedValueOnce(CUSTOMER as never)
      .mockResolvedValueOnce({ dueDays: null } as never)
    vi.mocked(db.estimate.findFirst).mockResolvedValueOnce(ESTIMATE as never)
    // String sort would pick INV-9 as max; numeric sort correctly picks INV-0010
    vi.mocked(db.invoice.findMany).mockResolvedValueOnce([
      { invoiceNumber: "INV-0010" },
      { invoiceNumber: "INV-9" },
      { invoiceNumber: "INV-0003" },
    ] as never)
    vi.mocked(db.invoice.create).mockResolvedValueOnce({ id: "inv-11" } as never)
    vi.mocked(db.estimate.update).mockResolvedValueOnce({} as never)

    const { approveEstimate } = await import("@/lib/actions/portal-estimates")
    await expect(approveEstimate(approvalFormData()))
      .rejects.toMatchObject({ digest: expect.stringContaining("approved=1") })

    expect(db.invoice.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ invoiceNumber: "INV-0011" }),
      }),
    )
  })

  it("retries with the next invoice number on P2002 unique constraint violation", async () => {
    const { db } = await import("@/lib/db")
    vi.mocked(db.customer.findUnique)
      .mockResolvedValueOnce(CUSTOMER as never)
      .mockResolvedValueOnce({ dueDays: null } as never)
    vi.mocked(db.estimate.findFirst).mockResolvedValueOnce(ESTIMATE as never)
    vi.mocked(db.invoice.findMany).mockResolvedValueOnce([{ invoiceNumber: "INV-0005" }] as never)

    const p2002 = Object.assign(new Error("Unique constraint"), { code: "P2002" })
    vi.mocked(db.invoice.create)
      .mockRejectedValueOnce(p2002)          // attempt 0: INV-0006 taken
      .mockResolvedValueOnce({ id: "inv-7" } as never) // attempt 1: INV-0007 succeeds

    vi.mocked(db.estimate.update).mockResolvedValueOnce({} as never)

    const { approveEstimate } = await import("@/lib/actions/portal-estimates")
    await expect(approveEstimate(approvalFormData()))
      .rejects.toMatchObject({ digest: expect.stringContaining("approved=1") })

    const calls = vi.mocked(db.invoice.create).mock.calls
    expect(calls).toHaveLength(2)
    expect(calls[0]![0].data.invoiceNumber).toBe("INV-0006")
    expect(calls[1]![0].data.invoiceNumber).toBe("INV-0007")
  })

  it("throws after 5 consecutive P2002 failures (does not loop infinitely)", async () => {
    const { db } = await import("@/lib/db")
    vi.mocked(db.customer.findUnique)
      .mockResolvedValueOnce(CUSTOMER as never)
      .mockResolvedValueOnce({ dueDays: null } as never)
    vi.mocked(db.estimate.findFirst).mockResolvedValueOnce(ESTIMATE as never)
    vi.mocked(db.invoice.findMany).mockResolvedValueOnce([])

    const p2002 = Object.assign(new Error("Unique constraint"), { code: "P2002" })
    vi.mocked(db.invoice.create).mockRejectedValue(p2002)

    const { approveEstimate } = await import("@/lib/actions/portal-estimates")
    await expect(approveEstimate(approvalFormData())).rejects.toThrow()

    expect(vi.mocked(db.invoice.create).mock.calls).toHaveLength(5)
  })

  it("marks the estimate as accepted with signature data after invoice creation", async () => {
    const { db } = await import("@/lib/db")
    vi.mocked(db.customer.findUnique)
      .mockResolvedValueOnce(CUSTOMER as never)
      .mockResolvedValueOnce({ dueDays: null } as never)
    vi.mocked(db.estimate.findFirst).mockResolvedValueOnce(ESTIMATE as never)
    vi.mocked(db.invoice.findMany).mockResolvedValueOnce([])
    vi.mocked(db.invoice.create).mockResolvedValueOnce({ id: "inv-new" } as never)
    vi.mocked(db.estimate.update).mockResolvedValueOnce({} as never)

    const { approveEstimate } = await import("@/lib/actions/portal-estimates")
    await expect(approveEstimate(approvalFormData())).rejects.toMatchObject({
      digest: expect.stringContaining("approved=1"),
    })

    expect(db.estimate.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "est-1" },
        data:  expect.objectContaining({
          status:             "accepted",
          signedByName:       "Jane Smith",
          signatureData:      "data:image/png;base64,abc",
          convertedInvoiceId: "inv-new",
        }),
      }),
    )
  })
})

// ── denyEstimate() ────────────────────────────────────────────────────────────

describe("denyEstimate()", () => {
  beforeEach(() => { vi.clearAllMocks() })

  function denyFormData(reason = "Too expensive"): FormData {
    const fd = new FormData()
    fd.set("token",      "portal-token-abc")
    fd.set("estimateId", "est-1")
    fd.set("reason",     reason)
    return fd
  }

  it("redirects to portal root when customer token is invalid", async () => {
    const { db } = await import("@/lib/db")
    vi.mocked(db.customer.findUnique).mockResolvedValueOnce(null)

    const { denyEstimate } = await import("@/lib/actions/portal-estimates")
    await expect(denyEstimate(denyFormData()))
      .rejects.toMatchObject({ digest: expect.stringContaining("/portal/portal-token-abc") })
  })

  it("marks estimate as declined and creates a customer message", async () => {
    const { db } = await import("@/lib/db")
    vi.mocked(db.customer.findUnique).mockResolvedValueOnce(CUSTOMER as never)
    vi.mocked(db.estimate.findFirst).mockResolvedValueOnce(ESTIMATE as never)
    vi.mocked(db.estimate.update).mockResolvedValueOnce({} as never)
    vi.mocked(db.customerMessage.create).mockResolvedValueOnce({} as never)

    const { denyEstimate } = await import("@/lib/actions/portal-estimates")
    await expect(denyEstimate(denyFormData("Too expensive")))
      .rejects.toMatchObject({ digest: expect.stringContaining("declined=1") })

    expect(db.estimate.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: "declined", denialReason: "Too expensive" }),
      }),
    )
    expect(db.customerMessage.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ fromCompany: false, customerId: "cust-1" }),
      }),
    )
  })

  it("saves null denialReason when no reason is provided", async () => {
    const { db } = await import("@/lib/db")
    vi.mocked(db.customer.findUnique).mockResolvedValueOnce(CUSTOMER as never)
    vi.mocked(db.estimate.findFirst).mockResolvedValueOnce(ESTIMATE as never)
    vi.mocked(db.estimate.update).mockResolvedValueOnce({} as never)
    vi.mocked(db.customerMessage.create).mockResolvedValueOnce({} as never)

    const { denyEstimate } = await import("@/lib/actions/portal-estimates")
    await expect(denyEstimate(denyFormData("")))
      .rejects.toMatchObject({ digest: expect.stringContaining("declined=1") })

    expect(db.estimate.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ denialReason: null }),
      }),
    )
  })
})
