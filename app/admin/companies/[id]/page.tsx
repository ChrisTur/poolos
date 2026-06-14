import { db } from "@/lib/db"
import { notFound, redirect } from "next/navigation"
import { auth } from "@/auth"
import Link from "next/link"
import { ChevronLeft, Upload, Eye, KeyRound } from "lucide-react"
import Card, { CardHeader, CardBody } from "@/components/ui/Card"
import Button from "@/components/ui/Button"
import StateSelect from "@/components/ui/StateSelect"
import { formatDate } from "@/lib/utils"
import { adminUpdateCompany, adminUploadLogo, startViewAs, adminResetPassword } from "@/lib/actions/admin"

export const dynamic = "force-dynamic"

const inputCls = "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-500"

export default async function AdminCompanyDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ reset?: string; resetError?: string }>
}) {
  const session = await auth()
  if (session?.user?.email !== process.env.SUPER_ADMIN_EMAIL) redirect("/dashboard")

  const { id } = await params
  const { reset, resetError } = await searchParams

  const company = await db.company.findUnique({
    where: { id },
    include: {
      users: { orderBy: [{ role: "asc" }, { firstName: "asc" }] },
      _count: { select: { customers: true, invoices: true } },
    },
  })

  if (!company) notFound()

  const updateAction = adminUpdateCompany.bind(null, id)
  const logoAction = adminUploadLogo.bind(null, id)
  const viewAsAction = startViewAs.bind(null, id)

  return (
    <div className="space-y-5 sm:space-y-6 max-w-3xl">
      <div>
        <Link href="/admin/companies" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900 mb-3">
          <ChevronLeft className="w-4 h-4" /> Companies
        </Link>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{company.name}</h1>
            <p className="text-sm text-gray-400 mt-0.5">
              Created {formatDate(company.createdAt)} · {company._count.customers} customers · {company._count.invoices} invoices
            </p>
          </div>
          <form action={viewAsAction}>
            <Button type="submit" variant="secondary" size="sm">
              <Eye className="w-4 h-4" />
              <span className="hidden sm:inline">View as Company</span>
              <span className="sm:hidden">View</span>
            </Button>
          </form>
        </div>
      </div>

      {reset && (
        <div className="rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-800">
          Password reset successfully.
        </div>
      )}
      {resetError && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-800">
          Password must be at least 6 characters.
        </div>
      )}

      {/* Logo */}
      <Card>
        <CardHeader><h2 className="font-semibold text-gray-900 text-sm">Company Logo</h2></CardHeader>
        <CardBody className="space-y-4">
          {company.logoUrl ? (
            <img src={company.logoUrl} alt="Company logo" className="h-16 object-contain rounded" />
          ) : (
            <div className="h-16 w-32 rounded border-2 border-dashed border-gray-200 flex items-center justify-center text-xs text-gray-400">
              No logo
            </div>
          )}
          <form action={logoAction} encType="multipart/form-data" className="flex flex-wrap items-center gap-3">
            <input
              name="logo"
              type="file"
              accept="image/*"
              required
              className="text-sm text-gray-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-sky-50 file:text-sky-700 hover:file:bg-sky-100"
            />
            <Button type="submit" size="sm" variant="secondary">
              <Upload className="w-4 h-4" /> Upload
            </Button>
          </form>
          <p className="text-xs text-gray-400">PNG, JPG or SVG. Shown on invoices.</p>
        </CardBody>
      </Card>

      {/* Company info */}
      <Card>
        <CardHeader><h2 className="font-semibold text-gray-900 text-sm">Company Info</h2></CardHeader>
        <CardBody>
          <form action={updateAction} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
              <input name="name" required defaultValue={company.name} className={inputCls} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input name="phone" defaultValue={company.phone ?? ""} className={inputCls} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
              <input name="address" defaultValue={company.address ?? ""} className={inputCls} />
            </div>
            <div className="grid sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                <input name="city" defaultValue={company.city ?? ""} className={inputCls} />
              </div>
              <StateSelect label="State" defaultValue={company.state ?? ""} />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Zip</label>
                <input name="zip" defaultValue={company.zip ?? ""} className={inputCls} />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
              <input name="website" defaultValue={company.website ?? ""} className={inputCls} />
            </div>
            <Button type="submit">Save Changes</Button>
          </form>
        </CardBody>
      </Card>

      {/* Team + Password Reset */}
      <Card>
        <CardHeader>
          <h2 className="font-semibold text-gray-900 text-sm flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-gray-400" />
            Team & Password Reset ({company.users.length})
          </h2>
        </CardHeader>
        <div className="divide-y divide-gray-100">
          {company.users.map((user) => {
            const resetAction = adminResetPassword.bind(null, id, user.id)
            return (
              <div key={user.id} className="px-4 sm:px-5 py-4 space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{user.firstName} {user.lastName}</p>
                    <p className="text-xs text-gray-400 truncate">{user.email}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs text-gray-500 capitalize hidden sm:inline">{user.role}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${user.isActive ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                      {user.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>
                </div>
                <form action={resetAction} className="flex gap-2">
                  <input
                    name="password"
                    type="text"
                    placeholder="New password (min 6 chars)"
                    required
                    minLength={6}
                    className="flex-1 rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                  <Button type="submit" size="sm" variant="secondary">
                    Reset
                  </Button>
                </form>
              </div>
            )
          })}
        </div>
      </Card>
    </div>
  )
}
