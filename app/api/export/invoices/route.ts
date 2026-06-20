import { requireSession } from "@/lib/session"
import { db } from "@/lib/db"
import { toCsv, csvResponse } from "@/lib/csv"
import { invoiceTotal, paymentTotal } from "@/lib/utils"

export async function GET(req: Request) {
  const { companyId } = await requireSession()
  const { searchParams } = new URL(req.url)
  const status = searchParams.get("status") || undefined
  const from = searchParams.get("from")
  const to = searchParams.get("to")

  const invoices = await db.invoice.findMany({
    where: {
      companyId,
      ...(status && status !== "all" ? { status } : {}),
      ...(from || to
        ? {
            issuedAt: {
              ...(from ? { gte: new Date(from) } : {}),
              ...(to ? { lte: new Date(to + "T23:59:59") } : {}),
            },
          }
        : {}),
    },
    orderBy: { issuedAt: "desc" },
    include: { customer: true, items: true, payments: true },
  })

  const rows = invoices.map((inv) => {
    const total = invoiceTotal(inv.items)
    const paid = paymentTotal(inv.payments)
    return {
      "Invoice #": inv.invoiceNumber,
      "Customer": `${inv.customer.firstName} ${inv.customer.lastName}`,
      "Email": inv.customer.email ?? "",
      "Issued": inv.issuedAt.toISOString().split("T")[0],
      "Due": inv.dueDate.toISOString().split("T")[0],
      "Service Type": inv.serviceType ?? "",
      "Status": inv.status,
      "Total": total.toFixed(2),
      "Paid": paid.toFixed(2),
      "Balance": Math.max(0, total - paid).toFixed(2),
      "Notes": inv.notes ?? "",
    }
  })

  return csvResponse(`invoices-${new Date().toISOString().split("T")[0]}.csv`, toCsv(rows))
}
