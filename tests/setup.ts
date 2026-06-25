// Shared env vars required by modules that read process.env at import time
process.env.STRIPE_SECRET_KEY        = "sk_test_placeholder"
process.env.STRIPE_WEBHOOK_SECRET    = "whsec_placeholder"
process.env.NEXT_PUBLIC_APP_URL      = "http://localhost:3000"
process.env.AUTH_SECRET              = "test-secret-32-chars-minimum-here"
process.env.DATABASE_URL             = "postgresql://test"
