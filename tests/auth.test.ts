import { describe, it, expect, vi, beforeEach } from "vitest"

// ── Mocks ────────────────────────────────────────────────────────────────────

vi.mock("@/lib/db", () => ({
  db: {
    user: {
      findUnique:  vi.fn(),
      findMany:    vi.fn(),
      create:      vi.fn(),
      update:      vi.fn(),
      updateMany:  vi.fn(),
    },
    company: {
      findUnique: vi.fn(),
      create:     vi.fn(),
    },
    session: {
      create:      vi.fn(),
      findUnique:  vi.fn(),
      delete:      vi.fn(),
      deleteMany:  vi.fn(),
    },
  },
}))

vi.mock("@/lib/auth", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/auth")>()
  return {
    ...actual,
    COOKIE_NAME:        "poolos_session",
    getSession:         vi.fn(),
    createSession:      vi.fn().mockResolvedValue({ token: "tok123", expiresAt: new Date(Date.now() + 1e9) }),
    deleteSession:      vi.fn(),
    setSessionCookie:   vi.fn(),
    clearSessionCookie: vi.fn(),
  }
})

vi.mock("@/lib/rate-limit", () => ({
  rateLimit: vi.fn().mockResolvedValue({ allowed: true, remaining: 4, resetAt: Date.now() + 60_000 }),
}))

vi.mock("@/lib/hibp", () => ({
  isPasswordBreached: vi.fn().mockResolvedValue(false),
}))

vi.mock("@/lib/email", () => ({
  resend: { emails: { send: vi.fn().mockResolvedValue({}) } },
  FROM: "billing@poolos.biz",
  buildPasswordResetHtml: vi.fn().mockReturnValue("<html/>"),
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
  redirect: vi.fn((url: string) => { throw Object.assign(new Error("NEXT_REDIRECT"), { digest: `NEXT_REDIRECT:${url}` }) }),
}))

vi.mock("next/headers", () => ({
  cookies: vi.fn().mockResolvedValue({
    get:    vi.fn().mockReturnValue(undefined),
    set:    vi.fn(),
    getAll: vi.fn().mockReturnValue([]),
  }),
}))

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }))
vi.mock("bcryptjs", () => ({
  default: { hash: vi.fn().mockResolvedValue("$2b$12$hashed"), compare: vi.fn().mockResolvedValue(true) },
}))
vi.mock("crypto", () => ({ default: { randomBytes: vi.fn(() => ({ toString: () => "tok123" })) } }))

// ── Helpers ──────────────────────────────────────────────────────────────────

async function getModule() {
  const { rateLimit }                  = await import("@/lib/rate-limit")
  const { getSession, createSession }  = await import("@/lib/auth")
  const { db }                         = await import("@/lib/db")
  const actions                        = await import("@/lib/actions/auth")
  return { rateLimit, getSession, createSession, db, actions }
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe("login()", () => {
  beforeEach(() => { vi.clearAllMocks() })

  it("returns error when rate limit exceeded", async () => {
    const { rateLimit, actions } = await getModule()
    vi.mocked(rateLimit).mockResolvedValueOnce({ allowed: false, remaining: 0, resetAt: Date.now() + 60_000 })

    const fd = new FormData()
    fd.set("email", "user@example.com")
    fd.set("password", "password123")

    const result = await actions.login(fd)
    expect(result).toEqual({ error: expect.stringContaining("Too many") })
  })

  it("returns error when credentials are invalid", async () => {
    const { db, actions } = await getModule()
    vi.mocked(db.user.findUnique).mockResolvedValueOnce(null)

    const fd = new FormData()
    fd.set("email", "user@example.com")
    fd.set("password", "wrongpass")

    const result = await actions.login(fd)
    expect(result).toEqual({ error: "Invalid email or password." })
  })

  it("creates session and redirects on valid credentials", async () => {
    const { db, createSession, actions } = await getModule()
    const bcrypt = await import("bcryptjs")

    vi.mocked(db.user.findUnique).mockResolvedValueOnce({
      id:         "user-1",
      email:      "user@example.com",
      password:   "$2b$12$hashed",
      firstName:  "Test",
      lastName:   "User",
      role:       "owner",
      isActive:   true,
      companyId:  "company-1",
      mustChangePassword: false,
      company:    { id: "company-1", name: "Test Co", isActive: true },
    } as never)
    vi.mocked(db.user.update).mockResolvedValueOnce({} as never)
    vi.mocked(bcrypt.default.compare).mockResolvedValueOnce(true as never)

    const fd = new FormData()
    fd.set("email", "user@example.com")
    fd.set("password", "correct-password")

    await expect(actions.login(fd)).rejects.toMatchObject({ digest: expect.stringContaining("NEXT_REDIRECT") })
    expect(createSession).toHaveBeenCalledWith(expect.objectContaining({ userId: "user-1", role: "owner" }))
  })
})

describe("resetPassword()", () => {
  beforeEach(() => { vi.clearAllMocks() })

  it("returns error when passwords do not match", async () => {
    const { actions } = await getModule()

    const fd = new FormData()
    fd.set("password", "newpass123")
    fd.set("confirm",  "different123")

    const result = await actions.resetPassword("tok123", fd)
    expect(result).toEqual({ error: expect.stringContaining("match") })
  })

  it("returns error when password is too short", async () => {
    const { actions } = await getModule()

    const fd = new FormData()
    fd.set("password", "short")
    fd.set("confirm",  "short")

    const result = await actions.resetPassword("tok123", fd)
    expect(result).toEqual({ error: expect.stringContaining("8 characters") })
  })

  it("returns error when token is expired or not found", async () => {
    const { db, actions } = await getModule()
    vi.mocked(db.user.findUnique).mockResolvedValueOnce(null)

    const fd = new FormData()
    fd.set("password", "validpass123")
    fd.set("confirm",  "validpass123")

    const result = await actions.resetPassword("bad-token", fd)
    expect(result).toEqual({ error: expect.stringContaining("expired") })
  })

  it("resets password and returns success when token is valid", async () => {
    const { db, actions } = await getModule()
    vi.mocked(db.user.findUnique).mockResolvedValueOnce({
      id: "user-1",
      passwordResetToken: "tok123",
      passwordResetExpiry: new Date(Date.now() + 60_000),
    } as never)
    vi.mocked(db.user.update).mockResolvedValueOnce({} as never)

    const fd = new FormData()
    fd.set("password", "validpass123")
    fd.set("confirm",  "validpass123")

    const result = await actions.resetPassword("tok123", fd)
    expect(result).toEqual({ success: true })
    expect(db.user.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ passwordResetToken: null }) }),
    )
  })
})

describe("requestPasswordReset()", () => {
  beforeEach(() => { vi.clearAllMocks() })

  it("returns success even when rate limited (enumeration protection)", async () => {
    const { rateLimit, actions } = await getModule()
    vi.mocked(rateLimit).mockResolvedValueOnce({ allowed: false, remaining: 0, resetAt: Date.now() + 3600_000 })

    const fd = new FormData()
    fd.set("email", "attacker@example.com")

    const result = await actions.requestPasswordReset(fd)
    expect(result).toEqual({ success: true })
  })

  it("returns success even when email does not exist (enumeration protection)", async () => {
    const { db, actions } = await getModule()
    vi.mocked(db.user.updateMany).mockResolvedValueOnce({ count: 0 })
    vi.mocked(db.user.findUnique).mockResolvedValueOnce(null)

    const fd = new FormData()
    fd.set("email", "nobody@example.com")

    const result = await actions.requestPasswordReset(fd)
    expect(result).toEqual({ success: true })
  })
})
