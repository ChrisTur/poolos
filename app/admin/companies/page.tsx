import { db } from "@/lib/db"
import Card, { CardHeader, CardBody } from "@/components/ui/Card"
import { formatDate } from "@/lib/utils"
import { toggleCompany, adminCreateCompany } from "@/lib/actions/admin"
import Button from "@/components/ui/Button"
import { Building2, Plus, ChevronRight } from "lucide-react"
import Link from "next/link"

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
        _count: { select: { users: true, customers: true, invoices: true } },
      },
    }),
    searchParams,
  ])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Companies ({companies.length})</h1>
      </div>

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

      {/* Company list */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-xs text-gray-500 uppercase tracking-wide">
                <th className="px-5 py-3 text-left font-medium">Company</th>
                <th className="px-5 py-3 text-left font-medium">Contact</th>
                <th className="px-5 py-3 text-center font-medium">Users</th>
                <th className="px-5 py-3 text-center font-medium">Customers</th>
                <th className="px-5 py-3 text-center font-medium">Invoices</th>
                <th className="px-5 py-3 text-left font-medium">Joined</th>
                <th className="px-5 py-3 text-left font-medium">Status</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {companies.map((c) => {
                const action = toggleCompany.bind(null, c.id, !c.isActive)
                return (
                  <tr key={c.id} className="hover:bg-gray-50">
                    <td className="px-5 py-3">
                      <p className="font-medium text-gray-900">{c.name}</p>
                      <p className="text-xs text-gray-400">{c.slug}</p>
                    </td>
                    <td className="px-5 py-3 text-gray-500 text-xs">
                      {c.phone && <p>{c.phone}</p>}
                      {c.city && <p>{c.city}, {c.state}</p>}
                    </td>
                    <td className="px-5 py-3 text-center text-gray-600">{c._count.users}</td>
                    <td className="px-5 py-3 text-center text-gray-600">{c._count.customers}</td>
                    <td className="px-5 py-3 text-center text-gray-600">{c._count.invoices}</td>
                    <td className="px-5 py-3 text-gray-500">{formatDate(c.createdAt)}</td>
                    <td className="px-5 py-3">
                      <form action={action}>
                        <Button type="submit" size="sm" variant={c.isActive ? "danger" : "secondary"}>
                          {c.isActive ? "Deactivate" : "Activate"}
                        </Button>
                      </form>
                    </td>
                    <td className="px-3 py-3">
                      <Link href={`/admin/companies/${c.id}`} className="text-gray-400 hover:text-sky-600">
                        <ChevronRight className="w-4 h-4" />
                      </Link>
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
