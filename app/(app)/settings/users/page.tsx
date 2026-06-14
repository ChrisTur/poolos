import { db } from "@/lib/db"
import { requireOwner } from "@/lib/session"
import { inviteUser, deactivateUser, resetUserPassword } from "@/lib/actions/company"
import Card, { CardBody, CardHeader } from "@/components/ui/Card"
import Button from "@/components/ui/Button"
import { statusBadge } from "@/components/ui/Badge"
import { formatDate } from "@/lib/utils"
import { UserPlus } from "lucide-react"

export const dynamic = "force-dynamic"

export default async function UsersPage({ searchParams }: { searchParams: Promise<{ reset?: string; invited?: string; for?: string; inviteError?: string }> }) {
  const { companyId } = await requireOwner()
  const [users, sp] = await Promise.all([
    db.user.findMany({
      where: { companyId },
      orderBy: [{ role: "asc" }, { firstName: "asc" }],
    }),
    searchParams,
  ])

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Team Members</h1>
        <p className="text-sm text-gray-500 mt-1">{users.length} users on your account.</p>
      </div>

      {sp.reset && (
        <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800">
          <strong>Password reset for {sp.for}.</strong> Temporary password:{" "}
          <code className="font-mono font-bold">{sp.reset}</code>. Share it securely — it won&apos;t be shown again.
        </div>
      )}

      {sp.invited && (
        <div className="rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-800">
          <strong>User {sp.for} invited.</strong> Temporary password:{" "}
          <code className="font-mono font-bold">{sp.invited}</code>. Share it securely — it won&apos;t be shown again.
        </div>
      )}

      {sp.inviteError === "exists" && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-800">
          A user with that email already exists.
        </div>
      )}

      {/* User list */}
      <Card>
        <CardHeader><h2 className="font-semibold text-gray-900 text-sm">Users</h2></CardHeader>
        <div className="divide-y divide-gray-50">
          {users.map((user) => {
            const deactivateAction = deactivateUser.bind(null, user.id)
            const resetAction = resetUserPassword.bind(null, user.id)
            return (
              <div key={user.id} className="flex items-center justify-between px-5 py-3">
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {user.firstName} {user.lastName}
                  </p>
                  <p className="text-xs text-gray-400">{user.email}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-gray-500 capitalize">{user.role}</span>
                  {statusBadge(user.isActive ? "active" : "inactive")}
                  {user.role !== "owner" && (
                    <div className="flex gap-1">
                      <form action={resetAction}>
                        <Button type="submit" size="sm" variant="ghost"
                          title="Reset password">↺</Button>
                      </form>
                      {user.isActive && (
                        <form action={deactivateAction}>
                          <Button type="submit" size="sm" variant="ghost"
                            className="text-red-400 hover:text-red-600"
                            onClick={(e) => { if (!confirm("Deactivate this user?")) e.preventDefault() }}>
                            ✕
                          </Button>
                        </form>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </Card>

      {/* Invite form */}
      <Card>
        <CardHeader>
          <h2 className="font-semibold text-gray-900 text-sm flex items-center gap-2">
            <UserPlus className="w-4 h-4 text-sky-500" /> Invite Team Member
          </h2>
        </CardHeader>
        <CardBody>
          <form action={inviteUser} className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-3">
              <input name="firstName" required placeholder="First name"
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500" />
              <input name="lastName" required placeholder="Last name"
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500" />
            </div>
            <input name="email" type="email" required placeholder="Email address"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500" />
            <select name="role"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500">
              <option value="technician">Technician</option>
              <option value="owner">Owner</option>
            </select>
            <p className="text-xs text-gray-400">
              A temporary password will be generated. Share it with the new team member — they can change it after logging in.
            </p>
            <Button type="submit">
              <UserPlus className="w-4 h-4" /> Send Invite
            </Button>
          </form>
        </CardBody>
      </Card>
    </div>
  )
}
