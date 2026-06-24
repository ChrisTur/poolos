import { db } from "@/lib/db"
import Card from "@/components/ui/Card"
import { formatDate } from "@/lib/utils"
import Link from "next/link"
import { Search, ChevronRight } from "lucide-react"

export const dynamic = "force-dynamic"

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; role?: string }>
}) {
  const { q, role } = await searchParams

  const users = await db.user.findMany({
    where: {
      role: role && role !== "all" ? role : undefined,
      OR: q
        ? [
            { firstName: { contains: q, mode: "insensitive" } },
            { lastName: { contains: q, mode: "insensitive" } },
            { email: { contains: q, mode: "insensitive" } },
          ]
        : undefined,
    },
    orderBy: [{ company: { name: "asc" } }, { lastName: "asc" }],
    include: { company: true },
  })

  const roleTabs = [
    { key: "all", label: "All" },
    { key: "owner", label: "Owners" },
    { key: "technician", label: "Technicians" },
    { key: "office", label: "Office" },
  ]

  return (
    <div className="space-y-4 sm:space-y-5">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Users</h1>
        <p className="text-sm text-gray-500 mt-0.5">{users.length} users across all companies</p>
      </div>

      {/* Filters */}
      <form method="GET" className="flex flex-col sm:flex-row gap-2 sm:gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            name="q"
            defaultValue={q}
            placeholder="Search by name or email…"
            className="w-full pl-9 pr-3 py-2.5 text-sm text-gray-900 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
        </div>
        <div className="flex gap-2">
          <select
            name="role"
            defaultValue={role || "all"}
            className="flex-1 sm:flex-none text-sm text-gray-900 border border-gray-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-sky-500"
          >
            {roleTabs.map((r) => (
              <option key={r.key} value={r.key}>{r.label}</option>
            ))}
          </select>
          <button
            type="submit"
            className="px-4 py-2 text-sm font-medium text-white bg-sky-600 rounded-lg hover:bg-sky-700 transition-colors"
          >
            Search
          </button>
        </div>
      </form>

      {/* Mobile card list */}
      <div className="sm:hidden space-y-2">
        {users.length === 0 ? (
          <Card>
            <div className="py-12 text-center">
              <p className="text-gray-400 text-sm">No users found.</p>
            </div>
          </Card>
        ) : (
          users.map((u) => (
            <Link key={u.id} href={`/admin/companies/${u.companyId}`}>
              <Card className="p-4 flex items-center justify-between hover:bg-gray-50 active:bg-gray-100 transition-colors">
                <div className="min-w-0">
                  <p className="font-medium text-gray-900 text-sm truncate">{u.firstName} {u.lastName}</p>
                  <p className="text-xs text-gray-400 mt-0.5 truncate">{u.email}</p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700 capitalize">
                      {u.role}
                    </span>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                      u.isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-700"
                    }`}>{u.isActive ? "Active" : "Inactive"}</span>
                  </div>
                  <p className="text-xs text-sky-600 mt-1 truncate">{u.company.name}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Last login: {u.lastLoginAt ? formatDate(u.lastLoginAt) : "Never"}
                  </p>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-300 shrink-0 ml-3" />
              </Card>
            </Link>
          ))
        )}
      </div>

      {/* Desktop table */}
      <Card className="hidden sm:block">
        {users.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-gray-400 text-sm">No users found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-xs text-gray-500 uppercase tracking-wide">
                  <th className="px-5 py-3 text-left font-medium">Name</th>
                  <th className="px-5 py-3 text-left font-medium">Email</th>
                  <th className="px-5 py-3 text-left font-medium">Company</th>
                  <th className="px-5 py-3 text-left font-medium">Role</th>
                  <th className="px-5 py-3 text-left font-medium">Status</th>
                  <th className="px-5 py-3 text-left font-medium hidden lg:table-cell">Joined</th>
                  <th className="px-5 py-3 text-left font-medium hidden xl:table-cell">Last login</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3 font-medium text-gray-900">
                      {u.firstName} {u.lastName}
                    </td>
                    <td className="px-5 py-3 text-gray-600">{u.email}</td>
                    <td className="px-5 py-3">
                      <Link href={`/admin/companies/${u.companyId}`} className="text-sky-600 hover:underline">
                        {u.company.name}
                      </Link>
                    </td>
                    <td className="px-5 py-3">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700 capitalize">
                        {u.role}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        u.isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-700"
                      }`}>
                        {u.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-gray-500 hidden lg:table-cell">{formatDate(u.createdAt)}</td>
                    <td className="px-5 py-3 text-gray-500 hidden xl:table-cell">
                      {u.lastLoginAt ? formatDate(u.lastLoginAt) : <span className="text-gray-300">Never</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}
