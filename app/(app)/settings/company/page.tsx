import { db } from "@/lib/db"
import { requireOwner } from "@/lib/session"
import { updateCompany, uploadLogo } from "@/lib/actions/company"
import StateSelect from "@/components/ui/StateSelect"
import Card, { CardBody, CardHeader } from "@/components/ui/Card"
import Button from "@/components/ui/Button"
import { Upload } from "lucide-react"

export const dynamic = "force-dynamic"

export default async function CompanySettingsPage() {
  let user: any
  let company: any

  try {
    user = await requireOwner()
  } catch (e: any) {
    if (e?.digest) throw e // re-throw Next.js redirects / not-found
    return <pre className="p-8 text-red-700 text-sm whitespace-pre-wrap">[requireOwner] {e?.name}: {e?.message}{"\n"}{e?.stack}</pre>
  }

  try {
    company = await db.company.findUnique({ where: { id: user.companyId } })
  } catch (e: any) {
    return <pre className="p-8 text-red-700 text-sm whitespace-pre-wrap">[db.findUnique companyId={user.companyId}] {(e as any)?.name}: {(e as any)?.message}{"\n"}{(e as any)?.stack}</pre>
  }

  if (!company) return <pre className="p-8 text-red-700 text-sm">company not found for companyId: {user.companyId}</pre>

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
              <label className="block text-sm font-medium text-gray-700 mb-1">Default Invoice Due Days</label>
              <input name="defaultDueDays" type="number" min="1" max="365"
                defaultValue={company.defaultDueDays}
                className="w-32 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-sky-500" />
              <p className="text-xs text-gray-400 mt-1">How many days after the issue date a new invoice is due. Individual customers can override this.</p>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reply-To Email</label>
                <input name="replyToEmail" type="email" defaultValue={company.replyToEmail ?? ""}
                  placeholder="you@yourcompany.com"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-sky-500" />
                <p className="text-xs text-gray-400 mt-1">Customers who reply to emails will reach this address.</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">BCC Email</label>
                <input name="bccEmail" type="email" defaultValue={company.bccEmail ?? ""}
                  placeholder="yourteam@example.com"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-sky-500" />
                <p className="text-xs text-gray-400 mt-1">Receives a copy of every invoice and reminder.</p>
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
              <StateSelect defaultValue={company.state ?? ""} />
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

      {/* Late Fee */}
      <Card>
        <CardHeader><h2 className="font-semibold text-gray-900 text-sm">Late Fee</h2></CardHeader>
        <CardBody>
          <form action={updateCompany} className="space-y-4">
            <input type="hidden" name="name" value={company.name} />
            <input type="hidden" name="phone" value={company.phone ?? ""} />
            <input type="hidden" name="address" value={company.address ?? ""} />
            <input type="hidden" name="city" value={company.city ?? ""} />
            <input type="hidden" name="state" value={company.state ?? ""} />
            <input type="hidden" name="zip" value={company.zip ?? ""} />
            <input type="hidden" name="website" value={company.website ?? ""} />
            <input type="hidden" name="bccEmail" value={company.bccEmail ?? ""} />
            <input type="hidden" name="replyToEmail" value={company.replyToEmail ?? ""} />
            <input type="hidden" name="defaultDueDays" value={String(company.defaultDueDays)} />
            <input type="hidden" name="cardFeeEnabled" value={String(company.cardFeeEnabled)} />
            <input type="hidden" name="cardFeePercent" value={String(company.cardFeePercent)} />
            <input type="hidden" name="cardFeeFixed" value={String(company.cardFeeFixed)} />
            <div className="flex items-center gap-3">
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="hidden" name="lateFeeEnabled" value="false" />
                <input
                  type="checkbox"
                  name="lateFeeEnabled"
                  value="true"
                  defaultChecked={company.lateFeeEnabled}
                  onChange={() => {}}
                  className="sr-only peer"
                />
                <div className="w-10 h-6 bg-gray-200 peer-focus:ring-2 peer-focus:ring-sky-500 rounded-full peer peer-checked:bg-sky-500 after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-4" />
              </label>
              <span className="text-sm font-medium text-gray-700">Automatically add late fees to overdue invoices</span>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fee percentage</label>
                <div className="flex items-center gap-2">
                  <input name="lateFeePercent" type="number" step="0.1" min="0" max="100"
                    defaultValue={company.lateFeePercent}
                    className="w-24 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-sky-500" />
                  <span className="text-sm text-gray-500">%</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Grace period after due date</label>
                <div className="flex items-center gap-2">
                  <input name="lateFeeGraceDays" type="number" min="0" max="90"
                    defaultValue={company.lateFeeGraceDays}
                    className="w-24 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-sky-500" />
                  <span className="text-sm text-gray-500">days</span>
                </div>
              </div>
            </div>
            <p className="text-xs text-gray-400">Late fee is added once when an invoice first becomes overdue past the grace period.</p>
            <Button type="submit" size="sm">Save Late Fee Settings</Button>
          </form>
        </CardBody>
      </Card>

      {/* Card Convenience Fee */}
      <Card>
        <CardHeader><h2 className="font-semibold text-gray-900 text-sm">Card Processing Fee</h2></CardHeader>
        <CardBody>
          <form action={updateCompany} className="space-y-4">
            <input type="hidden" name="name" value={company.name} />
            <input type="hidden" name="phone" value={company.phone ?? ""} />
            <input type="hidden" name="address" value={company.address ?? ""} />
            <input type="hidden" name="city" value={company.city ?? ""} />
            <input type="hidden" name="state" value={company.state ?? ""} />
            <input type="hidden" name="zip" value={company.zip ?? ""} />
            <input type="hidden" name="website" value={company.website ?? ""} />
            <input type="hidden" name="bccEmail" value={company.bccEmail ?? ""} />
            <input type="hidden" name="replyToEmail" value={company.replyToEmail ?? ""} />
            <input type="hidden" name="defaultDueDays" value={String(company.defaultDueDays)} />
            <input type="hidden" name="lateFeeEnabled" value={String(company.lateFeeEnabled)} />
            <input type="hidden" name="lateFeePercent" value={String(company.lateFeePercent)} />
            <input type="hidden" name="lateFeeGraceDays" value={String(company.lateFeeGraceDays)} />
            <div className="flex items-center gap-3">
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="hidden" name="cardFeeEnabled" value="false" />
                <input
                  type="checkbox"
                  name="cardFeeEnabled"
                  value="true"
                  defaultChecked={company.cardFeeEnabled}
                  onChange={() => {}}
                  className="sr-only peer"
                />
                <div className="w-10 h-6 bg-gray-200 peer-focus:ring-2 peer-focus:ring-sky-500 rounded-full peer peer-checked:bg-sky-500 after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-4" />
              </label>
              <span className="text-sm font-medium text-gray-700">Pass card processing fee to customer</span>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Percentage</label>
                <div className="flex items-center gap-2">
                  <input name="cardFeePercent" type="number" step="0.1" min="0" max="10"
                    defaultValue={company.cardFeePercent}
                    className="w-24 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-sky-500" />
                  <span className="text-sm text-gray-500">%</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fixed amount</label>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">$</span>
                  <input name="cardFeeFixed" type="number" step="0.01" min="0" max="5"
                    defaultValue={company.cardFeeFixed}
                    className="w-24 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-sky-500" />
                </div>
              </div>
            </div>
            <p className="text-xs text-gray-400">Shown transparently on the payment page. Default matches Stripe's standard rate (2.9% + $0.30).</p>
            <Button type="submit" size="sm">Save Fee Settings</Button>
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
