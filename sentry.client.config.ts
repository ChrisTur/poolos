import * as Sentry from "@sentry/nextjs"

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Capture 10% of sessions for performance profiling — raise after launch.
  tracesSampleRate: 0.1,

  // Replay 1% of sessions, 100% of sessions that include an error.
  replaysSessionSampleRate: 0.01,
  replaysOnErrorSampleRate: 1.0,

  integrations: [Sentry.replayIntegration()],

  // Only send errors in production — keeps dev noise out of your Sentry inbox.
  enabled: process.env.NODE_ENV === "production",
})
