import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"
import { db } from "@/lib/db"
import { authConfig } from "@/auth.config"
import { isPasswordBreached } from "@/lib/hibp"

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  trustHost: true,
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        const email = (credentials.email as string).toLowerCase().trim()
        const password = credentials.password as string

        // Super admin: authenticate via env vars, no DB lookup
        if (email === process.env.SUPER_ADMIN_EMAIL?.toLowerCase()) {
          const valid = await bcrypt.compare(password, process.env.SUPER_ADMIN_PASSWORD_HASH ?? "")
          if (!valid) return null
          return { id: "super-admin", email: process.env.SUPER_ADMIN_EMAIL, name: "Super Admin", role: "super_admin" }
        }

        // Company users
        const user = await db.user.findUnique({
          where: { email },
          include: { company: true },
        })

        if (!user || !user.isActive || !user.company.isActive) return null

        const valid = await bcrypt.compare(password, user.password)
        if (!valid) return null

        // Flag breached passwords for forced change on next page load
        const breached = await isPasswordBreached(password)
        if (breached && !user.mustChangePassword) {
          await db.user.update({ where: { id: user.id }, data: { mustChangePassword: true } })
        }

        return {
          id: user.id,
          email: user.email,
          name: `${user.firstName} ${user.lastName}`,
          companyId: user.companyId,
          companyName: user.company.name,
          role: user.role,
          mustChangePassword: user.mustChangePassword || breached,
        }
      },
    }),
  ],
})
