import { db } from "@/lib/db"
import { cookies } from "next/headers"
import { randomBytes } from "crypto"

export const COOKIE_NAME = "poolos_session"

const SESSION_MS = 30 * 24 * 60 * 60 * 1000 // 30 days

export interface SessionUser {
  sessionId: string
  id: string | null        // userId alias — keeps existing code working
  userId: string | null
  role: string
  email: string
  name: string
  companyId: string | null
  companyName: string | null
  mustChangePassword: boolean
}

function secure(): boolean {
  return (process.env.AUTH_URL ?? "").startsWith("https://")
}

export async function createSession(data: {
  userId: string | null
  role: string
  email: string
  name: string
  companyId: string | null
  companyName: string | null
  mustChangePassword?: boolean
}): Promise<{ token: string; expiresAt: Date }> {
  const token = randomBytes(32).toString("hex")
  const expiresAt = new Date(Date.now() + SESSION_MS)

  await db.session.create({
    data: {
      token,
      userId:             data.userId,
      role:               data.role,
      email:              data.email,
      name:               data.name,
      companyId:          data.companyId,
      companyName:        data.companyName,
      mustChangePassword: data.mustChangePassword ?? false,
      expiresAt,
    },
  })

  return { token, expiresAt }
}

export async function getSession(): Promise<SessionUser | null> {
  const jar = await cookies()
  const token = jar.get(COOKIE_NAME)?.value
  if (!token) return null

  const session = await db.session.findUnique({ where: { token } })
  if (!session) return null

  if (session.expiresAt < new Date()) {
    await db.session.delete({ where: { token } }).catch(() => {})
    return null
  }

  return {
    sessionId:          session.id,
    id:                 session.userId,
    userId:             session.userId,
    role:               session.role,
    email:              session.email,
    name:               session.name,
    companyId:          session.companyId,
    companyName:        session.companyName,
    mustChangePassword: session.mustChangePassword,
  }
}

export async function deleteSession(token: string): Promise<void> {
  await db.session.deleteMany({ where: { token } }).catch(() => {})
}

export async function setSessionCookie(token: string, expiresAt: Date): Promise<void> {
  const jar = await cookies()
  jar.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure:   secure(),
    sameSite: "lax",
    path:     "/",
    expires:  expiresAt,
  })
}

export async function clearSessionCookie(): Promise<void> {
  const jar = await cookies()
  jar.set(COOKIE_NAME, "", {
    httpOnly: true,
    secure:   secure(),
    sameSite: "lax",
    path:     "/",
    maxAge:   0,
  })
}
