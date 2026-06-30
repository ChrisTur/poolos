import { db } from "@/lib/db"
import { requirePermission } from "@/lib/session"
import { updateCompany, uploadLogo, updatePublicPage, toggleGalleryPhoto, uploadGalleryPhoto, deleteGalleryPhoto } from "@/lib/actions/company"
import StateSelect from "@/components/ui/StateSelect"
import Card, { CardBody, CardHeader } from "@/components/ui/Card"
import Button from "@/components/ui/Button"
import ConfirmButton from "@/components/ui/ConfirmButton"
import { Upload, Star, Globe, Image as ImageIcon, Trash2 } from "lucide-react"

const GCS = process.env.NEXT_PUBLIC_GCS_PUBLIC_URL ?? ""

export const dynamic = "force-dynamic"

export default async function CompanySettingsPage() {
  const { companyId } = await requirePermission("settings.company")
  const [company, visitPhotos] = await Promise.all([
    db.company.findUnique({ where: { id: companyId } }),
    db.attachment.findMany({
      where: { companyId, serviceVisitId: { not: null }, mimeType: { startsWith: "image/" } },
      orderBy: { createdAt: "desc" },
      take: 30,
      select: { id: true, key: true, filename: true, isPublicGallery: true },
    }),
  ])
  if (!company) return null

  const galleryPhotos = await db.attachment.findMany({
    where: { companyId, isPublicGallery: true, serviceVisitId: null },
    orderBy: { createdAt: "desc" },
    select: { id: true, key: true, filename: true },
  })

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

      {/* Review Request Automation */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Star className="w-4 h-4 text-amber-500" />
            <h2 className="font-semibold text-gray-900 text-sm">Review Request Automation</h2>
          </div>
        </CardHeader>
        <CardBody>
          <form action={updateCompany} className="space-y-5">
            {/* Preserve all other company fields */}
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
            <input type="hidden" name="cardFeeEnabled" value={String(company.cardFeeEnabled)} />
            <input type="hidden" name="cardFeePercent" value={String(company.cardFeePercent)} />
            <input type="hidden" name="cardFeeFixed" value={String(company.cardFeeFixed)} />

            <div className="flex items-center gap-3">
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="hidden" name="reviewRequestEnabled" value="false" />
                <input
                  type="checkbox"
                  name="reviewRequestEnabled"
                  value="true"
                  defaultChecked={company.reviewRequestEnabled}
                  className="sr-only peer"
                />
                <div className="w-10 h-6 bg-gray-200 peer-focus:ring-2 peer-focus:ring-sky-500 rounded-full peer peer-checked:bg-sky-500 after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-4" />
              </label>
              <div>
                <span className="text-sm font-medium text-gray-700">Enable review request emails</span>
                <p className="text-xs text-gray-400 mt-0.5">
                  Automatically email customers a Google review link after a set number of completed visits. Sent once per customer.
                </p>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Send after how many visits?</label>
                <input
                  type="number"
                  name="reviewRequestAfterVisits"
                  min="1"
                  max="50"
                  defaultValue={company.reviewRequestAfterVisits}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
                <p className="text-xs text-gray-400 mt-1">Email is sent once when this threshold is first reached.</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Google review link</label>
                <input
                  type="url"
                  name="googleReviewUrl"
                  defaultValue={company.googleReviewUrl ?? ""}
                  placeholder="https://g.page/r/YOUR_PLACE_ID/review"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
                <p className="text-xs text-gray-400 mt-1">
                  Find yours at{" "}
                  <a href="https://business.google.com" target="_blank" rel="noopener noreferrer" className="text-sky-600 hover:underline">
                    business.google.com
                  </a>
                  {" "}→ Get more reviews.
                </p>
              </div>
            </div>

            <Button type="submit" size="sm">Save Review Settings</Button>
          </form>
        </CardBody>
      </Card>

      {/* Public Profile */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-sky-500" />
            <h2 className="font-semibold text-gray-900 text-sm">Public Profile Page</h2>
          </div>
        </CardHeader>
        <CardBody>
          <form action={updatePublicPage} className="space-y-6">

            {/* Enable toggle */}
            <div className="flex items-start gap-3">
              <label className="relative inline-flex items-center cursor-pointer mt-0.5 shrink-0">
                <input type="hidden" name="publicPageEnabled" value="false" />
                <input type="checkbox" name="publicPageEnabled" value="true"
                  defaultChecked={company.publicPageEnabled} className="sr-only peer" />
                <div className="w-10 h-6 bg-gray-200 peer-focus:ring-2 peer-focus:ring-sky-500 rounded-full peer peer-checked:bg-sky-500 after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-4" />
              </label>
              <div>
                <span className="text-sm font-medium text-gray-700">Enable public profile page</span>
                <p className="text-xs text-gray-400 mt-0.5">
                  Publishes at{" "}
                  <a href={`${process.env.NEXT_PUBLIC_APP_URL ?? "https://poolos.biz"}/pro/${company.slug}`}
                    target="_blank" rel="noopener noreferrer" className="text-sky-600 hover:underline">
                    poolos.biz/pro/{company.slug}
                  </a>{" "}— visible to anyone, indexed by Google.
                </p>
              </div>
            </div>

            {/* Tagline + About + Service Area */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tagline</label>
              <input name="publicPageTagline" defaultValue={company.publicPageTagline ?? ""}
                placeholder="Serving Phoenix and the Valley since 2015" maxLength={120}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-sky-500" />
              <p className="text-xs text-gray-400 mt-1">Short line shown under your company name. Max 120 characters.</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">About</label>
              <textarea name="publicPageAbout" defaultValue={company.publicPageAbout ?? ""} rows={4}
                placeholder="Tell potential customers about your business — how long you've been operating, what sets you apart, and what types of pools you service."
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-sky-500 resize-none" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Service Area</label>
              <input name="serviceArea" defaultValue={company.serviceArea ?? ""}
                placeholder="Phoenix, Scottsdale, Tempe, and surrounding areas"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-sky-500" />
              <p className="text-xs text-gray-400 mt-1">Used on your public page and in search metadata.</p>
            </div>

            {/* Contact info visibility */}
            <div>
              <p className="text-sm font-medium text-gray-700 mb-3">Show on public page</p>
              <div className="space-y-2.5">
                {([
                  { name: "publicPageShowPhone",   label: "Phone number",      available: !!company.phone },
                  { name: "publicPageShowWebsite",  label: "Website link",      available: !!company.website },
                  { name: "publicPageShowAddress",  label: "Street address",    available: !!(company.address && company.city) },
                  { name: "publicPageShowEmail",    label: "Contact email",     available: !!company.replyToEmail },
                  { name: "publicPageShowReviews",  label: "Google review link",available: !!company.googleReviewUrl },
                ] as const).map(({ name, label, available }) => (
                  <label key={name} className={`flex items-center gap-3 cursor-pointer ${!available ? "opacity-40" : ""}`}>
                    <input type="hidden" name={name} value="false" />
                    <input type="checkbox" name={name} value="true"
                      defaultChecked={company[name] && available}
                      disabled={!available}
                      className="w-4 h-4 rounded border-gray-300 text-sky-600 focus:ring-sky-500 focus:ring-offset-0" />
                    <span className="text-sm text-gray-700">{label}</span>
                    {!available && <span className="text-xs text-gray-400">(not set)</span>}
                  </label>
                ))}
              </div>
            </div>

            <Button type="submit" size="sm">Save Profile Settings</Button>
          </form>
        </CardBody>
      </Card>

      {/* Gallery */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <ImageIcon className="w-4 h-4 text-sky-500" />
            <h2 className="font-semibold text-gray-900 text-sm">Public Gallery</h2>
          </div>
        </CardHeader>
        <CardBody className="space-y-6">
          {/* Uploaded gallery photos */}
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">Uploaded photos</p>
            {galleryPhotos.length === 0 ? (
              <p className="text-sm text-gray-400">No uploaded gallery photos yet.</p>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {galleryPhotos.map((photo) => {
                  const deleteAction = deleteGalleryPhoto.bind(null, photo.id)
                  return (
                    <div key={photo.id} className="relative group aspect-square rounded-lg overflow-hidden border border-gray-200">
                      <img src={`${GCS}/${photo.key}`} alt={photo.filename}
                        className="w-full h-full object-cover" />
                      <form action={deleteAction} className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button type="submit" title="Remove"
                          className="w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600">
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </form>
                    </div>
                  )
                })}
              </div>
            )}

            {/* Upload new */}
            <form action={uploadGalleryPhoto} encType="multipart/form-data" className="flex items-center gap-3 mt-4">
              <input name="photo" type="file" accept="image/jpeg,image/png,image/webp" required
                className="text-sm text-gray-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-sky-50 file:text-sky-700 hover:file:bg-sky-100" />
              <Button type="submit" size="sm" variant="secondary">
                <Upload className="w-4 h-4" /> Upload
              </Button>
            </form>
            <p className="text-xs text-gray-400 mt-1">JPEG, PNG, or WebP. Max 10 MB. Hero image is the first photo in your gallery.</p>
          </div>

          {/* Pick from visit photos */}
          {visitPhotos.length > 0 && (
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">Add from visit photos</p>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                {visitPhotos.map((photo) => {
                  const toggleAction = toggleGalleryPhoto.bind(null, photo.id)
                  return (
                    <form key={photo.id} action={toggleAction}>
                      <button type="submit" title={photo.isPublicGallery ? "Remove from gallery" : "Add to gallery"}
                        className={`relative w-full aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                          photo.isPublicGallery
                            ? "border-sky-500 ring-2 ring-sky-200"
                            : "border-transparent hover:border-sky-300"
                        }`}>
                        <img src={`${GCS}/${photo.key}`} alt={photo.filename} className="w-full h-full object-cover" />
                        {photo.isPublicGallery && (
                          <div className="absolute inset-0 bg-sky-500/20 flex items-end justify-center pb-1">
                            <span className="text-white text-xs font-bold bg-sky-600 rounded px-1">In gallery</span>
                          </div>
                        )}
                      </button>
                    </form>
                  )
                })}
              </div>
              <p className="text-xs text-gray-400 mt-2">Click a photo to add or remove it from your public gallery.</p>
            </div>
          )}
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
