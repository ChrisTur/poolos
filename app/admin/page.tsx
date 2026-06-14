import { db } from "@/lib/db"
import Card from "@/components/ui/Card"
import { Building2, Users, FileText, Activity } from "lucide-react"
import Link from "next/link"
import { formatDate } from "@/lib/utils"

export const dynamic = "force-dynamic"

export default async function AdminOverviewPage() {
  const [companyCount, userCount, customerCount, invoiceCount, recentCompanies] = await Promise.all([
    db.company.count(),
    db.user.count(),
    db.customer.count(),
    db.invoice.count(),
    db.company.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
      include: { _count: { select: { users: true, customers: true } } },
    }),
  ])

  const stats = [
    { label: "Companies", value: companyCount, icon: Building2, color: "text-sky-600", bg: "bg-sky-50" },
    { label: "Users", value: userCount, icon: Users, color: "text-indigo-600", bg: "bg-indigo-50" },
    { label: "Customers", value: customerCount, icon: Activity, color: "text-green-600", bg: "bg-green-50" },
    { label: "Invoices", value: invoiceCount, icon: FileText, color: "text-orange-600", bg: "bg-orange-50" },
  ]

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Admin Overview</h1>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(({ label, value, icon: Icon, color, bg }) => (
          <Card key={label} className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-gray-500 font-medium">{label}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
              </div>
              <span className={`${bg} ${color} p-2 rounded-lg`}>
                <Icon className="w-5 h-5" />
              </span>
            </div>
          </Card>
        ))}
      </div>

      <Card>
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Recent Companies</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-xs text-gray-500 uppercase tracking-wide">
                <th className="px-5 py-3 text-left font-medium">Company</th>
                <th className="px-5 py-3 text-left font-medium">Users</th>
                <th className="px-5 py-3 text-left font-medium">Customers</th>
                <th className="px-5 py-3 text-left font-medium">Joined</th>
                <th className="px-5 py-3 text-left font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {recentCompanies.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50">
                  <td className="px-5 py-3">
                    <Link href={`/admin/companies`} className="font-medium text-gray-900 hover:text-sky-600">
                      {c.name}
                    </Link>
                    <p className="text-xs text-gray-400">{c.slug}</p>
                  </td>
                  <td className="px-5 py-3 text-gray-600">{c._count.users}</td>
                  <td className="px-5 py-3 text-gray-600">{c._count.customers}</td>
                  <td className="px-5 py-3 text-gray-500">{formatDate(c.createdAt)}</td>
                  <td className="px-5 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                      c.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"
                    }`}>
                      {c.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
