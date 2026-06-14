import { db } from "@/lib/db"
import { requireOwner } from "@/lib/session"
import { updateCompany, uploadLogo } from "@/lib/actions/company"
import Card, { CardBody, CardHeader } from "@/components/ui/Card"
import Button from "@/components/ui/Button"
import { Upload } from "lucide-react"

export const dynamic = "force-dynamic"

export default async function CompanySettingsPage() {
  const { companyId } = await requireOwner()
  const company = await db.company.findUnique({ where: { id: companyId } })
  if (!company) return null

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Company Settings</h1>
        <p className="text-sm text-gray-500 mt-1">Update your business information.</p>
      </div>

      <Card>
        <CardHeader><h2 className="font-semibold text-gray-900 text-sm">Business Details</h2></CardHeader>
        <CardBody>
          <form action={updateCompany} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Company Name *</label>
              <input name="name" defaultValue={company.name} required
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-sky-500" />
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input name="phone" type="tel" defaultValue={company.phone ?? ""}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-sky-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
                <input name="website" type="url" defaultValue={company.website ?? ""}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-sky-500" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Street Address</label>
              <input name="address" defaultValue={company.address ?? ""}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-sky-500" />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <input name="city" defaultValue={company.city ?? ""} placeholder="City"
                className="col-span-1 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-sky-500" />
              <input name="state" defaultValue={company.state ?? ""} placeholder="ST" maxLength={2}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-sky-500" />
              <input name="zip" defaultValue={company.zip ?? ""} placeholder="ZIP"
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-sky-500" />
            </div>
            <Button type="submit">Save Changes</Button>
          </form>
        </CardBody>
      </Card>

      {/* Logo */}
      <Card>
        <CardHeader><h2 className="font-semibold text-gray-900 text-sm">Company Logo</h2></CardHeader>
        <CardBody className="space-y-4">
          {company.logoUrl ? (
            <img src={company.logoUrl} alt="Company logo" className="h-16 object-contain rounded" />
          ) : (
            <div className="h-16 w-32 rounded border-2 border-dashed border-gray-200 flex items-center justify-center text-xs text-gray-400">
              No logo yet
            </div>
          )}
          <form action={uploadLogo} encType="multipart/form-data" className="flex items-center gap-3">
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
          <p className="text-xs text-gray-400">PNG, JPG or SVG. Appears on your invoices.</p>
        </CardBody>
      </Card>

      <Card>
        <CardBody>
          <p className="text-xs text-gray-400">Company slug: <code className="bg-gray-100 px-1 rounded">{company.slug}</code></p>
        </CardBody>
      </Card>
    </div>
  )
}
