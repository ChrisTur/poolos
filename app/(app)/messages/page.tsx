import { db } from "@/lib/db"
import { requireSession } from "@/lib/session"
import BroadcastCompose from "@/components/messages/BroadcastCompose"

export const dynamic = "force-dynamic"

export default async function MessagesPage() {
  const { companyId } = await requireSession()

  const [customers, tags] = await Promise.all([
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
  ])

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Messages</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Send an email to all or a filtered group of customers. Your company logo is included automatically.
        </p>
      </div>
      <BroadcastCompose customers={customers} tags={tags} />
    </div>
  )
}
