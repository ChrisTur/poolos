import { getSession } from "@/lib/auth"
import { db } from "@/lib/db"
import { redirect } from "next/navigation"
import Card, { CardBody, CardHeader } from "@/components/ui/Card"
import Link from "next/link"
import { disconnectGoogle } from "@/lib/actions/auth-google"
import { KeyRound, Mail, User } from "lucide-react"

export const dynamic = "force-dynamic"

export default async function AccountSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ connected?: string; error?: string }>
}) {
  const session = await getSession()
  if (!session?.userId) redirect("/login")

  const [user, sp] = await Promise.all([
    db.user.findUnique({
      where: { id: session.userId },
      select: { firstName: true, lastName: true, email: true, googleId: true, password: true },
    }),
    searchParams,
  ])

  if (!user) redirect("/login")

  const hasPassword = !!user.password
  const hasGoogle   = !!user.googleId

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Account</h1>
        <p className="text-sm text-gray-500 mt-1">Your personal sign-in settings.</p>
      </div>

      {sp.connected === "1" && (
        <div className="rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700">
          Google account connected successfully.
        </div>
      )}
      {sp.error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {sp.error}
        </div>
      )}

      {/* Profile */}
      <Card>
        <CardHeader><h2 className="font-semibold text-gray-900 text-sm">Profile</h2></CardHeader>
        <CardBody>
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-sm">
              <User className="w-4 h-4 text-gray-400 shrink-0" />
              <span className="text-gray-700">{user.firstName} {user.lastName}</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Mail className="w-4 h-4 text-gray-400 shrink-0" />
              <span className="text-gray-700">{user.email}</span>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Password */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-gray-900 text-sm">Password</h2>
            {hasPassword && (
              <Link href="/change-password" className="text-xs text-sky-600 hover:underline">
                Change password →
              </Link>
            )}
          </div>
        </CardHeader>
        <CardBody>
          <div className="flex items-center gap-3 text-sm">
            <KeyRound className="w-4 h-4 text-gray-400 shrink-0" />
            {hasPassword ? (
              <span className="text-gray-700">Password set</span>
            ) : (
              <span className="text-gray-500">
                No password set.{" "}
                <Link href="/change-password" className="text-sky-600 hover:underline">
                  Add a password
                </Link>
                {" "}to sign in without Google.
              </span>
            )}
          </div>
        </CardBody>
      </Card>

      {/* Connected accounts */}
      <Card>
        <CardHeader><h2 className="font-semibold text-gray-900 text-sm">Connected Accounts</h2></CardHeader>
        <CardBody>
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              <div>
                <p className="text-sm font-medium text-gray-900">Google</p>
                {hasGoogle ? (
                  <p className="text-xs text-gray-500">Connected · sign in with Google is enabled</p>
                ) : (
                  <p className="text-xs text-gray-500">Not connected</p>
                )}
              </div>
            </div>

            {hasGoogle ? (
              <form action={async () => {
                "use server"
                await disconnectGoogle()
              }}>
                <button
                  type="submit"
                  disabled={!hasPassword}
                  title={!hasPassword ? "Add a password before disconnecting Google" : undefined}
                  className="text-sm text-red-600 hover:text-red-700 font-medium disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Disconnect
                </button>
              </form>
            ) : (
              <a
                href="/api/auth/google?connect=1"
                className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Connect
              </a>
            )}
          </div>

          {hasGoogle && !hasPassword && (
            <p className="mt-3 text-xs text-amber-600 bg-amber-50 rounded-lg px-3 py-2">
              You are signed in via Google only.{" "}
              <Link href="/change-password" className="font-medium underline">Add a password</Link>
              {" "}if you want the option to disconnect Google later.
            </p>
          )}
        </CardBody>
      </Card>
    </div>
  )
}
