import type { Metadata } from "next"
import { notFound } from "next/navigation"
import Link from "next/link"
import { db } from "@/lib/db"
import { MapPin, Phone, Globe, Waves, CheckCircle2 } from "lucide-react"

const BASE = process.env.NEXT_PUBLIC_APP_URL ?? "https://poolos.biz"
const GCS  = process.env.NEXT_PUBLIC_GCS_PUBLIC_URL ?? ""

type Props = { params: Promise<{ slug: string }> }

async function getCompany(slug: string) {
  const company = await db.company.findUnique({
    where: { slug },
    include: {
      jobTemplates: {
        where: { isActive: true },
        select: { name: true, description: true },
        orderBy: { name: "asc" },
      },
    },
  })
  return company
}

async function getGalleryPhotos(companyId: string) {
  return db.attachment.findMany({
    where: {
      companyId,
      serviceVisitId: { not: null },
      mimeType: { startsWith: "image/" },
    },
    orderBy: { createdAt: "desc" },
    take: 9,
    select: { id: true, key: true, filename: true },
  })
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const company = await getCompany(slug)

  if (!company || !company.publicPageEnabled) {
    return { title: "Not Found" }
  }

  const title = company.serviceArea
    ? `${company.name} | Pool Service in ${company.serviceArea}`
    : `${company.name} | Professional Pool Service`

  const description = company.publicPageTagline
    ?? `${company.name} provides professional pool cleaning, maintenance, and repair services${company.serviceArea ? ` in ${company.serviceArea}` : ""}.`

  const url = `${BASE}/pro/${slug}`

  const photos = await getGalleryPhotos(company.id)
  const heroPhoto = photos[0] ? `${GCS}/${photos[0].key}` : null

  return {
    title,
    description,
    alternates: { canonical: url },
    keywords: [
      "pool service",
      "pool cleaning",
      "pool maintenance",
      company.name,
      ...(company.city ? [company.city] : []),
      ...(company.state ? [company.state] : []),
      ...(company.serviceArea ? [company.serviceArea] : []),
    ].join(", "),
    openGraph: {
      title,
      description,
      url,
      type: "website",
      siteName: "PoolOS",
      ...(heroPhoto ? { images: [{ url: heroPhoto, width: 1200, height: 630, alt: company.name }] } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      ...(heroPhoto ? { images: [heroPhoto] } : {}),
    },
  }
}

export default async function CompanyPublicPage({ params }: Props) {
  const { slug } = await params
  const company = await getCompany(slug)

  if (!company || !company.publicPageEnabled) notFound()

  const photos = await getGalleryPhotos(company.id)
  const heroPhoto = photos[0] ? `${GCS}/${photos[0].key}` : null
  const galleryPhotos = photos.slice(1)

  const cityState = [company.city, company.state].filter(Boolean).join(", ")

  // JSON-LD LocalBusiness structured data
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: company.name,
    description:
      company.publicPageAbout
      ?? `${company.name} provides professional pool cleaning, maintenance, and repair services${company.serviceArea ? ` in ${company.serviceArea}` : ""}.`,
    url: `${BASE}/pro/${slug}`,
    ...(company.phone ? { telephone: company.phone } : {}),
    ...(company.website ? { sameAs: [company.website] } : {}),
    ...(company.address
      ? {
          address: {
            "@type": "PostalAddress",
            streetAddress: company.address,
            ...(company.city  ? { addressLocality: company.city }  : {}),
            ...(company.state ? { addressRegion: company.state }   : {}),
            ...(company.zip   ? { postalCode: company.zip }        : {}),
            addressCountry: "US",
          },
        }
      : {}),
    ...(company.serviceArea ? { areaServed: company.serviceArea } : {}),
    ...(heroPhoto ? { image: heroPhoto } : {}),
    ...(company.logoUrl ? { logo: company.logoUrl } : {}),
  }

  return (
    <>
      {/* JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="min-h-screen bg-white">
        {/* ── Hero ── */}
        <div className="relative h-[60vh] min-h-[380px] max-h-[560px] overflow-hidden bg-sky-900">
          {heroPhoto ? (
            <img
              src={heroPhoto}
              alt={`${company.name} pool work`}
              className="absolute inset-0 w-full h-full object-cover"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-sky-800 via-sky-700 to-cyan-600" />
          )}
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-sky-950/80 via-sky-900/40 to-transparent" />

          {/* Logo + nav */}
          <div className="absolute top-0 left-0 right-0 px-6 py-5 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2 opacity-80 hover:opacity-100 transition-opacity">
              <div className="w-6 h-6 rounded-md bg-white/20 flex items-center justify-center backdrop-blur-sm">
                <Waves className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="text-white text-sm font-semibold tracking-tight">PoolOS</span>
            </Link>
          </div>

          {/* Company identity */}
          <div className="absolute bottom-0 left-0 right-0 px-6 sm:px-10 pb-10">
            {company.logoUrl && (
              <img
                src={company.logoUrl}
                alt={`${company.name} logo`}
                className="h-14 object-contain mb-4 drop-shadow-lg"
              />
            )}
            <h1 className="text-3xl sm:text-5xl font-extrabold text-white leading-tight drop-shadow-md">
              {company.name}
            </h1>
            {company.publicPageTagline && (
              <p className="mt-2 text-sky-200 text-base sm:text-xl font-medium drop-shadow">
                {company.publicPageTagline}
              </p>
            )}
            {cityState && (
              <div className="mt-3 flex items-center gap-1.5 text-sky-300 text-sm">
                <MapPin className="w-4 h-4 shrink-0" />
                <span>{cityState}</span>
              </div>
            )}
          </div>
        </div>

        {/* ── Body ── */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">

          {/* Contact strip */}
          {(company.phone || company.website || company.serviceArea) && (
            <div className="flex flex-wrap gap-4">
              {company.phone && (
                <a
                  href={`tel:${company.phone.replace(/\D/g, "")}`}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-sky-600 text-white text-sm font-semibold hover:bg-sky-700 transition-colors shadow"
                >
                  <Phone className="w-4 h-4" />
                  {company.phone}
                </a>
              )}
              {company.website && (
                <a
                  href={company.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-gray-200 text-gray-700 text-sm font-semibold hover:border-sky-400 hover:text-sky-600 transition-colors"
                >
                  <Globe className="w-4 h-4" />
                  Website
                </a>
              )}
              {company.serviceArea && (
                <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-amber-50 text-amber-800 text-sm font-medium border border-amber-200">
                  <MapPin className="w-4 h-4" />
                  {company.serviceArea}
                </div>
              )}
            </div>
          )}

          {/* About */}
          {company.publicPageAbout && (
            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-3">About Us</h2>
              <p className="text-gray-600 leading-relaxed text-base whitespace-pre-line">
                {company.publicPageAbout}
              </p>
            </section>
          )}

          {/* Services */}
          {company.jobTemplates.length > 0 && (
            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-4">Services We Offer</h2>
              <div className="grid sm:grid-cols-2 gap-3">
                {company.jobTemplates.map((t) => (
                  <div
                    key={t.name}
                    className="flex items-start gap-3 p-4 rounded-xl border border-gray-100 bg-gray-50 hover:border-sky-200 hover:bg-sky-50/40 transition-colors"
                  >
                    <CheckCircle2 className="w-5 h-5 text-sky-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-gray-800">{t.name}</p>
                      {t.description && (
                        <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{t.description}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Gallery */}
          {galleryPhotos.length > 0 && (
            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-4">Our Work</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {galleryPhotos.map((photo) => (
                  <a
                    key={photo.id}
                    href={`${GCS}/${photo.key}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="aspect-square overflow-hidden rounded-xl border border-gray-100 hover:border-sky-300 transition-colors block"
                  >
                    <img
                      src={`${GCS}/${photo.key}`}
                      alt={photo.filename}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                    />
                  </a>
                ))}
              </div>
            </section>
          )}

          {/* CTA */}
          {company.phone && (
            <section className="rounded-2xl bg-gradient-to-br from-sky-600 to-cyan-500 p-8 text-center shadow-lg">
              <h2 className="text-2xl font-bold text-white mb-2">Ready for crystal-clear water?</h2>
              <p className="text-sky-100 mb-6 text-sm">
                {company.serviceArea
                  ? `Serving ${company.serviceArea}.`
                  : "Get in touch today for a free quote."}
              </p>
              <a
                href={`tel:${company.phone.replace(/\D/g, "")}`}
                className="inline-flex items-center gap-2 px-8 py-3 rounded-full bg-white text-sky-700 font-bold text-sm hover:bg-sky-50 transition-colors shadow"
              >
                <Phone className="w-4 h-4" />
                Call {company.phone}
              </a>
            </section>
          )}
        </div>

        {/* ── Footer ── */}
        <div className="border-t border-gray-100 py-6 text-center">
          <p className="text-xs text-gray-400">
            Managed with{" "}
            <Link href="/" className="text-sky-500 hover:underline font-medium">
              PoolOS
            </Link>
            {" "}— Pool Service Management Software
          </p>
        </div>
      </div>
    </>
  )
}
