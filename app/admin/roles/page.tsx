import { requireSuperAdmin } from "@/lib/session"
import { db } from "@/lib/db"
import Link from "next/link"
import { Shield, Plus, Lock } from "lucide-react"
import { createRole } from "@/lib/actions/roles"
import { PERMISSION_GROUPS } from "@/lib/permissions"

export default async function AdminRolesPage() {
  await requireSuperAdmin()

  const roles = await db.role.findMany({ orderBy: { createdAt: "asc" } })

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Roles &amp; Permissions</h1>
          <p className="text-sm text-gray-500 mt-1">Manage what each role can access across all companies.</p>
        </div>
      </div>

      {/* Existing roles */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">All Roles</h2>
        </div>
        <ul className="divide-y divide-gray-100">
          {roles.map((role) => (
            <li key={role.id}>
              <Link
                href={`/admin/roles/${role.id}`}
                className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50 transition-colors"
              >
                <div className="w-9 h-9 rounded-full bg-sky-100 flex items-center justify-center shrink-0">
                  {role.isBuiltIn
                    ? <Lock className="w-4 h-4 text-sky-600" />
                    : <Shield className="w-4 h-4 text-sky-600" />
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900">
                    {role.label}
                    {role.isBuiltIn && (
                      <span className="ml-2 text-xs font-normal text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">built-in</span>
                    )}
                  </p>
                  {role.description && (
                    <p className="text-xs text-gray-500 truncate">{role.description}</p>
                  )}
                </div>
                <p className="text-xs text-gray-400 shrink-0">{role.permissions.length} permissions</p>
              </Link>
            </li>
          ))}
        </ul>
      </div>

      {/* Create new role */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide flex items-center gap-2">
            <Plus className="w-4 h-4" />
            New Role
          </h2>
        </div>
        <form action={createRole} className="p-6 space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Internal name</label>
              <input
                name="name"
                required
                placeholder="e.g. office_manager"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400"
              />
              <p className="text-xs text-gray-400 mt-1">Lowercase, underscores only. Used in the database.</p>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Display label</label>
              <input
                name="label"
                required
                placeholder="e.g. Office Manager"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Description (optional)</label>
            <input
              name="description"
              placeholder="Brief description of this role's responsibilities"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400"
            />
          </div>

          {/* Permission matrix */}
          <div className="space-y-4">
            <p className="text-xs font-medium text-gray-600 uppercase tracking-wide">Permissions</p>
            {PERMISSION_GROUPS.map((group) => (
              <div key={group.label}>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">{group.label}</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {group.keys.map((key) => (
                    <label key={key} className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        name={`perm_${key}`}
                        value="on"
                        className="rounded text-sky-600 focus:ring-sky-400"
                      />
                      {key}
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="bg-sky-600 hover:bg-sky-700 text-white text-sm font-semibold px-5 py-2 rounded-lg transition-colors"
            >
              Create Role
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
