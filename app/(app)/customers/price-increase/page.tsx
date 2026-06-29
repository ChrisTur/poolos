import { db } from "@/lib/db"
import { requirePermission } from "@/lib/session"
import Link from "next/link"
import { ChevronLeft } from "lucide-react"
import PriceIncreaseWizard from "./PriceIncreaseWizard"

export const dynamic = "force-dynamic"
export const metadata = { title: "Price Increase Wizard — PoolOS" }

export default async function PriceIncreasePage() {
  const { companyId } = await requirePermission("customers.edit")

  const [customers, routes, tags] = await Promise.all([
    db.customer.findMany({
      where: { companyId, status: "active", monthlyRate: { not: null } },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        monthlyRate: true,
        routeStops: {
          take: 1,
          select: { route: { select: { id: true, name: true } } },
        },
        tags: { select: { tag: { select: { id: true, name: true } } } },
      },
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    }),
    db.route.findMany({
      where: { companyId, isActive: true },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    db.tag.findMany({
      where: { companyId },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ])

  const serializedCustomers = customers.map((c) => ({
    id: c.id,
    firstName: c.firstName,
    lastName: c.lastName,
    email: c.email,
    monthlyRate: c.monthlyRate!,
    routeId: c.routeStops[0]?.route?.id ?? null,
    routeName: c.routeStops[0]?.route?.name ?? null,
    tagIds: c.tags.map((t) => t.tag.id),
  }))

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <Link href="/customers" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900 mb-3">
          <ChevronLeft className="w-4 h-4" /> Customers
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Price Increase Wizard</h1>
        <p className="text-sm text-gray-500 mt-1">
          Filter customers, set a new rate, preview changes, and optionally notify everyone in one click.
        </p>
      </div>

      <PriceIncreaseWizard customers={serializedCustomers} routes={routes} tags={tags} />
    </div>
  )
}
