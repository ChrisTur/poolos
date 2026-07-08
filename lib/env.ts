/**
 * Startup environment variable validation.
 * Called once from instrumentation.ts register() so the server fails fast
 * with a clear message rather than crashing deep inside a request.
 */

const REQUIRED: string[] = [
  "DATABASE_URL",
  "NEXT_PUBLIC_APP_URL",
  "SUPER_ADMIN_EMAIL",
  "RESEND_API_KEY",
  "STRIPE_SECRET_KEY",
  "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY",
  "STRIPE_WEBHOOK_SECRET",
  "STRIPE_BILLING_WEBHOOK_SECRET",
  "STRIPE_CLIENT_ID",
  "GCS_BUCKET",
  "GCS_SERVICE_ACCOUNT_KEY",
  "GCS_PUBLIC_URL",
]

export function validateEnv(): void {
  const missing = REQUIRED.filter((k) => !process.env[k])
  if (missing.length > 0) {
    throw new Error(
      `[PoolOS] Missing required environment variables:\n  ${missing.join("\n  ")}\n\nCheck your .env.local against .env.example.`
    )
  }
}
