import { db } from "@/lib/db"
import { requirePermission } from "@/lib/session"
import Card, { CardHeader, CardBody } from "@/components/ui/Card"
import Button from "@/components/ui/Button"
import { getPlan } from "@/lib/plans"
import { getPlansFromDb } from "@/lib/plans-db"
import { formatDate } from "@/lib/utils"
import { CheckCircle2, AlertTriangle, CreditCard, ExternalLink } from "lucide-react"
import BillingUpgrade from "@/components/settings/BillingUpgrade"
import { createPortalSession } from "@/lib/actions/billing"

export const dynamic = "force-dynamic"

const STATUS_LABEL: Record<string, { label: string; cls: string }> = {
  active:   { label: "Active",      cls: "bg-green-100 text-green-700" },
  trialing: { label: "Trialing",    cls: "bg-blue-100 text-blue-700" },
  past_due: { label: "Payment due", cls: "bg-amber-100 text-amber-700" },
  canceled: { label: "Canceled",    cls: "bg-gray-100 text-gray-500" },
  unpaid:   { label: "Unpaid",      cls: "bg-red-100 text-red-700" },
}

export default async function BillingPage({
  searchParams,
}: {
  searchParams: Promise<{ upgraded?: string; canceled?: string }>
}) {
  const { companyId } = await requirePermission("settings.billing")
  const sp = await searchParams

  const [allPlans, company] = await Promise.all([
    getPlansFromDb(),
    db.company.findUnique({
      where: { id: companyId },
      select: {
        plan:                 true,
        trialEndsAt:          true,
        stripeSubId:          true,
        stripeSubStatus:      true,
        stripePlatformCustId: true,
      },
    }),
  ])
  if (!company) return null

  const paidPlans = allPlans.filter((p) => p.id !== "trial")

  const currentPlan    = getPlan(company.plan)
  const isTrial        = company.plan === "trial"
  const isSubscribed   = !!company.stripeSubId && company.stripeSubStatus === "active"
  const isPastDue      = company.stripeSubStatus === "past_due"
  const trialDaysLeft  = company.trialEndsAt
    // eslint-disable-next-line react-hooks/purity
    ? Math.ceil((new Date(company.trialEndsAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null
  const trialExpired   = isTrial && trialDaysLeft !== null && trialDaysLeft <= 0

  const subStatus = company.stripeSubStatus
    ? STATUS_LABEL[company.stripeSubStatus] ?? { label: company.stripeSubStatus, cls: "bg-gray-100 text-gray-500" }
    : null

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Billing</h1>
        <p className="text-sm text-gray-500 mt-1">Manage your PoolOS subscription.</p>
      </div>

      {sp.upgraded && (
        <div className="flex items-center gap-2 rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-800">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-green-600" />
          Your subscription is active — welcome to {currentPlan.label}!
        </div>
      )}

      {/* Current plan */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-gray-900 text-sm flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-gray-400" />
              Current plan
            </h2>
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${currentPlan.badge}`}>
              {currentPlan.label}
            </span>
          </div>
        </CardHeader>
        <CardBody className="space-y-3">
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
            <div>
              <p className="text-xs text-gray-400 mb-0.5">Plan</p>
              <p className="font-medium text-gray-900">{currentPlan.label}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-0.5">Price</p>
              <p className="font-medium text-gray-900">
                {currentPlan.priceMonthly != null ? `$${currentPlan.priceMonthly}/mo` : "Free trial"}
              </p>
            </div>
            {isTrial && company.trialEndsAt && (
              <div>
                <p className="text-xs text-gray-400 mb-0.5">Trial ends</p>
                <p className={`font-medium ${trialExpired ? "text-red-600" : trialDaysLeft != null && trialDaysLeft <= 7 ? "text-amber-600" : "text-gray-900"}`}>
                  {trialExpired
                    ? "Expired"
                    : trialDaysLeft === 0
                    ? "Expires today"
                    : `${trialDaysLeft} days left (${formatDate(company.trialEndsAt)})`}
                </p>
              </div>
            )}
            {subStatus && (
              <div>
                <p className="text-xs text-gray-400 mb-0.5">Status</p>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${subStatus.cls}`}>
                  {subStatus.label}
                </span>
              </div>
            )}
          </div>

          {isPastDue && (
            <div className="flex items-start gap-2 rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-500" />
              <span>
                Your last payment failed. Update your payment method to avoid losing access.
              </span>
            </div>
          )}

          {/* Manage subscription via Stripe portal */}
          {company.stripePlatformCustId && (
            <form action={createPortalSession}>
              <Button type="submit" variant="secondary" size="sm">
                <ExternalLink className="w-4 h-4" />
                Manage billing &amp; invoices
              </Button>
            </form>
          )}
        </CardBody>
      </Card>

      {/* Upgrade options — shown when on trial or when subscription isn't active */}
      {!isSubscribed && (
        <Card>
          <CardHeader>
            <h2 className="font-semibold text-gray-900 text-sm">
              {trialExpired ? "Choose a plan to restore access" : "Upgrade your plan"}
            </h2>
          </CardHeader>
          <CardBody>
            <BillingUpgrade plans={paidPlans} />
          </CardBody>
        </Card>
      )}

      <p className="text-xs text-gray-400">
        Payments are processed securely by Stripe. You can cancel or change your plan at any time from the billing portal.
        Questions? Email <a href="mailto:billing@poolos.biz" className="underline hover:text-gray-600">billing@poolos.biz</a>.
      </p>
    </div>
  )
}
