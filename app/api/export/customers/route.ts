import { requireSession } from "@/lib/session"
import { db } from "@/lib/db"
import { toCsv, csvResponse } from "@/lib/csv"

export async function GET(req: Request) {
  const { companyId } = await requireSession()
  const { searchParams } = new URL(req.url)
  const status = searchParams.get("status") || undefined

  const customers = await db.customer.findMany({
    where: {
      companyId,
      ...(status && status !== "all" ? { status } : {}),
    },
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
  })

  const rows = customers.map((c) => ({
    "First Name": c.firstName,
    "Last Name": c.lastName,
    "Email": c.email ?? "",
    "Phone": c.phone ?? "",
    "Address": c.address,
    "City": c.city,
    "State": c.state,
    "Zip": c.zip,
    "Pool Type": c.poolType ?? "",
    "Pool Size": c.poolSize ?? "",
    "Monthly Rate": c.monthlyRate?.toFixed(2) ?? "",
    "Status": c.status,
  }))

  return csvResponse(`customers-${new Date().toISOString().split("T")[0]}.csv`, toCsv(rows))
}
