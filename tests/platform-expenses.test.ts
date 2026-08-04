import { describe, it, expect, vi, beforeEach } from "vitest"

// ── Mocks ────────────────────────────────────────────────────────────────────

vi.mock("@/lib/db", () => ({
  db: {
    platformExpense: {
      create: vi.fn(),
      delete: vi.fn(),
    },
  },
}))

vi.mock("@/lib/session", () => ({
  requireSuperAdmin: vi.fn().mockResolvedValue(undefined),
}))

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }))

// ── Helpers ──────────────────────────────────────────────────────────────────

function validFormData(overrides: Record<string, string> = {}): FormData {
  const fd = new FormData()
  fd.set("date",        "2026-08-01")
  fd.set("category",    "cloud")
  fd.set("description", "Vercel Pro plan")
  fd.set("amount",      "20")
  fd.set("vendor",      "Vercel")
  for (const [k, v] of Object.entries(overrides)) fd.set(k, v)
  return fd
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe("createPlatformExpense()", () => {
  beforeEach(() => { vi.clearAllMocks() })

  it("returns an error when description is missing", async () => {
    const { createPlatformExpense } = await import("@/lib/actions/platform-expenses")
    const fd = validFormData({ description: "  " })
    const result = await createPlatformExpense(null, fd)
    expect(result).toMatchObject({ error: expect.any(String) })
  })

  it("returns an error when category is missing", async () => {
    const { createPlatformExpense } = await import("@/lib/actions/platform-expenses")
    const fd = validFormData({ category: "" })
    const result = await createPlatformExpense(null, fd)
    expect(result).toMatchObject({ error: expect.any(String) })
  })

  it("returns an error when amount is zero", async () => {
    const { createPlatformExpense } = await import("@/lib/actions/platform-expenses")
    const fd = validFormData({ amount: "0" })
    const result = await createPlatformExpense(null, fd)
    expect(result).toMatchObject({ error: expect.stringMatching(/positive/i) })
  })

  it("returns an error when amount is negative", async () => {
    const { createPlatformExpense } = await import("@/lib/actions/platform-expenses")
    const fd = validFormData({ amount: "-10" })
    const result = await createPlatformExpense(null, fd)
    expect(result).toMatchObject({ error: expect.stringMatching(/positive/i) })
  })

  it("returns an error when amount is not a number", async () => {
    const { createPlatformExpense } = await import("@/lib/actions/platform-expenses")
    const fd = validFormData({ amount: "abc" })
    const result = await createPlatformExpense(null, fd)
    expect(result).toMatchObject({ error: expect.any(String) })
  })

  it("creates a non-recurring expense and returns null on success", async () => {
    const { db } = await import("@/lib/db")
    vi.mocked(db.platformExpense.create).mockResolvedValueOnce({ id: "exp-1" } as never)

    const { createPlatformExpense } = await import("@/lib/actions/platform-expenses")
    const result = await createPlatformExpense(null, validFormData())

    expect(result).toBeNull()
    expect(db.platformExpense.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          description: "Vercel Pro plan",
          amount:      20,
          category:    "cloud",
          vendor:      "Vercel",
          isRecurring: false,
          frequency:   null,
        }),
      }),
    )
  })

  it("saves isRecurring=true and frequency=monthly when checkbox is checked", async () => {
    const { db } = await import("@/lib/db")
    vi.mocked(db.platformExpense.create).mockResolvedValueOnce({ id: "exp-2" } as never)

    const { createPlatformExpense } = await import("@/lib/actions/platform-expenses")
    const fd = validFormData()
    fd.set("isRecurring", "true")
    fd.set("frequency",   "monthly")

    await createPlatformExpense(null, fd)

    expect(db.platformExpense.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ isRecurring: true, frequency: "monthly" }),
      }),
    )
  })

  it("saves isRecurring=true and frequency=annual for annual expenses", async () => {
    const { db } = await import("@/lib/db")
    vi.mocked(db.platformExpense.create).mockResolvedValueOnce({ id: "exp-3" } as never)

    const { createPlatformExpense } = await import("@/lib/actions/platform-expenses")
    const fd = validFormData({ amount: "240" })
    fd.set("isRecurring", "true")
    fd.set("frequency",   "annual")

    await createPlatformExpense(null, fd)

    expect(db.platformExpense.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ isRecurring: true, frequency: "annual" }),
      }),
    )
  })

  it("saves null vendor and notes when omitted", async () => {
    const { db } = await import("@/lib/db")
    vi.mocked(db.platformExpense.create).mockResolvedValueOnce({ id: "exp-4" } as never)

    const { createPlatformExpense } = await import("@/lib/actions/platform-expenses")
    const fd = new FormData()
    fd.set("date",        "2026-08-01")
    fd.set("category",    "other")
    fd.set("description", "Misc expense")
    fd.set("amount",      "50")

    await createPlatformExpense(null, fd)

    expect(db.platformExpense.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ vendor: null, notes: null }),
      }),
    )
  })

  it("revalidates /admin/expenses and /admin/reports on success", async () => {
    const { db } = await import("@/lib/db")
    const { revalidatePath } = await import("next/cache")
    vi.mocked(db.platformExpense.create).mockResolvedValueOnce({ id: "exp-5" } as never)

    const { createPlatformExpense } = await import("@/lib/actions/platform-expenses")
    await createPlatformExpense(null, validFormData())

    expect(revalidatePath).toHaveBeenCalledWith("/admin/expenses")
    expect(revalidatePath).toHaveBeenCalledWith("/admin/reports")
  })
})

describe("deletePlatformExpense()", () => {
  beforeEach(() => { vi.clearAllMocks() })

  it("deletes the expense by id", async () => {
    const { db } = await import("@/lib/db")
    vi.mocked(db.platformExpense.delete).mockResolvedValueOnce({} as never)

    const { deletePlatformExpense } = await import("@/lib/actions/platform-expenses")
    await deletePlatformExpense("exp-99")

    expect(db.platformExpense.delete).toHaveBeenCalledWith({ where: { id: "exp-99" } })
  })

  it("revalidates /admin/expenses and /admin/reports after delete", async () => {
    const { db } = await import("@/lib/db")
    const { revalidatePath } = await import("next/cache")
    vi.mocked(db.platformExpense.delete).mockResolvedValueOnce({} as never)

    const { deletePlatformExpense } = await import("@/lib/actions/platform-expenses")
    await deletePlatformExpense("exp-99")

    expect(revalidatePath).toHaveBeenCalledWith("/admin/expenses")
    expect(revalidatePath).toHaveBeenCalledWith("/admin/reports")
  })
})
