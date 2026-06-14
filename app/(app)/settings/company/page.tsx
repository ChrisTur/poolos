import { db } from "@/lib/db"
import { requireOwner } from "@/lib/session"
import { updateCompany } from "@/lib/actions/company"
import Card, { CardBody, CardHeader } from "@/components/ui/Card"
import Button from "@/components/ui/Button"

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
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500" />
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input name="phone" type="tel" defaultValue={company.phone ?? ""}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
                <input name="website" type="url" defaultValue={company.website ?? ""}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Street Address</label>
              <input name="address" defaultValue={company.address ?? ""}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500" />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <input name="city" defaultValue={company.city ?? ""} placeholder="City"
                className="col-span-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500" />
              <input name="state" defaultValue={company.state ?? ""} placeholder="ST" maxLength={2}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500" />
              <input name="zip" defaultValue={company.zip ?? ""} placeholder="ZIP"
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500" />
            </div>
            <Button type="submit">Save Changes</Button>
          </form>
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
