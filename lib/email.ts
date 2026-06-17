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
  customMessage?: string | null
}

interface ReceiptEmailData {
  invoiceNumber: string
  companyName: string
  companyLogoUrl?: string | null
  customerFirstName: string
  paymentAmount: number
  paymentMethod?: string | null
  paymentDate: Date
  balanceRemaining: number
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

  const reminderBanner = isReminder
    ? `<div style="background:#fef3c7;border:1px solid #fde68a;border-radius:8px;padding:12px 16px;margin-bottom:24px;color:#92400e;font-size:14px">
        <strong>Friendly reminder:</strong> This invoice is due ${fmtDate(inv.dueDate)}. Please arrange payment at your earliest convenience.
      </div>`
    : ""

  const customMessageBlock = inv.customMessage
    ? `<div style="background:#f0f9ff;border:1px solid #bae6fd;border-radius:8px;padding:12px 16px;margin-bottom:24px;color:#0369a1;font-size:14px;white-space:pre-line">${inv.customMessage}</div>`
    : ""

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f9fafb;margin:0;padding:24px">
  <div style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,.1)">

    <!-- Header: white background with logo/name + invoice number -->
    <table width="100%" cellpadding="0" cellspacing="0" style="border-bottom:4px solid #0c4a6e">
      <tr>
        <td style="padding:24px 32px;vertical-align:middle">
          ${inv.companyLogoUrl
            ? `<img src="${inv.companyLogoUrl}" alt="${inv.companyName}" style="max-height:56px;max-width:200px;display:block" />`
            : `<span style="font-size:22px;font-weight:700;color:#0c4a6e">${inv.companyName}</span>`}
        </td>
        <td style="padding:24px 32px;text-align:right;vertical-align:middle">
          <div style="font-size:10px;text-transform:uppercase;letter-spacing:.1em;color:#9ca3af">Invoice</div>
          <div style="font-size:20px;font-weight:700;color:#111827;margin-top:2px">${inv.invoiceNumber}</div>
          <div style="font-size:12px;color:#6b7280;margin-top:4px">Due ${fmtDate(inv.dueDate)}</div>
        </td>
      </tr>
    </table>

    <div style="padding:32px">
      ${reminderBanner}
      ${customMessageBlock}

      <!-- From + Bill To -->
      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px">
        <tr>
          <td style="vertical-align:top;width:50%;padding-right:16px">
            <div style="font-size:10px;text-transform:uppercase;letter-spacing:.1em;color:#9ca3af;margin-bottom:6px">From</div>
            <div style="font-weight:600;font-size:14px;color:#111827">${inv.companyName}</div>
            ${inv.companyAddress ? `<div style="font-size:13px;color:#6b7280;margin-top:2px">${inv.companyAddress}</div>` : ""}
            ${inv.companyCity ? `<div style="font-size:13px;color:#6b7280">${inv.companyCity}, ${inv.companyState ?? ""} ${inv.companyZip ?? ""}</div>` : ""}
            ${inv.companyPhone ? `<div style="font-size:13px;color:#6b7280">${inv.companyPhone}</div>` : ""}
          </td>
          <td style="vertical-align:top;width:50%;padding-left:16px">
            <div style="font-size:10px;text-transform:uppercase;letter-spacing:.1em;color:#9ca3af;margin-bottom:6px">Bill To</div>
            <div style="font-weight:600;font-size:14px;color:#111827">${inv.customerFirstName} ${inv.customerLastName}</div>
            <div style="font-size:13px;color:#6b7280;margin-top:2px">${inv.customerAddress}</div>
            <div style="font-size:13px;color:#6b7280">${inv.customerCity}, ${inv.customerState} ${inv.customerZip}</div>
          </td>
        </tr>
      </table>

      <!-- Issued date -->
      <div style="font-size:12px;color:#9ca3af;margin-bottom:20px">Issued ${fmtDate(inv.issuedAt)}</div>

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

