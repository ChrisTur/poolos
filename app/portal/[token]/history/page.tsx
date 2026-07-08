import { db } from "@/lib/db"
import { notFound } from "next/navigation"
import Link from "next/link"
import { ChevronLeft, Droplets, FlaskConical, Camera, User } from "lucide-react"

export const dynamic = "force-dynamic"

const GCS = process.env.NEXT_PUBLIC_GCS_PUBLIC_URL ?? ""

function publicUrl(key: string) {
  return `${GCS}/${key}`
}

function Reading({ label, value, unit }: { label: string; value: number | null | undefined; unit: string }) {
  if (value == null) return null
  return (
    <div className="text-center">
      <p className="text-xs text-gray-400">{label}</p>
      <p className="text-sm font-semibold text-gray-900">{value} <span className="text-xs font-normal text-gray-400">{unit}</span></p>
    </div>
  )
}

export default async function PortalHistoryPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params

  const customer = await db.customer.findUnique({
    where: { portalToken: token },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      company: { select: { name: true, logoUrl: true, phone: true, replyToEmail: true } },
      serviceVisits: {
        orderBy: { visitedAt: "desc" },
        include: {
          technician: { select: { firstName: true, lastName: true } },
          chemicalUsages: { orderBy: { createdAt: "asc" } },
        },
      },
    },
  })

  if (!customer) notFound()

  const visitIds = customer.serviceVisits.map((v) => v.id)

  const attachments = visitIds.length > 0
    ? await db.attachment.findMany({
        where: { serviceVisitId: { in: visitIds } },
        select: { id: true, key: true, filename: true, mimeType: true, serviceVisitId: true },
        orderBy: { createdAt: "asc" },
      })
    : []

  const photosByVisit = new Map<string, typeof attachments>()
  for (const a of attachments) {
    if (!a.serviceVisitId) continue
    const list = photosByVisit.get(a.serviceVisitId) ?? []
    list.push(a)
    photosByVisit.set(a.serviceVisitId, list)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-2xl mx-auto px-4 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {customer.company.logoUrl ? (
              <img src={customer.company.logoUrl} alt={customer.company.name} className="h-8 object-contain" />
            ) : (
              <span className="text-base font-bold text-gray-900">{customer.company.name}</span>
            )}
          </div>
          {(customer.company.phone || customer.company.replyToEmail) && (
            <a
              href={customer.company.phone ? `tel:${customer.company.phone}` : `mailto:${customer.company.replyToEmail}`}
              className="text-sm text-sky-600 hover:underline"
            >
              {customer.company.phone ?? customer.company.replyToEmail}
            </a>
          )}
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        {/* Back link */}
        <div>
          <Link
            href={`/portal/${token}`}
            className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900 mb-4"
          >
            <ChevronLeft className="w-4 h-4" /> Back to account
          </Link>
          <h1 className="text-xl font-bold text-gray-900">Service History</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {customer.firstName} {customer.lastName} · {customer.serviceVisits.length} visit{customer.serviceVisits.length !== 1 ? "s" : ""}
          </p>
        </div>

        {customer.serviceVisits.length === 0 ? (
          <div className="text-center py-16">
            <Droplets className="w-10 h-10 text-gray-200 mx-auto mb-3" />
            <p className="text-sm text-gray-400">No service visits on record yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {customer.serviceVisits.map((visit) => {
              const photos = photosByVisit.get(visit.id) ?? []
              const hasReadings = visit.chlorine != null || visit.ph != null || visit.alkalinity != null
                || visit.calcium != null || visit.cya != null || visit.salt != null
              const hasChemicals = visit.chemicalUsages.length > 0

              return (
                <div key={visit.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                  {/* Visit header */}
                  <div className="px-5 py-4 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-sky-50 flex items-center justify-center shrink-0">
                        <Droplets className="w-5 h-5 text-sky-500" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">
                          {new Date(visit.visitedAt).toLocaleDateString("en-US", {
                            weekday: "short", month: "long", day: "numeric", year: "numeric",
                          })}
                        </p>
                        {visit.technician && (
                          <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                            <User className="w-3 h-3" />
                            {visit.technician.firstName} {visit.technician.lastName}
                          </p>
                        )}
                      </div>
                    </div>
                    {(photos.length > 0) && (
                      <span className="flex items-center gap-1 text-xs text-gray-400">
                        <Camera className="w-3.5 h-3.5" />
                        {photos.length}
                      </span>
                    )}
                  </div>

                  {/* Notes */}
                  {visit.notes && (
                    <div className="px-5 pb-3">
                      <p className="text-sm text-gray-600 leading-relaxed">{visit.notes}</p>
                    </div>
                  )}

                  {/* Chemical readings */}
                  {hasReadings && (
                    <div className="border-t border-gray-50 px-5 py-3">
                      <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                        <FlaskConical className="w-3.5 h-3.5" /> Water readings
                      </p>
                      <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
                        <Reading label="Chlorine" value={visit.chlorine}   unit="ppm" />
                        <Reading label="pH"        value={visit.ph}         unit=""    />
                        <Reading label="Alkalinity" value={visit.alkalinity} unit="ppm" />
                        <Reading label="Calcium"   value={visit.calcium}    unit="ppm" />
                        {visit.saltwater && <Reading label="CYA" value={visit.cya} unit="ppm" />}
                        {visit.saltwater && <Reading label="Salt" value={visit.salt} unit="ppm" />}
                      </div>
                    </div>
                  )}

                  {/* Chemicals used */}
                  {hasChemicals && (
                    <div className="border-t border-gray-50 px-5 py-3">
                      <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">
                        Chemicals applied
                      </p>
                      <div className="space-y-1">
                        {visit.chemicalUsages.map((cu) => (
                          <div key={cu.id} className="flex items-center justify-between text-sm">
                            <span className="text-gray-700">{cu.productName}</span>
                            <span className="text-gray-400 tabular-nums">{cu.quantity} {cu.unit}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Photos */}
                  {photos.length > 0 && (
                    <div className="border-t border-gray-50 px-5 py-3">
                      <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">Photos</p>
                      <div className="grid grid-cols-3 gap-2">
                        {photos.map((photo) => (
                          <a
                            key={photo.id}
                            href={publicUrl(photo.key)}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <img
                              src={publicUrl(photo.key)}
                              alt={photo.filename}
                              className="w-full aspect-square object-cover rounded-lg"
                            />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        <p className="text-center text-xs text-gray-400 pt-4">
          {customer.company.name} · Powered by PoolOS
        </p>
      </div>
    </div>
  )
}
