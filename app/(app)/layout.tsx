import { auth } from "@/auth"
import { cookies } from "next/headers"
import { db } from "@/lib/db"
import AppShell from "@/components/layout/AppShell"
import PlanGate from "@/components/app/PlanGate"

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  let viewAsCompany: string | undefined

  const session = await auth()
  const isAdmin = session?.user?.email === process.env.SUPER_ADMIN_EMAIL

  const cookieStore = await cookies()

  if (isAdmin) {
    const viewAs = cookieStore.get("poolos_view_as")?.value
    if (viewAs) {
      const company = await db.company.findUnique({ where: { id: viewAs }, select: { name: true } })
      viewAsCompany = company?.name
    }
  }

  // Fetch plan status for the current company (skip for super admin without view-as)
  let planData = { plan: "trial", trialEndsAt: null as string | null, stripeSubStatus: null as string | null }

  const companyId = session?.user?.companyId
  if (companyId) {
    const company = await db.company.findUnique({
      where: { id: companyId },
      select: { plan: true, trialEndsAt: true, stripeSubStatus: true },
    })
    if (company) {
      planData = {
        plan:            company.plan ?? "trial",
        trialEndsAt:     company.trialEndsAt?.toISOString() ?? null,
        stripeSubStatus: company.stripeSubStatus ?? null,
      }
    }
  }

  return (
    <AppShell viewAsCompany={viewAsCompany} planData={planData}>
      <PlanGate planData={planData}>
        {children}
      </PlanGate>
    </AppShell>
  )
}
