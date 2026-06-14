import { db } from "@/lib/db"
import Card from "@/components/ui/Card"
import { formatDate } from "@/lib/utils"
import { toggleCompany } from "@/lib/actions/admin"
import Button from "@/components/ui/Button"

export const dynamic = "force-dynamic"

export default async function AdminCompaniesPage() {
  const companies = await db.company.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { users: true, customers: true, invoices: true } },
    },
  })

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold text-gray-900">Companies ({companies.length})</h1>
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
                        <Button type="submit" size="sm"
                          variant={c.isActive ? "danger" : "secondary"}>
                          {c.isActive ? "Deactivate" : "Activate"}
                        </Button>
                      </form>
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
