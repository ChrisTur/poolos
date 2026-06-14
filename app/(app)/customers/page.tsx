import { db } from "@/lib/db"
import { requireSession } from "@/lib/session"
import Link from "next/link"
import { Plus, Search } from "lucide-react"
import Card from "@/components/ui/Card"
import { statusBadge } from "@/components/ui/Badge"
import { formatCurrency, formatPhone } from "@/lib/utils"
import Button from "@/components/ui/Button"

export const dynamic = "force-dynamic"

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>
}) {
  const { companyId } = await requireSession()
  const { q, status } = await searchParams

  const customers = await db.customer.findMany({
    where: {
      companyId,
      status: status && status !== "all" ? status : undefined,
      OR: q
        ? [
            { firstName: { contains: q } },
            { lastName: { contains: q } },
            { email: { contains: q } },
            { phone: { contains: q } },
            { address: { contains: q } },
            { city: { contains: q } },
          ]
        : undefined,
    },
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    include: { _count: { select: { invoices: true, serviceVisits: true } } },
  })

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
          <p className="text-sm text-gray-500 mt-0.5">{customers.length} total</p>
        </div>
        <Link href="/customers/new">
          <Button>
            <Plus className="w-4 h-4" />
            Add Customer
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <form method="GET" className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            name="q"
            defaultValue={q}
            placeholder="Search by name, email, address…"
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
        </div>
        <select
          name="status"
          defaultValue={status || "all"}
          className="text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500"
        >
          <option value="all">All statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="suspended">Suspended</option>
        </select>
        <Button type="submit" variant="secondary">Search</Button>
      </form>

      {/* Table */}
      <Card>
        {customers.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-gray-400 text-sm">No customers found.</p>
            <Link href="/customers/new" className="mt-3 inline-block text-sm text-sky-600 hover:underline">
              Add your first customer
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-xs text-gray-500 uppercase tracking-wide">
                  <th className="px-5 py-3 text-left font-medium">Name</th>
                  <th className="px-5 py-3 text-left font-medium hidden sm:table-cell">Contact</th>
                  <th className="px-5 py-3 text-left font-medium hidden md:table-cell">Address</th>
                  <th className="px-5 py-3 text-left font-medium hidden lg:table-cell">Rate</th>
                  <th className="px-5 py-3 text-left font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {customers.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3">
                      <Link href={`/customers/${c.id}`} className="font-medium text-gray-900 hover:text-sky-600">
                        {c.firstName} {c.lastName}
                      </Link>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {c._count.serviceVisits} visits · {c._count.invoices} invoices
                      </p>
                    </td>
                    <td className="px-5 py-3 hidden sm:table-cell text-gray-600">
                      <p>{c.email || "—"}</p>
                      <p className="text-gray-400">{c.phone ? formatPhone(c.phone) : ""}</p>
                    </td>
                    <td className="px-5 py-3 hidden md:table-cell text-gray-500">
                      {c.address}, {c.city}
                    </td>
                    <td className="px-5 py-3 hidden lg:table-cell text-gray-600">
                      {c.monthlyRate ? formatCurrency(c.monthlyRate) + "/mo" : "—"}
                    </td>
                    <td className="px-5 py-3">{statusBadge(c.status)}</td>
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
