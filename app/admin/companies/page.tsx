import { db } from "@/lib/db"
import Card, { CardHeader, CardBody } from "@/components/ui/Card"
import { formatDate } from "@/lib/utils"
import { toggleCompany, adminCreateCompany, deleteCompany } from "@/lib/actions/admin"
import Button from "@/components/ui/Button"
import { Building2, Plus, ChevronRight } from "lucide-react"
import Link from "next/link"
import ConfirmButton from "@/components/ui/ConfirmButton"
import { getPlan } from "@/lib/plans"

export const dynamic = "force-dynamic"

const inputCls = "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-500"

export default async function AdminCompaniesPage({
  searchParams,
}: {
  searchParams: Promise<{ created?: string; error?: string }>
}) {
  const [companies, sp] = await Promise.all([
    db.company.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { users: true, customers: true } },
      },
    }),
    searchParams,
  ])

  return (
    <div className="space-y-5 sm:space-y-6">
      <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Companies ({companies.length})</h1>

      {sp.created && (
        <div className="rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-800">
          Company created successfully. The owner can now log in.
        </div>
      )}
      {sp.error === "email_exists" && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-800">
          A user with that email already exists.
        </div>
      )}

      {/* Create company form */}
      <Card>
        <CardHeader>
          <h2 className="font-semibold text-gray-900 text-sm flex items-center gap-2">
            <Plus className="w-4 h-4 text-sky-500" /> Create New Company
          </h2>
        </CardHeader>
        <CardBody>
          <form action={adminCreateCompany} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
              <input name="companyName" required placeholder="Sunshine Pool Service" className={inputCls} />
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Owner First Name</label>
                <input name="firstName" required placeholder="Jane" className={inputCls} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Owner Last Name</label>
                <input name="lastName" required placeholder="Smith" className={inputCls} />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Owner Email</label>
              <input name="email" type="email" required placeholder="owner@company.com" className={inputCls} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Temporary Password</label>
              <input name="password" type="text" required placeholder="Set a temporary password for the owner" className={inputCls} />
            </div>
            <Button type="submit">
              <Building2 className="w-4 h-4" /> Create Company
            </Button>
          </form>
        </CardBody>
      </Card>

      {/* Mobile card list */}
      <div className="sm:hidden space-y-2">
        {companies.map((c) => {
          const toggleAction = toggleCompany.bind(null, c.id, !c.isActive)
          const deleteAction = deleteCompany.bind(null, c.id)
          return (
            <Card key={c.id} className="p-4">
              <div className="flex items-start justify-between mb-2">
                <div className="min-w-0">
                  <Link href={`/admin/companies/${c.id}`} className="font-medium text-gray-900 hover:text-sky-600 truncate block">
                    {c.name}
                  </Link>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {c._count.customers} customers · {c._count.users} users · Joined {formatDate(c.createdAt)}
                  </p>
                </div>
                <Link href={`/admin/companies/${c.id}`} className="shrink-0 ml-3">
                  <ChevronRight className="w-4 h-4 text-gray-300" />
                </Link>
              </div>
              <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  c.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"
                }`}>{c.isActive ? "Active" : "Inactive"}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getPlan(c.plan).badge}`}>
                  {getPlan(c.plan).label}
                </span>
                <div className="ml-auto flex gap-2">
                  <form action={toggleAction}>
                    <Button type="submit" size="sm" variant="secondary">
                      {c.isActive ? "Deactivate" : "Activate"}
                    </Button>
                  </form>
                  <ConfirmButton
                    action={deleteAction}
                    confirm={`Delete ${c.name} and all its data? This cannot be undone.`}
                    variant="danger"
                    size="sm"
                  >
                    Delete
                  </ConfirmButton>
                </div>
              </div>
            </Card>
          )
        })}
      </div>

      {/* Desktop table */}
      <Card className="hidden sm:block">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-xs text-gray-500 uppercase tracking-wide">
                <th className="px-5 py-3 text-left font-medium">Company</th>
                <th className="px-5 py-3 text-left font-medium hidden md:table-cell">Contact</th>
                <th className="px-5 py-3 text-center font-medium">Customers</th>
                <th className="px-5 py-3 text-center font-medium">Users</th>
                <th className="px-5 py-3 text-left font-medium hidden md:table-cell">Joined</th>
                <th className="px-5 py-3 text-left font-medium">Plan</th>
                <th className="px-5 py-3 text-left font-medium">Status</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {companies.map((c) => {
                const toggleAction = toggleCompany.bind(null, c.id, !c.isActive)
                const deleteAction = deleteCompany.bind(null, c.id)
                return (
                  <tr key={c.id} className="hover:bg-gray-50">
                    <td className="px-5 py-3">
                      <p className="font-medium text-gray-900">{c.name}</p>
                      <p className="text-xs text-gray-400">{c.slug}</p>
                    </td>
                    <td className="px-5 py-3 text-gray-500 text-xs hidden md:table-cell">
                      {c.phone && <p>{c.phone}</p>}
                      {c.city && <p>{c.city}, {c.state}</p>}
                    </td>
                    <td className="px-5 py-3 text-center text-gray-600">{c._count.customers}</td>
                    <td className="px-5 py-3 text-center text-gray-600">{c._count.users}</td>
                    <td className="px-5 py-3 text-gray-500 hidden md:table-cell">{formatDate(c.createdAt)}</td>
                    <td className="px-5 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getPlan(c.plan).badge}`}>
                        {getPlan(c.plan).label}
                      </span>
                      {c.stripeSubStatus && c.stripeSubStatus !== "active" && (
                        <p className="text-xs text-red-500 mt-0.5">{c.stripeSubStatus}</p>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        c.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"
                      }`}>{c.isActive ? "Active" : "Inactive"}</span>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <form action={toggleAction}>
                          <Button type="submit" size="sm" variant="secondary">
                            {c.isActive ? "Deactivate" : "Activate"}
                          </Button>
                        </form>
                        <ConfirmButton
                          action={deleteAction}
                          confirm={`Delete ${c.name} and all its data? This cannot be undone.`}
                          variant="danger"
                          size="sm"
                        >
                          Delete
                        </ConfirmButton>
                        <Link href={`/admin/companies/${c.id}`} className="text-gray-400 hover:text-sky-600">
                          <ChevronRight className="w-4 h-4" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
