import { db } from "@/lib/db"
import { requireSession } from "@/lib/session"
import Link from "next/link"
import { Plus, Search, Pencil, Trash2, Download, ChevronRight } from "lucide-react"
import Card from "@/components/ui/Card"
import { statusBadge } from "@/components/ui/Badge"
import { formatCurrency, formatPhone } from "@/lib/utils"
import Button from "@/components/ui/Button"
import ConfirmButton from "@/components/ui/ConfirmButton"
import { deleteCustomer } from "@/lib/actions/customers"

export const dynamic = "force-dynamic"

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; tag?: string }>
}) {
  const { companyId } = await requireSession()
  const { q, status, tag: tagFilter } = await searchParams

  const [customers, companyTags] = await Promise.all([
    db.customer.findMany({
      where: {
        companyId,
        status: status && status !== "all" ? status : undefined,
        OR: q
          ? [
              { firstName: { contains: q, mode: "insensitive" } },
              { lastName: { contains: q, mode: "insensitive" } },
              { email: { contains: q, mode: "insensitive" } },
              { phone: { contains: q } },
              { address: { contains: q, mode: "insensitive" } },
              { city: { contains: q, mode: "insensitive" } },
            ]
          : undefined,
        tags: tagFilter
          ? { some: { tag: { id: tagFilter } } }
          : undefined,
      },
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
      include: {
        _count: { select: { invoices: true, serviceVisits: true } },
        tags: { include: { tag: true } },
      },
    }),
    db.tag.findMany({ where: { companyId }, orderBy: { name: "asc" } }),
  ])

  return (
    <div className="space-y-4 sm:space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Customers</h1>
          <p className="text-sm text-gray-500 mt-0.5">{customers.length} total</p>
        </div>
        <div className="flex items-center gap-2">
          <a href={`/api/export/customers${status && status !== "all" ? `?status=${status}` : ""}`} download>
            <Button size="sm" variant="secondary">
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Export</span>
            </Button>
          </a>
          <Link href="/customers/new">
            <Button size="sm">
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Add Customer</span>
              <span className="sm:hidden">Add</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Filters */}
      <form method="GET" className="flex flex-col sm:flex-row gap-2 sm:gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            name="q"
            defaultValue={q}
            placeholder="Search customers…"
            className="w-full pl-9 pr-3 py-2.5 text-sm text-gray-900 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
        </div>
        <div className="flex gap-2">
          <select
            name="status"
            defaultValue={status || "all"}
            className="flex-1 sm:flex-none text-sm text-gray-900 border border-gray-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-sky-500"
          >
            <option value="all">All statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="suspended">Suspended</option>
          </select>
          {companyTags.length > 0 && (
            <select
              name="tag"
              defaultValue={tagFilter || ""}
              className="flex-1 sm:flex-none text-sm text-gray-900 border border-gray-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-sky-500"
            >
              <option value="">All tags</option>
              {companyTags.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          )}
          <Button type="submit" variant="secondary" size="sm">Search</Button>
        </div>
      </form>

      {/* Active tag filter chip */}
      {tagFilter && (() => {
        const activeTag = companyTags.find((t) => t.id === tagFilter)
        if (!activeTag) return null
        return (
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">Filtered by:</span>
            <span
              className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium text-white"
              style={{ backgroundColor: activeTag.color }}
            >
              {activeTag.name}
            </span>
            <Link
              href={`/customers${q ? `?q=${q}` : ""}${status && status !== "all" ? `&status=${status}` : ""}`}
              className="text-xs text-gray-400 hover:text-gray-600"
            >
              Clear
            </Link>
          </div>
        )
      })()}

      {customers.length === 0 ? (
        <Card>
          <div className="py-16 text-center">
            <p className="text-gray-400 text-sm">No customers found.</p>
            <Link href="/customers/new" className="mt-3 inline-block text-sm text-sky-600 hover:underline">
              Add your first customer
            </Link>
          </div>
        </Card>
      ) : (
        <>
          {/* Mobile card list */}
          <div className="sm:hidden space-y-2">
            {customers.map((c) => {
              const deleteAction = deleteCustomer.bind(null, c.id)
              return (
                <Card key={c.id} className="p-0 overflow-hidden">
                  <Link href={`/customers/${c.id}`} className="flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 transition-colors">
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-gray-900 truncate">{c.firstName} {c.lastName}</p>
                      <p className="text-xs text-gray-400 mt-0.5 truncate">
                        {c.phone ? formatPhone(c.phone) : c.email || c.city}
                      </p>
                      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                        {statusBadge(c.status)}
                        <span className="text-xs text-gray-400">{c._count.serviceVisits} visits</span>
                        {c.monthlyRate && (
                          <span className="text-xs text-gray-400">{formatCurrency(c.monthlyRate)}/mo</span>
                        )}
                        {c.tags.map(({ tag }) => (
                          <span key={tag.id} className="inline-flex items-center rounded-full px-1.5 py-0.5 text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200">
                            {tag.name}
                          </span>
                        ))}
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-300 shrink-0" />
                  </Link>
                  <div className="flex items-center gap-1 border-t border-gray-100 px-3 py-1.5">
                    <Link href={`/customers/${c.id}/edit`}>
                      <button className="p-1.5 rounded-lg text-gray-400 hover:text-sky-600 hover:bg-sky-50 transition-colors">
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                    </Link>
                    <ConfirmButton action={deleteAction} confirm={`Delete ${c.firstName} ${c.lastName}?`} variant="danger" size="sm" className="p-1.5">
                      <Trash2 className="w-3.5 h-3.5" />
                    </ConfirmButton>
                  </div>
                </Card>
              )
            })}
          </div>

          {/* Desktop/tablet table */}
          <Card className="hidden sm:block">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 text-xs text-gray-500 uppercase tracking-wide">
                    <th className="px-5 py-3 text-left font-medium">Name</th>
                    <th className="px-5 py-3 text-left font-medium">Contact</th>
                    <th className="px-5 py-3 text-left font-medium hidden md:table-cell">Address</th>
                    <th className="px-5 py-3 text-left font-medium hidden lg:table-cell">Rate</th>
                    <th className="px-5 py-3 text-left font-medium">Status</th>
                    <th className="px-5 py-3 text-left font-medium hidden lg:table-cell">Tags</th>
                    <th className="px-5 py-3 text-right font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {customers.map((c) => {
                    const deleteAction = deleteCustomer.bind(null, c.id)
                    return (
                      <tr key={c.id} className="hover:bg-sky-50 transition-colors group">
                        <td className="px-5 py-3">
                          <Link href={`/customers/${c.id}`} className="font-semibold text-sky-700 hover:text-sky-900 hover:underline">
                            {c.firstName} {c.lastName}
                          </Link>
                          <p className="text-xs text-gray-400 mt-0.5">
                            {c._count.serviceVisits} visits · {c._count.invoices} invoices
                          </p>
                        </td>
                        <td className="px-5 py-3 text-gray-600">
                          <p className="truncate max-w-[180px]">{c.email || "—"}</p>
                          <p className="text-gray-400">{c.phone ? formatPhone(c.phone) : ""}</p>
                        </td>
                        <td className="px-5 py-3 hidden md:table-cell text-gray-500 max-w-[200px] truncate">
                          {c.address}, {c.city}
                        </td>
                        <td className="px-5 py-3 hidden lg:table-cell text-gray-600">
                          {c.monthlyRate ? formatCurrency(c.monthlyRate) + "/mo" : "—"}
                        </td>
                        <td className="px-5 py-3">{statusBadge(c.status)}</td>
                        <td className="px-5 py-3 hidden lg:table-cell">
                          <div className="flex flex-wrap gap-1">
                            {c.tags.map(({ tag }) => (
                              <span key={tag.id} className="inline-flex items-center rounded-full px-1.5 py-0.5 text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200">
                                {tag.name}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="px-5 py-3">
                          <div className="flex items-center justify-end gap-1">
                            <Link href={`/customers/${c.id}`}>
                              <button className="p-1.5 rounded-lg text-gray-400 hover:text-sky-600 hover:bg-sky-50 transition-colors" title="View profile">
                                <ChevronRight className="w-4 h-4" />
                              </button>
                            </Link>
                            <Link href={`/customers/${c.id}/edit`}>
                              <button className="p-1.5 rounded-lg text-gray-400 hover:text-sky-600 hover:bg-sky-50 transition-colors" title="Edit">
                                <Pencil className="w-4 h-4" />
                              </button>
                            </Link>
                            <ConfirmButton action={deleteAction} confirm={`Delete ${c.firstName} ${c.lastName}?`} variant="danger" size="sm" className="p-1.5">
                              <Trash2 className="w-4 h-4" />
                            </ConfirmButton>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}
    </div>
  )
}
