import type { NextConfig } from "next"
import { withSentryConfig } from "@sentry/nextjs"

const nextConfig: NextConfig = {
  /* config options here */
}

export default withSentryConfig(nextConfig, {
  org:     process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,

  // Suppress Sentry CLI output during builds.
  silent: !process.env.CI,

  // Upload source maps so stack traces point to real code, not minified bundles.
  // Requires SENTRY_AUTH_TOKEN in the build environment.
  widenClientFileUpload: true,
  sourcemaps: { disable: !process.env.SENTRY_AUTH_TOKEN },

  // Tree-shake Sentry debug logging out of production bundles.
  disableLogger: true,

  // Avoid Sentry wrapping Vercel/Netlify route handlers unnecessarily.
  automaticVercelMonitors: false,
})
