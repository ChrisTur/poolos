import { db } from "@/lib/db"
import { requireSession } from "@/lib/session"
import BroadcastCompose from "@/components/messages/BroadcastCompose"
import UpsellCampaign from "@/components/messages/UpsellCampaign"
import MessagesNav from "@/components/messages/MessagesNav"

export const dynamic = "force-dynamic"

export default async function MessagesPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>
}) {
  const { companyId } = await requireSession()
  const { tab = "broadcast" } = await searchParams

  const [customers, tags, templates, customersWithVisits] = await Promise.all([
    db.customer.findMany({
      where: { companyId },
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        status: true,
        tags: { select: { tag: { select: { id: true } } } },
      },
    }),
    db.tag.findMany({ where: { companyId }, orderBy: { name: "asc" } }),
    db.jobTemplate.findMany({
      where: { companyId, isActive: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    db.customer.findMany({
      where: { companyId, status: "active" },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        serviceVisits: {
          orderBy: { visitedAt: "desc" },
          take: 1,
          select: { visitedAt: true },
        },
      },
    }),
  ])

  const customersForUpsell = customersWithVisits.map((c) => ({
    id:          c.id,
    firstName:   c.firstName,
    lastName:    c.lastName,
    email:       c.email,
    lastVisitAt: c.serviceVisits[0]?.visitedAt ?? null,
  }))

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Messages</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          {tab === "upsell"
            ? "Target customers who haven't been serviced recently with a pre-written upsell email."
            : "Send an email to all or a filtered group of customers. Your company logo is included automatically."}
        </p>
      </div>

      <MessagesNav activeTab={tab} />

      {tab === "upsell" ? (
        <UpsellCampaign customers={customersForUpsell} templates={templates} />
      ) : (
        <BroadcastCompose customers={customers} tags={tags} />
      )}
    </div>
  )
}
