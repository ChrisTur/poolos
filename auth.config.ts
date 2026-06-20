import type { NextAuthConfig } from "next-auth"

// Lightweight config with no DB imports — safe for Edge runtime (proxy/middleware)
export const authConfig: NextAuthConfig = {
  trustHost: true,
  session: { strategy: "jwt", maxAge: 8 * 60 * 60 }, // 8-hour sessions
  pages: { signIn: "/login" },
  providers: [],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        // Explicitly persist id and email — NextAuth v5 JWT strategy does not
        // guarantee these survive a custom session callback without explicit mapping.
        token.uid   = (user as any).id ?? token.sub
        token.email = (user as any).email ?? token.email
        token.companyId = (user as any).companyId
        token.companyName = (user as any).companyName
        token.role = (user as any).role
        token.mustChangePassword = (user as any).mustChangePassword ?? false
      }
      return token
    },
    session({ session, token }) {
      // Explicitly map token fields → session.user so consumers can rely on them
      session.user.id    = (token.uid ?? token.sub) as string
      session.user.email = token.email as string
      session.user.companyId   = token.companyId as string
      session.user.companyName = token.companyName as string
      session.user.role        = token.role as string
      ;(session.user as any).mustChangePassword = token.mustChangePassword ?? false
      return session
    },
  },
}
