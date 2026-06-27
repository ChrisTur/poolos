import { requireSuperAdmin } from "@/lib/session"
import { db } from "@/lib/db"
import { notFound } from "next/navigation"
import Link from "next/link"
import { ChevronLeft, Trash2 } from "lucide-react"
import { updateRole, deleteRole } from "@/lib/actions/roles"
import { PERMISSION_GROUPS, PERMISSIONS } from "@/lib/permissions"

interface Props {
  params: Promise<{ id: string }>
  searchParams: Promise<{ saved?: string }>
}

export default async function AdminRoleDetailPage({ params, searchParams }: Props) {
  await requireSuperAdmin()

  const { id } = await params
  const { saved } = await searchParams

  const role = await db.role.findUnique({ where: { id } })
  if (!role) notFound()

  const grantedSet = new Set(role.permissions)
  const update = updateRole.bind(null, id)

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Link href="/admin/roles" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800">
        <ChevronLeft className="w-4 h-4" />
        All Roles
      </Link>

      {saved && (
        <div className="bg-green-50 border border-green-200 text-green-800 rounded-xl px-4 py-3 text-sm font-medium">
          Role saved successfully.
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h1 className="text-lg font-bold text-gray-900">
            {role.label}
            {role.isBuiltIn && (
              <span className="ml-2 text-xs font-normal text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">built-in</span>
            )}
          </h1>
          {!role.isBuiltIn && (
            <form action={deleteRole.bind(null, id)}>
              <button
                type="submit"
                className="flex items-center gap-1.5 text-xs text-red-500 hover:text-red-700 border border-red-200 hover:border-red-400 rounded-lg px-3 py-1.5 transition-colors"
                onClick={(e) => {
                  if (!confirm("Delete this role? This cannot be undone.")) e.preventDefault()
                }}
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete Role
              </button>
            </form>
          )}
        </div>

        <form action={update} className="p-6 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Internal name</label>
              <input
                value={role.name}
                disabled
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 text-gray-400 cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Display label</label>
              <input
                name="label"
                defaultValue={role.label}
                required
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
            <input
              name="description"
              defaultValue={role.description ?? ""}
              placeholder="Brief description of this role"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400"
            />
          </div>

          {/* Permission matrix */}
          <div className="space-y-5">
            <p className="text-xs font-medium text-gray-600 uppercase tracking-wide border-b border-gray-100 pb-2">Permissions</p>
            {PERMISSION_GROUPS.map((group) => (
              <div key={group.label}>
                <p className="text-xs font-semibold text-sky-600 uppercase tracking-wider mb-2">{group.label}</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-2 gap-x-4">
                  {group.keys.map((key) => (
                    <label key={key} className="flex items-center gap-2 cursor-pointer select-none group">
                      <input
                        type="checkbox"
                        name={`perm_${key}`}
                        value="on"
                        defaultChecked={grantedSet.has(key)}
                        className="rounded text-sky-600 focus:ring-sky-400 shrink-0"
                      />
                      <span className="text-xs text-gray-700 group-hover:text-gray-900 leading-tight">
                        <span className="font-medium text-gray-400">{key.split(".")[0]}.</span>
                        {key.split(".")[1]}
                        <span className="block text-gray-400 font-normal">{PERMISSIONS[key]}</span>
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="pt-2 border-t border-gray-100 flex items-center gap-3">
            <button
              type="submit"
              className="bg-sky-600 hover:bg-sky-700 text-white text-sm font-semibold px-5 py-2 rounded-lg transition-colors"
            >
              Save Changes
            </button>
            <Link href="/admin/roles" className="text-sm text-gray-500 hover:text-gray-700">
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