export function buildReceiptHtml(data: ReceiptEmailData): string {
  const isPaidInFull = data.balanceRemaining <= 0

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <style>
    @media only screen and (max-width:620px) {
      .receipt-header-right { padding: 16px 16px 16px 8px !important; }
      .receipt-header-left  { padding: 16px !important; }
      .receipt-body         { padding: 20px 16px !important; }
      .receipt-amount       { font-size: 24px !important; }
      .receipt-footer       { padding: 16px !important; }
    }
  </style>
</head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f9fafb;margin:0;padding:12px 8px">
  <div style="max-width:600px;width:100%;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,.1)">

    <!-- Header -->
    <table width="100%" cellpadding="0" cellspacing="0" style="border-bottom:4px solid #16a34a;table-layout:fixed">
      <tr>
        <td class="receipt-header-left" style="padding:20px 16px 20px 24px;vertical-align:middle;width:55%">
          ${data.companyLogoUrl
            ? `<img src="${data.companyLogoUrl}" alt="${data.companyName}" style="max-height:48px;max-width:160px;width:auto;display:block" />`
            : `<span style="font-size:18px;font-weight:700;color:#16a34a;word-break:break-word">${data.companyName}</span>`}
        </td>
        <td class="receipt-header-right" style="padding:20px 24px 20px 8px;text-align:right;vertical-align:middle;width:45%">
          <div style="font-size:10px;text-transform:uppercase;letter-spacing:.1em;color:#9ca3af;white-space:nowrap">Payment Receipt</div>
          <div style="font-size:16px;font-weight:700;color:#111827;margin-top:2px;word-break:break-all">${data.invoiceNumber}</div>
          <div style="font-size:12px;color:#6b7280;margin-top:4px;white-space:nowrap">${fmtDate(data.paymentDate)}</div>
        </td>
      </tr>
    </table>

    <div class="receipt-body" style="padding:24px">
      <p style="font-size:15px;color:#374151;margin:0 0 20px">Hi ${data.customerFirstName},</p>

      <!-- Payment confirmation box -->
      <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:16px;margin-bottom:20px;text-align:center">
        <div style="font-size:12px;text-transform:uppercase;letter-spacing:.08em;color:#16a34a;margin-bottom:4px">Payment Received</div>
        <div class="receipt-amount" style="font-size:28px;font-weight:700;color:#15803d;word-break:break-word">${fmt(data.paymentAmount)}</div>
        ${data.paymentMethod ? `<div style="font-size:13px;color:#4ade80;margin-top:4px">via ${data.paymentMethod}</div>` : ""}
      </div>

      <!-- Summary -->
      <table style="width:100%;border-collapse:collapse;margin-bottom:20px;table-layout:fixed">
        <tr style="border-bottom:1px solid #f3f4f6">
          <td style="padding:10px 8px 10px 0;font-size:14px;color:#6b7280;width:55%">Invoice</td>
          <td style="padding:10px 0 10px 8px;font-size:14px;font-weight:600;color:#111827;text-align:right;word-break:break-word;width:45%">${data.invoiceNumber}</td>
        </tr>
        <tr style="border-bottom:1px solid #f3f4f6">
          <td style="padding:10px 8px 10px 0;font-size:14px;color:#6b7280;width:55%">Amount paid</td>
          <td style="padding:10px 0 10px 8px;font-size:14px;font-weight:600;color:#16a34a;text-align:right;word-break:break-word;width:45%">${fmt(data.paymentAmount)}</td>
        </tr>
        <tr>
          <td style="padding:10px 8px 10px 0;font-size:14px;color:#6b7280;width:55%">Remaining balance</td>
          <td style="padding:10px 0 10px 8px;font-size:14px;font-weight:700;color:${isPaidInFull ? "#16a34a" : "#111827"};text-align:right;word-break:break-word;width:45%">
            ${isPaidInFull ? "Paid in full" : fmt(data.balanceRemaining)}
          </td>
        </tr>
      </table>

      <p style="font-size:14px;color:#6b7280;margin:0">Please contact us if you have any questions.</p>
    </div>

    <!-- Footer -->
    <div class="receipt-footer" style="background:#f9fafb;border-top:1px solid #f3f4f6;padding:16px 24px;text-align:center;font-size:12px;color:#9ca3af">
      Thank you for your business · ${data.companyName} · Powered by PoolOS
    </div>
  </div>
</body>
</html>`
}
