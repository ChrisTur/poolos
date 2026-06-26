import type { NextAuthConfig } from "next-auth"

// Lightweight config with no DB imports — safe for Edge runtime (proxy/middleware)
export const authConfig: NextAuthConfig = {
  trustHost: true,
  // Do NOT set useSecureCookies explicitly. NextAuth derives it from AUTH_URL's protocol:
  //   config.useSecureCookies ?? url.protocol === "https:"
  // AUTH_URL is set to https://poolos.biz in production (Netlify env var) → secure cookies.
  // AUTH_URL is set to http://localhost:3000 in .env.local → plain cookies over HTTP.
  // This matches how logout() determines the cookie prefix (via x-forwarded-proto),
  // keeping all cookie operations consistent without depending on NODE_ENV.
  secret: process.env.AUTH_SECRET,
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 }, // 30-day sessions
  pages: { signIn: "/login" },
  providers: [],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        // Explicitly persist id and email — NextAuth v5 JWT strategy does not
        // guarantee these survive a custom session callback without explicit mapping.
        const u = user as unknown as Record<string, unknown>
        token.uid   = u.id ?? token.sub
        token.email = (u.email as string | undefined) ?? token.email
        token.companyId = u.companyId
        token.companyName = u.companyName
        token.role = u.role
        token.mustChangePassword = u.mustChangePassword ?? false
      }
      return token
    },
    session({ session, token }) {
      // Explicitly map token fields → session.user so consumers can rely on them
      session.user.id    = (token.uid ?? token.sub) as string
      session.user.name  = token.name as string
      session.user.email = token.email as string
      session.user.companyId   = token.companyId as string
      session.user.companyName = token.companyName as string
      session.user.role        = token.role as string
      ;(session.user as unknown as Record<string, unknown>).mustChangePassword = token.mustChangePassword ?? false
      return session
    },
  },
}
