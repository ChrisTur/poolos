import { Resend } from "resend"

export const resend = new Resend(process.env.RESEND_API_KEY)
export const FROM = process.env.EMAIL_FROM ?? "PoolOS <noreply@poolos.app>"

interface InvoiceEmailData {
  invoiceNumber: string
  issuedAt: Date
  dueDate: Date
  companyName: string
  companyAddress?: string | null
  companyCity?: string | null
  companyState?: string | null
  companyZip?: string | null
  companyPhone?: string | null
  companyLogoUrl?: string | null
  customerFirstName: string
  customerLastName: string
  customerAddress: string
  customerCity: string
  customerState: string
  customerZip: string
  customerEmail: string
  items: { description: string; quantity: number; unitPrice: number }[]
  payments: { amount: number }[]
  notes?: string | null
}

function fmt(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n)
}
function fmtDate(d: Date) {
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
}

export function buildInvoiceHtml(inv: InvoiceEmailData, isReminder = false): string {
  const total = inv.items.reduce((s, i) => s + i.quantity * i.unitPrice, 0)
  const paid  = inv.payments.reduce((s, p) => s + p.amount, 0)
  const balance = total - paid

  const rows = inv.items
    .map(
      (i) => `
      <tr>
        <td style="padding:8px 12px;border-bottom:1px solid #f3f4f6;color:#374151">${i.description}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #f3f4f6;color:#6b7280;text-align:center">${i.quantity}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #f3f4f6;color:#6b7280;text-align:right">${fmt(i.unitPrice)}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #f3f4f6;font-weight:600;text-align:right">${fmt(i.quantity * i.unitPrice)}</td>
      </tr>`
    )
    .join("")

  const logo = inv.companyLogoUrl
    ? `<img src="${inv.companyLogoUrl}" alt="${inv.companyName}" style="max-height:48px;max-width:160px;object-fit:contain;margin-bottom:8px" />`
    : ""

  const reminderBanner = isReminder
    ? `<div style="background:#fef3c7;border:1px solid #fde68a;border-radius:8px;padding:12px 16px;margin-bottom:24px;color:#92400e;font-size:14px">
        <strong>Friendly reminder:</strong> This invoice is due ${fmtDate(inv.dueDate)}. Please arrange payment at your earliest convenience.
      </div>`
    : ""

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f9fafb;margin:0;padding:24px">
  <div style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,.1)">

    <!-- Header: company branding -->
    <div style="background:#0c4a6e;padding:20px 32px;color:#fff;display:flex;align-items:center;gap:16px">
      ${inv.companyLogoUrl
        ? `<img src="${inv.companyLogoUrl}" alt="${inv.companyName}" style="height:40px;object-fit:contain;background:#fff;border-radius:4px;padding:4px" />`
        : ""}
      <div>
        <div style="font-size:20px;font-weight:700">${inv.companyName}</div>
        ${inv.companyCity ? `<div style="font-size:12px;color:#bae6fd;margin-top:2px">${inv.companyCity}, ${inv.companyState ?? ""}</div>` : ""}
      </div>
    </div>

    <div style="padding:32px">
      ${reminderBanner}

      <!-- Invoice meta -->
      <div style="display:flex;justify-content:space-between;margin-bottom:32px;gap:16px;flex-wrap:wrap">
        <div>
          <div style="font-size:11px;text-transform:uppercase;letter-spacing:.08em;color:#9ca3af;margin-bottom:6px">From</div>
          <div style="font-weight:600;font-size:14px;color:#111827">${inv.companyName}</div>
          ${inv.companyAddress ? `<div style="font-size:13px;color:#6b7280">${inv.companyAddress}</div>` : ""}
          ${inv.companyCity ? `<div style="font-size:13px;color:#6b7280">${inv.companyCity}, ${inv.companyState ?? ""} ${inv.companyZip ?? ""}</div>` : ""}
          ${inv.companyPhone ? `<div style="font-size:13px;color:#6b7280">${inv.companyPhone}</div>` : ""}
        </div>
        <div style="text-align:right">
          <div style="font-size:20px;font-weight:700;color:#111827">${inv.invoiceNumber}</div>
          <div style="font-size:13px;color:#6b7280;margin-top:4px">Issued ${fmtDate(inv.issuedAt)}</div>
          <div style="font-size:13px;color:#6b7280">Due ${fmtDate(inv.dueDate)}</div>
        </div>
      </div>

      <!-- Bill to -->
      <div style="margin-bottom:24px">
        <div style="font-size:11px;text-transform:uppercase;letter-spacing:.08em;color:#9ca3af;margin-bottom:6px">Bill To</div>
        <div style="font-weight:600;color:#111827">${inv.customerFirstName} ${inv.customerLastName}</div>
        <div style="font-size:13px;color:#6b7280">${inv.customerAddress}</div>
        <div style="font-size:13px;color:#6b7280">${inv.customerCity}, ${inv.customerState} ${inv.customerZip}</div>
      </div>

      <!-- Line items -->
      <table style="width:100%;border-collapse:collapse;margin-bottom:16px">
        <thead>
          <tr style="border-bottom:2px solid #e5e7eb">
            <th style="padding:8px 12px;text-align:left;font-size:11px;text-transform:uppercase;letter-spacing:.08em;color:#9ca3af;font-weight:600">Description</th>
            <th style="padding:8px 12px;text-align:center;font-size:11px;text-transform:uppercase;letter-spacing:.08em;color:#9ca3af;font-weight:600">Qty</th>
            <th style="padding:8px 12px;text-align:right;font-size:11px;text-transform:uppercase;letter-spacing:.08em;color:#9ca3af;font-weight:600">Unit</th>
            <th style="padding:8px 12px;text-align:right;font-size:11px;text-transform:uppercase;letter-spacing:.08em;color:#9ca3af;font-weight:600">Total</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
        <tfoot>
          <tr>
            <td colspan="3" style="padding:12px 12px 4px;text-align:right;font-weight:600;color:#374151">Total</td>
            <td style="padding:12px 12px 4px;text-align:right;font-size:18px;font-weight:700;color:#111827">${fmt(total)}</td>
          </tr>
          ${paid > 0 ? `
          <tr>
            <td colspan="3" style="padding:4px 12px;text-align:right;color:#6b7280">Paid</td>
            <td style="padding:4px 12px;text-align:right;color:#16a34a">−${fmt(paid)}</td>
          </tr>
          <tr>
            <td colspan="3" style="padding:4px 12px;text-align:right;font-weight:600;color:#374151">Balance Due</td>
            <td style="padding:4px 12px;text-align:right;font-weight:700;color:#111827">${fmt(balance)}</td>
          </tr>` : ""}
        </tfoot>
      </table>

      ${inv.notes ? `<div style="background:#f9fafb;border-radius:8px;padding:12px 16px;font-size:13px;color:#6b7280;margin-bottom:24px">${inv.notes}</div>` : ""}

      <!-- CTA -->
      <div style="background:#f0f9ff;border:1px solid #bae6fd;border-radius:8px;padding:16px;text-align:center;margin-top:8px">
        <div style="font-size:14px;font-weight:600;color:#0369a1;margin-bottom:4px">Amount Due: ${fmt(balance > 0 ? balance : total)}</div>
        <div style="font-size:13px;color:#0284c7">Please contact us with any questions about this invoice.</div>
      </div>
    </div>

    <!-- Footer -->
    <div style="background:#f9fafb;border-top:1px solid #f3f4f6;padding:16px 32px;text-align:center;font-size:12px;color:#9ca3af">
      Thank you for your business · ${inv.companyName} · Powered by PoolOS
    </div>
  </div>
</body>
</html>`
}
