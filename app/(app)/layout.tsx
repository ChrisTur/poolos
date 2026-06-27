import { getSession } from "@/lib/auth"
import { cookies } from "next/headers"
import { db } from "@/lib/db"
import AppShell from "@/components/layout/AppShell"
import PlanGate from "@/components/app/PlanGate"
import { getActiveBanner, type BannerData } from "@/lib/banners"
import { getCompanyNotifications, type AppNotification } from "@/lib/notifications"
import { PERMISSIONS } from "@/lib/permissions"

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  let viewAsCompany: string | undefined

  const session = await getSession()
  const isAdmin = session?.role === "super_admin"

  const cookieStore = await cookies()

  if (isAdmin) {
    const viewAs = cookieStore.get("poolos_view_as")?.value
    if (viewAs) {
      const company = await db.company.findUnique({ where: { id: viewAs }, select: { name: true } })
      viewAsCompany = company?.name
    }
  }

  let planData = { plan: "trial", trialEndsAt: null as string | null, stripeSubStatus: null as string | null }
  let appBanner: BannerData | null = null
  let notifications: AppNotification[] = []

  const companyId = session?.companyId
  if (companyId) {
    const [company, fetchedNotifications] = await Promise.all([
      db.company.findUnique({
        where:  { id: companyId },
        select: { plan: true, trialEndsAt: true, stripeSubStatus: true },
      }),
      getCompanyNotifications(companyId),
    ])
    notifications = fetchedNotifications
    if (company) {
      planData = {
        plan:            company.plan ?? "trial",
        trialEndsAt:     company.trialEndsAt?.toISOString() ?? null,
        stripeSubStatus: company.stripeSubStatus ?? null,
      }
      if (planData.plan === "trial") {
        const raw = await getActiveBanner("app")
        if (raw) appBanner = { id: raw.id, message: raw.message, code: raw.code, bgColor: raw.bgColor, dismissible: raw.dismissible }
      }
    }
  }

  const userName  = session?.name  ?? session?.email ?? ""
  const userEmail = session?.email ?? ""
  const userRole  = session?.role ?? "owner"

  // Resolve permissions for sidebar filtering
  // Super admin gets all permissions (they're in view-as mode at this point or browsing freely)
  let userPermissions: string[]
  if (!session || session.role === "super_admin") {
    userPermissions = Object.keys(PERMISSIONS)
  } else {
    const role = await db.role.findUnique({
      where:  { name: session.role },
      select: { permissions: true },
    })
    userPermissions = role?.permissions ?? []
  }

  return (
    <AppShell viewAsCompany={viewAsCompany} planData={planData} appBanner={appBanner} userName={userName} userEmail={userEmail} userRole={userRole} userPermissions={userPermissions} notifications={notifications}>
      <PlanGate planData={planData}>
        {children}
      </PlanGate>
    </AppShell>
  )
}
