import type { NextAuthConfig } from "next-auth"

// Lightweight config with no DB imports — safe for Edge runtime (proxy/middleware)
export const authConfig: NextAuthConfig = {
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.companyId = (user as any).companyId
        token.companyName = (user as any).companyName
        token.role = (user as any).role
      }
      return token
    },
    session({ session, token }) {
      session.user.companyId = token.companyId as string
      session.user.companyName = token.companyName as string
      session.user.role = token.role as string
      return session
    },
  },
}
