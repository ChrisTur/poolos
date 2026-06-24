import { db } from "@/lib/db"
import { requireSession } from "@/lib/session"
import Link from "next/link"
import { Plus, Search, Download, Upload } from "lucide-react"
import Button from "@/components/ui/Button"
import CustomerListClient from "@/components/customers/CustomerListClient"

export const dynamic = "force-dynamic"

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; tag?: string }>
}) {
  const { companyId } = await requireSession()
  const { q, status, tag: tagFilter } = await searchParams

  const [customers, allCustomers, companyTags] = await Promise.all([
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
    db.customer.findMany({
      where: { companyId },
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
          <p className="text-sm text-gray-500 mt-0.5">{allCustomers.length} total</p>
        </div>
        <div className="flex items-center gap-2">
          <a href={`/api/export/customers${status && status !== "all" ? `?status=${status}` : ""}`} download>
            <Button size="sm" variant="secondary">
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Export</span>
            </Button>
          </a>
          <Link href="/customers/import">
            <Button size="sm" variant="secondary">
              <Upload className="w-4 h-4" />
              <span className="hidden sm:inline">Import</span>
            </Button>
          </Link>
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

      <CustomerListClient customers={customers} allCustomers={allCustomers} />
    </div>
  )
}
