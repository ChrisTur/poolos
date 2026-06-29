import { Resend } from "resend"

export const resend = new Resend(process.env.RESEND_API_KEY)
export const FROM = process.env.EMAIL_FROM ?? "PoolOS <billing@poolos.biz>"

interface PaymentLinks {
  venmoHandle?: string | null
  paypalHandle?: string | null
  cashAppHandle?: string | null
  zellePhone?: string | null
  zelleEmail?: string | null
}

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
  paymentLinks?: PaymentLinks | null
  payToken?: string | null           // public pay link token
  stripeConnected?: boolean          // whether this company has Stripe set up
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

function buildPaymentButtonsHtml(links: PaymentLinks, amount: number, invoiceNumber: string): string {
  const note = encodeURIComponent(invoiceNumber)
  const amt = amount.toFixed(2)

  const buttons: string[] = []

  if (links.venmoHandle) {
    const url = `https://venmo.com/${links.venmoHandle}?txn=pay&amount=${amt}&note=${note}`
    buttons.push(
      `<a href="${url}" style="display:inline-block;margin:4px;padding:10px 18px;border-radius:8px;font-size:13px;font-weight:600;text-decoration:none;color:#ffffff;background:#3D95CE">Pay with Venmo</a>`
    )
  }

  if (links.paypalHandle) {
    const url = `https://paypal.me/${links.paypalHandle}/${amt}`
    buttons.push(
      `<a href="${url}" style="display:inline-block;margin:4px;padding:10px 18px;border-radius:8px;font-size:13px;font-weight:600;text-decoration:none;color:#ffffff;background:#009CDE">Pay with PayPal</a>`
    )
  }

  if (links.cashAppHandle) {
    const url = `https://cash.app/$${links.cashAppHandle}/${amt}`
    buttons.push(
      `<a href="${url}" style="display:inline-block;margin:4px;padding:10px 18px;border-radius:8px;font-size:13px;font-weight:600;text-decoration:none;color:#ffffff;background:#00A86B">Pay with Cash App</a>`
    )
  }

  const zelleLines: string[] = []
  if (links.zellePhone) zelleLines.push(`<div style="font-size:13px;color:#374151;margin-top:2px">${links.zellePhone}</div>`)
  if (links.zelleEmail) zelleLines.push(`<div style="font-size:13px;color:#374151;margin-top:2px">${links.zelleEmail}</div>`)
  const zelleBlock = zelleLines.length
    ? `<div style="display:inline-block;margin:4px;padding:10px 18px;border-radius:8px;font-size:13px;font-weight:600;background:#f3e8ff;color:#6D1ED4;vertical-align:top">
        Zelle: send to<br/>${zelleLines.join("")}
      </div>`
    : ""

  if (buttons.length === 0 && !zelleBlock) return ""

  return `
    <div style="margin-top:20px;text-align:center">
      <div style="font-size:11px;text-transform:uppercase;letter-spacing:.08em;color:#9ca3af;margin-bottom:8px">Pay Online</div>
      <div>
        ${buttons.join("\n        ")}
        ${zelleBlock}
      </div>
    </div>`
}

export function buildInvoiceHtml(inv: InvoiceEmailData, isReminder = false): string {
  const total = inv.items.reduce((s, i) => s + i.quantity * i.unitPrice, 0)
  const paid  = inv.payments.reduce((s, p) => s + p.amount, 0)
  const balance = total - paid

  const rows = inv.items
    .map(
      (i) => `
      <tr>
        <td style="padding:7px 4px 7px 0;border-bottom:1px solid #f3f4f6;color:#374151;word-break:break-word">${i.description}</td>
        <td style="padding:7px 4px;border-bottom:1px solid #f3f4f6;color:#6b7280;text-align:center">${i.quantity}</td>
        <td style="padding:7px 4px;border-bottom:1px solid #f3f4f6;color:#6b7280;text-align:right;word-break:break-word">${fmt(i.unitPrice)}</td>
        <td style="padding:7px 0 7px 4px;border-bottom:1px solid #f3f4f6;font-weight:600;text-align:right;word-break:break-word">${fmt(i.quantity * i.unitPrice)}</td>
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
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <style>
    @media only screen and (max-width:620px) {
      .inv-header-left  { padding: 16px !important; }
      .inv-header-right { padding: 16px 16px 16px 8px !important; }
      .inv-header-num   { font-size: 16px !important; }
      .inv-body         { padding: 20px 16px !important; }
      .inv-total-amt    { font-size: 15px !important; }
      .inv-footer       { padding: 16px !important; }
    }
  </style>
</head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f9fafb;margin:0;padding:12px 8px">
  <div style="max-width:600px;width:100%;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,.1)">

    <!-- Header -->
    <table width="100%" cellpadding="0" cellspacing="0" style="border-bottom:4px solid #0c4a6e;table-layout:fixed">
      <tr>
        <td class="inv-header-left" style="padding:20px 16px 20px 24px;vertical-align:middle;width:55%">
          ${inv.companyLogoUrl
            ? `<img src="${inv.companyLogoUrl}" alt="${inv.companyName}" style="max-height:64px;max-width:220px;width:auto;height:auto;display:block" />`
            : `<span style="font-size:18px;font-weight:700;color:#0c4a6e;word-break:break-word">${inv.companyName}</span>`}
        </td>
        <td class="inv-header-right" style="padding:20px 24px 20px 8px;text-align:right;vertical-align:middle;width:45%">
          <div style="font-size:10px;text-transform:uppercase;letter-spacing:.1em;color:#9ca3af;white-space:nowrap">Invoice</div>
          <div class="inv-header-num" style="font-size:18px;font-weight:700;color:#111827;margin-top:2px;word-break:break-all">${inv.invoiceNumber}</div>
          <div style="font-size:12px;color:#6b7280;margin-top:4px;white-space:nowrap">Due ${fmtDate(inv.dueDate)}</div>
        </td>
      </tr>
    </table>

    <div class="inv-body" style="padding:24px">
      ${reminderBanner}
      ${customMessageBlock}

      <!-- From + Bill To -->
      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;table-layout:fixed">
        <tr>
          <td style="vertical-align:top;width:50%;padding-right:12px;word-break:break-word">
            <div style="font-size:10px;text-transform:uppercase;letter-spacing:.1em;color:#9ca3af;margin-bottom:6px">From</div>
            <div style="font-weight:600;font-size:14px;color:#111827">${inv.companyName}</div>
            ${inv.companyAddress ? `<div style="font-size:13px;color:#6b7280;margin-top:2px">${inv.companyAddress}</div>` : ""}
            ${inv.companyCity ? `<div style="font-size:13px;color:#6b7280">${inv.companyCity}, ${inv.companyState ?? ""} ${inv.companyZip ?? ""}</div>` : ""}
            ${inv.companyPhone ? `<div style="font-size:13px;color:#6b7280">${inv.companyPhone}</div>` : ""}
          </td>
          <td style="vertical-align:top;width:50%;padding-left:12px;word-break:break-word">
            <div style="font-size:10px;text-transform:uppercase;letter-spacing:.1em;color:#9ca3af;margin-bottom:6px">Bill To</div>
            <div style="font-weight:600;font-size:14px;color:#111827">${inv.customerFirstName} ${inv.customerLastName}</div>
            <div style="font-size:13px;color:#6b7280;margin-top:2px">${inv.customerAddress}</div>
            <div style="font-size:13px;color:#6b7280">${inv.customerCity}, ${inv.customerState} ${inv.customerZip}</div>
          </td>
        </tr>
      </table>

      <!-- Issued date -->
      <div style="font-size:12px;color:#9ca3af;margin-bottom:16px">Issued ${fmtDate(inv.issuedAt)}</div>

      <!-- Line items — table-layout:fixed locks column widths so Total can't overflow -->
      <table style="width:100%;border-collapse:collapse;margin-bottom:16px;table-layout:fixed">
        <colgroup>
          <col style="width:44%" />
          <col style="width:12%" />
          <col style="width:22%" />
          <col style="width:22%" />
        </colgroup>
        <thead>
          <tr style="border-bottom:2px solid #e5e7eb">
            <th style="padding:6px 4px 6px 0;text-align:left;font-size:11px;text-transform:uppercase;letter-spacing:.08em;color:#9ca3af;font-weight:600">Description</th>
            <th style="padding:6px 4px;text-align:center;font-size:11px;text-transform:uppercase;letter-spacing:.08em;color:#9ca3af;font-weight:600">Qty</th>
            <th style="padding:6px 4px;text-align:right;font-size:11px;text-transform:uppercase;letter-spacing:.08em;color:#9ca3af;font-weight:600">Unit</th>
            <th style="padding:6px 0 6px 4px;text-align:right;font-size:11px;text-transform:uppercase;letter-spacing:.08em;color:#9ca3af;font-weight:600">Total</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
        <tfoot>
          <tr>
            <td colspan="3" style="padding:10px 4px 4px;text-align:right;font-weight:600;color:#374151">Total</td>
            <td class="inv-total-amt" style="padding:10px 0 4px 4px;text-align:right;font-size:16px;font-weight:700;color:#111827;word-break:break-word">${fmt(total)}</td>
          </tr>
          ${paid > 0 ? `
          <tr>
            <td colspan="3" style="padding:3px 4px;text-align:right;color:#6b7280">Paid</td>
            <td style="padding:3px 0 3px 4px;text-align:right;color:#16a34a;word-break:break-word">−${fmt(paid)}</td>
          </tr>
          <tr>
            <td colspan="3" style="padding:3px 4px;text-align:right;font-weight:600;color:#374151">Balance Due</td>
            <td style="padding:3px 0 3px 4px;text-align:right;font-weight:700;color:#111827;word-break:break-word">${fmt(balance)}</td>
          </tr>` : ""}
        </tfoot>
      </table>

      ${inv.notes ? `<div style="background:#f9fafb;border-radius:8px;padding:12px 16px;font-size:13px;color:#6b7280;margin-bottom:20px">${inv.notes}</div>` : ""}

      ${inv.payToken && inv.stripeConnected ? `
      <!-- Pay Now CTA (Stripe) -->
      <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:20px;text-align:center;margin-top:8px">
        <div style="font-size:14px;font-weight:600;color:#166534;margin-bottom:12px;word-break:break-word">Amount Due: ${fmt(balance > 0 ? balance : total)}</div>
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/pay/${inv.payToken}"
           style="display:inline-block;padding:12px 32px;background:#0ea5e9;color:#ffffff;font-size:15px;font-weight:700;text-decoration:none;border-radius:8px;letter-spacing:.01em">
          Pay Now
        </a>
        <div style="font-size:12px;color:#4b5563;margin-top:10px">Secure online payment · Credit or debit card accepted</div>
      </div>` : `
      <!-- CTA (no Stripe) -->
      <div style="background:#f0f9ff;border:1px solid #bae6fd;border-radius:8px;padding:16px;text-align:center;margin-top:8px">
        <div style="font-size:14px;font-weight:600;color:#0369a1;margin-bottom:4px;word-break:break-word">Amount Due: ${fmt(balance > 0 ? balance : total)}</div>
        <div style="font-size:13px;color:#0284c7">Please contact us with any questions about this invoice.</div>
      </div>`}

      ${inv.paymentLinks ? buildPaymentButtonsHtml(inv.paymentLinks, balance > 0 ? balance : total, inv.invoiceNumber) : ""}
    </div>

    <!-- Footer -->
    <div class="inv-footer" style="background:#f9fafb;border-top:1px solid #f3f4f6;padding:16px 24px;text-align:center;font-size:12px;color:#9ca3af">
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
            ? `<img src="${data.companyLogoUrl}" alt="${data.companyName}" style="max-height:64px;max-width:220px;width:auto;height:auto;display:block" />`
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

export interface EstimateEmailData {
  estimateNumber: string
  issuedAt: Date
  validUntil?: Date | null
  companyName: string
  companyAddress?: string | null
  companyCity?: string | null
  companyState?: string | null
  companyZip?: string | null
  companyPhone?: string | null
  companyLogoUrl?: string | null
  companyReplyTo?: string | null
  customerFirstName: string
  customerLastName: string
  customerAddress: string
  customerCity: string
  customerState: string
  customerZip: string
  items: { description: string; quantity: number; unitPrice: number }[]
  total: number
  notes?: string | null
  customMessage?: string | null
  portalUrl?: string | null
}

export function buildEstimateHtml(inv: EstimateEmailData): string {
  const rows = inv.items
    .map(
      (i) => `
      <tr>
        <td style="padding:7px 4px 7px 0;border-bottom:1px solid #f3f4f6;color:#374151;word-break:break-word">${i.description}</td>
        <td style="padding:7px 4px;border-bottom:1px solid #f3f4f6;color:#6b7280;text-align:center">${i.quantity}</td>
        <td style="padding:7px 4px;border-bottom:1px solid #f3f4f6;color:#6b7280;text-align:right;word-break:break-word">${fmt(i.unitPrice)}</td>
        <td style="padding:7px 0 7px 4px;border-bottom:1px solid #f3f4f6;font-weight:600;text-align:right;word-break:break-word">${fmt(i.quantity * i.unitPrice)}</td>
      </tr>`
    )
    .join("")

  const customMessageBlock = inv.customMessage
    ? `<div style="background:#f0f9ff;border:1px solid #bae6fd;border-radius:8px;padding:12px 16px;margin-bottom:24px;color:#0369a1;font-size:14px;white-space:pre-line">${inv.customMessage}</div>`
    : ""

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <style>
    @media only screen and (max-width:620px) {
      .est-header-left  { padding: 16px !important; }
      .est-header-right { padding: 16px 16px 16px 8px !important; }
      .est-body         { padding: 20px 16px !important; }
    }
  </style>
</head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f9fafb;margin:0;padding:12px 8px">
  <div style="max-width:600px;width:100%;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,.1)">

    <!-- Header — amber/gold accent for estimates -->
    <table width="100%" cellpadding="0" cellspacing="0" style="border-bottom:4px solid #92400e;table-layout:fixed">
      <tr>
        <td class="est-header-left" style="padding:20px 16px 20px 24px;vertical-align:middle;width:55%">
          ${inv.companyLogoUrl
            ? `<img src="${inv.companyLogoUrl}" alt="${inv.companyName}" style="max-height:64px;max-width:220px;width:auto;height:auto;display:block" />`
            : `<span style="font-size:18px;font-weight:700;color:#92400e;word-break:break-word">${inv.companyName}</span>`}
        </td>
        <td class="est-header-right" style="padding:20px 24px 20px 8px;text-align:right;vertical-align:middle;width:45%">
          <div style="font-size:10px;text-transform:uppercase;letter-spacing:.1em;color:#9ca3af;white-space:nowrap">Estimate</div>
          <div style="font-size:18px;font-weight:700;color:#111827;margin-top:2px;word-break:break-all">${inv.estimateNumber}</div>
          ${inv.validUntil ? `<div style="font-size:12px;color:#6b7280;margin-top:4px;white-space:nowrap">Valid until ${fmtDate(inv.validUntil)}</div>` : ""}
        </td>
      </tr>
    </table>

    <div class="est-body" style="padding:24px">
      ${customMessageBlock}

      <!-- From + Bill To -->
      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;table-layout:fixed">
        <tr>
          <td style="vertical-align:top;width:50%;padding-right:12px;word-break:break-word">
            <div style="font-size:10px;text-transform:uppercase;letter-spacing:.1em;color:#9ca3af;margin-bottom:6px">From</div>
            <div style="font-weight:600;font-size:14px;color:#111827">${inv.companyName}</div>
            ${inv.companyAddress ? `<div style="font-size:13px;color:#6b7280;margin-top:2px">${inv.companyAddress}</div>` : ""}
            ${inv.companyCity ? `<div style="font-size:13px;color:#6b7280">${inv.companyCity}, ${inv.companyState ?? ""} ${inv.companyZip ?? ""}</div>` : ""}
            ${inv.companyPhone ? `<div style="font-size:13px;color:#6b7280">${inv.companyPhone}</div>` : ""}
          </td>
          <td style="vertical-align:top;width:50%;padding-left:12px;word-break:break-word">
            <div style="font-size:10px;text-transform:uppercase;letter-spacing:.1em;color:#9ca3af;margin-bottom:6px">Prepared For</div>
            <div style="font-weight:600;font-size:14px;color:#111827">${inv.customerFirstName} ${inv.customerLastName}</div>
            <div style="font-size:13px;color:#6b7280;margin-top:2px">${inv.customerAddress}</div>
            <div style="font-size:13px;color:#6b7280">${inv.customerCity}, ${inv.customerState} ${inv.customerZip}</div>
          </td>
        </tr>
      </table>

      <div style="font-size:12px;color:#9ca3af;margin-bottom:16px">Issued ${fmtDate(inv.issuedAt)}</div>

      <!-- Line items -->
      <table style="width:100%;border-collapse:collapse;margin-bottom:16px;table-layout:fixed">
        <colgroup>
          <col style="width:44%" />
          <col style="width:12%" />
          <col style="width:22%" />
          <col style="width:22%" />
        </colgroup>
        <thead>
          <tr style="border-bottom:2px solid #e5e7eb">
            <th style="padding:6px 4px 6px 0;text-align:left;font-size:11px;text-transform:uppercase;letter-spacing:.08em;color:#9ca3af;font-weight:600">Description</th>
            <th style="padding:6px 4px;text-align:center;font-size:11px;text-transform:uppercase;letter-spacing:.08em;color:#9ca3af;font-weight:600">Qty</th>
            <th style="padding:6px 4px;text-align:right;font-size:11px;text-transform:uppercase;letter-spacing:.08em;color:#9ca3af;font-weight:600">Unit</th>
            <th style="padding:6px 0 6px 4px;text-align:right;font-size:11px;text-transform:uppercase;letter-spacing:.08em;color:#9ca3af;font-weight:600">Total</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
        <tfoot>
          <tr>
            <td colspan="3" style="padding:10px 4px 4px;text-align:right;font-weight:600;color:#374151">Estimate Total</td>
            <td style="padding:10px 0 4px 4px;text-align:right;font-size:16px;font-weight:700;color:#111827;word-break:break-word">${fmt(inv.total)}</td>
          </tr>
        </tfoot>
      </table>

      ${inv.notes ? `<div style="background:#f9fafb;border-radius:8px;padding:12px 16px;font-size:13px;color:#6b7280;margin-bottom:20px">${inv.notes}</div>` : ""}

      <!-- CTA — amber for estimates -->
      <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:8px;padding:16px;text-align:center;margin-top:8px">
        <div style="font-size:14px;font-weight:600;color:#92400e;margin-bottom:8px;word-break:break-word">Estimate Total: ${fmt(inv.total)}</div>
        ${inv.portalUrl
          ? `<a href="${inv.portalUrl}" style="display:inline-block;background:#92400e;color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;padding:12px 28px;border-radius:8px;margin-bottom:8px">Review &amp; Approve Estimate →</a>
        <div style="font-size:12px;color:#b45309;margin-top:6px">Click the button above to sign and approve online, or reply to this email with questions.</div>`
          : `<div style="font-size:13px;color:#b45309">${
              inv.companyReplyTo
                ? `Reply to this email to approve, ask questions, or request changes.`
                : inv.companyPhone
                  ? `Call us at <strong>${inv.companyPhone}</strong> to approve or request changes.`
                  : `Contact us to approve or request any changes.`
            }</div>`}
      </div>
    </div>

    <div style="background:#f9fafb;border-top:1px solid #f3f4f6;padding:16px 24px;text-align:center;font-size:12px;color:#9ca3af">
      Thank you for your business · ${inv.companyName} · Powered by PoolOS
    </div>
  </div>
</body>
</html>`
}

export interface VisitCompletionEmailData {
  companyName: string
  companyLogoUrl?: string | null
  companyPhone?: string | null
  customerFirstName: string
  visitedAt: Date
  status: string
  notes?: string | null
  portalUrl?: string | null
  technicianName?: string | null
  chlorine?: number | null
  ph?: number | null
  alkalinity?: number | null
  calcium?: number | null
  feedbackUrl?: string | null
}

export function buildVisitCompletionHtml(data: VisitCompletionEmailData): string {
  const readings: { label: string; value: number; unit?: string; low: number; high: number }[] = [
    { label: "Free Chlorine", value: data.chlorine!, unit: "ppm", low: 1, high: 3 },
    { label: "pH",            value: data.ph!,       low: 7.2, high: 7.6 },
    { label: "Alkalinity",    value: data.alkalinity!, unit: "ppm", low: 80,  high: 120 },
    { label: "Calcium",       value: data.calcium!,   unit: "ppm", low: 200, high: 400 },
  ].filter((r) => r.value != null)

  function chemColor(v: number, low: number, high: number) {
    if (v < low || v > high) return "#dc2626"
    return "#16a34a"
  }
  function chemLabel(v: number, low: number, high: number) {
    if (v < low) return "Low"
    if (v > high) return "High"
    return "OK"
  }

  const readingsHtml = readings.length
    ? `<table style="width:100%;border-collapse:collapse;margin-top:16px;table-layout:fixed">
        <colgroup><col style="width:50%"/><col style="width:25%"/><col style="width:25%"/></colgroup>
        <thead>
          <tr style="border-bottom:2px solid #e5e7eb">
            <th style="padding:6px 0;text-align:left;font-size:11px;text-transform:uppercase;letter-spacing:.08em;color:#9ca3af;font-weight:600">Chemical</th>
            <th style="padding:6px 4px;text-align:center;font-size:11px;text-transform:uppercase;letter-spacing:.08em;color:#9ca3af;font-weight:600">Reading</th>
            <th style="padding:6px 0;text-align:right;font-size:11px;text-transform:uppercase;letter-spacing:.08em;color:#9ca3af;font-weight:600">Status</th>
          </tr>
        </thead>
        <tbody>
          ${readings.map((r) => `
          <tr style="border-bottom:1px solid #f3f4f6">
            <td style="padding:8px 0;font-size:13px;color:#374151">${r.label}</td>
            <td style="padding:8px 4px;text-align:center;font-size:13px;font-weight:600;color:#111827">${r.value}${r.unit ? ` ${r.unit}` : ""}</td>
            <td style="padding:8px 0;text-align:right">
              <span style="font-size:11px;font-weight:600;color:${chemColor(r.value, r.low, r.high)}">${chemLabel(r.value, r.low, r.high)}</span>
            </td>
          </tr>`).join("")}
        </tbody>
      </table>`
    : ""

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
</head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f9fafb;margin:0;padding:12px 8px">
  <div style="max-width:600px;width:100%;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,.1)">

    <!-- Header -->
    <div style="background:#0c4a6e;padding:20px 24px">
      ${data.companyLogoUrl
        ? `<img src="${data.companyLogoUrl}" alt="${data.companyName}" style="max-height:56px;max-width:200px;width:auto;height:auto;display:block;margin-bottom:10px" />`
        : `<span style="font-size:18px;font-weight:700;color:#ffffff">${data.companyName}</span>`}
      <div style="font-size:13px;color:#bae6fd;margin-top:4px">Service Completed${data.technicianName ? ` · ${data.technicianName}` : ""}</div>
    </div>

    <div style="padding:24px">
      <p style="font-size:15px;color:#111827;margin:0 0 4px">Hi ${data.customerFirstName},</p>
      <p style="font-size:14px;color:#6b7280;margin:0 0 20px">
        Your pool was serviced on <strong>${fmtDate(data.visitedAt)}</strong>. Here's a summary of the visit.
      </p>

      ${data.notes ? `<div style="background:#f9fafb;border-radius:8px;padding:12px 16px;font-size:13px;color:#374151;margin-bottom:20px">
        <strong style="display:block;font-size:11px;text-transform:uppercase;letter-spacing:.08em;color:#9ca3af;margin-bottom:4px">Technician Notes</strong>
        ${data.notes}
      </div>` : ""}

      ${readings.length ? `<div>
        <strong style="display:block;font-size:11px;text-transform:uppercase;letter-spacing:.08em;color:#9ca3af;margin-bottom:4px">Chemical Readings</strong>
        ${readingsHtml}
      </div>` : ""}

      ${data.feedbackUrl ? `
      <div style="margin-top:24px;text-align:center">
        <p style="font-size:13px;font-weight:600;color:#374151;margin:0 0 12px">How did we do today?</p>
        <table role="presentation" style="margin:0 auto;border-collapse:collapse">
          <tr>
            ${[1,2,3,4,5].map(n => `
            <td style="padding:0 6px">
              <a href="${data.feedbackUrl}?rating=${n}" style="display:block;width:44px;height:44px;line-height:44px;text-align:center;background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;text-decoration:none;font-size:22px">
                ${'⭐'}
              </a>
            </td>`).join("")}
          </tr>
          <tr>
            ${[1,2,3,4,5].map(n => `
            <td style="padding:4px 6px;text-align:center">
              <a href="${data.feedbackUrl}?rating=${n}" style="font-size:11px;color:#6b7280;text-decoration:none">${n}</a>
            </td>`).join("")}
          </tr>
        </table>
      </div>` : ""}

      ${data.portalUrl ? `
      <div style="text-align:center;margin-top:24px">
        <a href="${data.portalUrl}" style="display:inline-block;background:#0ea5e9;color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;padding:12px 28px;border-radius:8px">
          View &amp; Reply on Your Portal
        </a>
      </div>` : ""}

      <div style="background:#f0f9ff;border:1px solid #bae6fd;border-radius:8px;padding:14px 16px;margin-top:20px;font-size:13px;color:#0369a1">
        ${data.companyPhone
          ? `Questions about your pool? Call us at <strong>${data.companyPhone}</strong>.`
          : `Questions about your pool? Reply to this email — we're happy to help.`}
      </div>
    </div>

    <div style="background:#f9fafb;border-top:1px solid #f3f4f6;padding:16px 24px;text-align:center;font-size:12px;color:#9ca3af">
      Thank you for your business · ${data.companyName} · Powered by PoolOS
    </div>
  </div>
</body>
</html>`
}

export function buildCustomerMessageHtml(data: {
  companyName: string
  companyLogoUrl?: string | null
  companyPhone?: string | null
  customerFirstName: string
  message: string
  portalUrl?: string | null
  sentByName?: string | null
}): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
</head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f9fafb;margin:0;padding:12px 8px">
  <div style="max-width:600px;width:100%;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,.1)">
    <div style="background:#0c4a6e;padding:20px 24px">
      ${data.companyLogoUrl
        ? `<img src="${data.companyLogoUrl}" alt="${data.companyName}" style="max-height:56px;max-width:200px;width:auto;height:auto;display:block;margin-bottom:10px" />`
        : `<span style="font-size:18px;font-weight:700;color:#ffffff">${data.companyName}</span>`}
      <div style="font-size:13px;color:#bae6fd;margin-top:4px">Message from ${data.companyName}</div>
    </div>
    <div style="padding:24px">
      <p style="font-size:15px;color:#111827;margin:0 0 16px">Hi ${data.customerFirstName},</p>
      <div style="background:#f9fafb;border-left:3px solid #0ea5e9;border-radius:0 8px 8px 0;padding:14px 16px;font-size:14px;color:#374151;white-space:pre-wrap;line-height:1.6">${data.message}</div>
      ${data.sentByName ? `<p style="font-size:12px;color:#9ca3af;margin:8px 0 0;text-align:right">— ${data.sentByName}</p>` : ""}

      ${data.portalUrl ? `
      <div style="text-align:center;margin-top:24px">
        <a href="${data.portalUrl}" style="display:inline-block;background:#0ea5e9;color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;padding:12px 28px;border-radius:8px">
          Reply on Your Portal
        </a>
      </div>` : ""}

      <div style="background:#f0f9ff;border:1px solid #bae6fd;border-radius:8px;padding:14px 16px;margin-top:20px;font-size:13px;color:#0369a1">
        ${data.companyPhone
          ? `Questions? Call us at <strong>${data.companyPhone}</strong>.`
          : `Reply to this email — we're happy to help.`}
      </div>
    </div>
    <div style="background:#f9fafb;border-top:1px solid #f3f4f6;padding:16px 24px;text-align:center;font-size:12px;color:#9ca3af">
      ${data.companyName} · Powered by PoolOS
    </div>
  </div>
</body>
</html>`
}

export function buildPortalReplyNotificationHtml(data: {
  companyName: string
  customerFirstName: string
  customerLastName: string
  message: string
}): string {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f9fafb;margin:0;padding:12px 8px">
  <div style="max-width:560px;width:100%;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,.1)">
    <div style="background:#0c4a6e;padding:20px 24px">
      <span style="font-size:18px;font-weight:700;color:#ffffff">${data.companyName}</span>
      <div style="font-size:13px;color:#bae6fd;margin-top:4px">Customer Reply</div>
    </div>
    <div style="padding:24px">
      <p style="font-size:15px;color:#111827;margin:0 0 4px">
        <strong>${data.customerFirstName} ${data.customerLastName}</strong> sent you a message via their portal:
      </p>
      <div style="background:#f9fafb;border-left:3px solid #6b7280;border-radius:0 8px 8px 0;padding:14px 16px;font-size:14px;color:#374151;margin-top:16px;white-space:pre-wrap;line-height:1.6">${data.message}</div>
      <p style="font-size:13px;color:#6b7280;margin-top:16px">Log in to your PoolOS dashboard to reply.</p>
    </div>
    <div style="background:#f9fafb;border-top:1px solid #f3f4f6;padding:16px 24px;text-align:center;font-size:12px;color:#9ca3af">
      ${data.companyName} · Powered by PoolOS
    </div>
  </div>
</body>
</html>`
}

export function buildDunningHtml(data: {
  firstName: string
  planLabel: string
  billingUrl: string
  attemptCount?: number
}) {
  const isRetry = (data.attemptCount ?? 1) > 1
  const subject = isRetry
    ? `Action required — your PoolOS payment still hasn't gone through`
    : `Payment failed — update your PoolOS payment method`

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f9fafb;margin:0;padding:12px 8px">
  <div style="max-width:520px;width:100%;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,.1)">

    <div style="background:#dc2626;padding:20px 24px">
      <span style="font-size:18px;font-weight:700;color:#ffffff">PoolOS</span>
      <div style="font-size:13px;color:#fecaca;margin-top:4px">Billing Notice</div>
    </div>

    <div style="padding:28px 24px">
      <p style="font-size:15px;color:#111827;margin:0 0 16px">Hi ${data.firstName},</p>

      <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:16px;margin-bottom:20px">
        <p style="font-size:14px;font-weight:600;color:#991b1b;margin:0 0 4px">
          ${isRetry ? "We still couldn't process your payment." : "We weren't able to process your payment."}
        </p>
        <p style="font-size:13px;color:#b91c1c;margin:0">
          Your <strong>${data.planLabel}</strong> subscription may be paused if this isn't resolved soon.
        </p>
      </div>

      <p style="font-size:14px;color:#374151;margin:0 0 8px">This is usually caused by:</p>
      <ul style="font-size:14px;color:#374151;margin:0 0 20px;padding-left:20px;line-height:1.8">
        <li>An expired card</li>
        <li>Insufficient funds</li>
        <li>Your bank declining the charge</li>
      </ul>

      <p style="font-size:14px;color:#374151;margin:0 0 20px">
        Update your payment method to keep your routes, invoices, and customer history uninterrupted.
      </p>

      <div style="text-align:center;margin:0 0 20px">
        <a href="${data.billingUrl}"
           style="display:inline-block;background:#0ea5e9;color:#ffffff;font-size:15px;font-weight:700;text-decoration:none;padding:13px 32px;border-radius:8px;letter-spacing:.01em">
          Update payment method →
        </a>
      </div>

      <p style="font-size:13px;color:#9ca3af;margin:0">
        Need help? Reply to this email or contact us at
        <a href="mailto:billing@poolos.biz" style="color:#0ea5e9;text-decoration:none">billing@poolos.biz</a>.
      </p>
    </div>

    <div style="background:#f9fafb;border-top:1px solid #f3f4f6;padding:16px 24px;text-align:center;font-size:12px;color:#9ca3af">
      PoolOS · Billing Support · <a href="mailto:billing@poolos.biz" style="color:#9ca3af">billing@poolos.biz</a>
    </div>
  </div>
</body>
</html>`
}
// subject helper exported for callers
export function dunningSubject(attemptCount = 1) {
  return attemptCount > 1
    ? "Action required — your PoolOS payment still hasn't gone through"
    : "Payment failed — update your PoolOS payment method"
}

export function buildPasswordResetHtml(firstName: string, resetUrl: string) {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
  <div style="max-width:480px;margin:40px auto">
    <div style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,.08)">
      <div style="background:#0ea5e9;padding:24px;text-align:center">
        <p style="margin:0;font-size:18px;font-weight:700;color:#ffffff">PoolOS</p>
      </div>
      <div style="padding:32px 24px">
        <p style="font-size:15px;color:#111827;margin:0 0 8px">Hi ${firstName},</p>
        <p style="font-size:14px;color:#6b7280;margin:0 0 24px">
          We received a request to reset your PoolOS password. Click the button below to choose a new one.
        </p>
        <div style="text-align:center;margin:0 0 24px">
          <a href="${resetUrl}" style="display:inline-block;background:#0ea5e9;color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;padding:12px 28px;border-radius:8px">
            Reset Password
          </a>
        </div>
        <p style="font-size:13px;color:#9ca3af;margin:0 0 8px">This link expires in 1 hour.</p>
        <p style="font-size:13px;color:#9ca3af;margin:0">
          If you didn't request this, you can safely ignore this email — your password won't change.
        </p>
      </div>
      <div style="background:#f9fafb;border-top:1px solid #f3f4f6;padding:16px 24px;text-align:center;font-size:12px;color:#9ca3af">
        PoolOS · Password Reset
      </div>
    </div>
  </div>
</body>
</html>`
}

export interface TrialConversionEmailData {
  firstName: string
  companyName: string
  trialEndsAt: Date | null
  daysLeft: number | null   // null = already expired
  customerCount: number
  visitCount: number
  upgradeUrl: string
}

export function buildTrialConversionHtml(data: TrialConversionEmailData): string {
  const { firstName, companyName, trialEndsAt, daysLeft, customerCount, visitCount, upgradeUrl } = data

  // Deadline line — short, factual, placed mid-email not at the top
  const deadlineText = daysLeft === null
    ? "Your trial has ended, but your account is still here — nothing has been deleted."
    : daysLeft === 0
    ? "Your trial ends <strong>tonight</strong>. After that, your account is paused — but everything below is saved and waiting."
    : daysLeft === 1
    ? "Your trial ends <strong>tomorrow</strong>. Your account will pause, but nothing gets deleted."
    : `Your trial ends in <strong>${daysLeft} days</strong>${trialEndsAt ? ` — ${fmtDate(trialEndsAt)}` : ""}. Upgrade anytime before then to keep going without a break.`

  // Snapshot stats — show as achievements, not metrics
  const snapshotRows: { label: string; value: string }[] = []
  if (customerCount > 0) snapshotRows.push({ value: String(customerCount), label: `pool${customerCount !== 1 ? "s" : ""} in your system` })
  if (visitCount > 0)    snapshotRows.push({ value: String(visitCount),    label: `service visit${visitCount !== 1 ? "s" : ""} logged` })
  snapshotRows.push({ value: "✓", label: "routes set up and optimized" })
  snapshotRows.push({ value: "✓", label: "customer portal active" })

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <style>
    @media only screen and (max-width:600px) {
      .tc-body  { padding: 20px 16px !important; }
      .tc-snap  { padding: 20px 16px !important; }
      .tc-plans { display: block !important; }
      .tc-plan  { display: block !important; width: 100% !important; margin-bottom: 10px !important; }
      .tc-cta   { padding: 14px 24px !important; font-size: 15px !important; }
    }
  </style>
</head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f0f4f8;margin:0;padding:16px 8px">
  <div style="max-width:560px;width:100%;margin:0 auto">

    <!-- Header -->
    <div style="background:#0c4a6e;padding:22px 28px;border-radius:12px 12px 0 0">
      <p style="margin:0;font-size:19px;font-weight:700;color:#ffffff;letter-spacing:-.01em">PoolOS</p>
      <p style="margin:3px 0 0;font-size:12px;color:#7dd3fc;letter-spacing:.02em;text-transform:uppercase">Pool service software</p>
    </div>

    <!-- Body -->
    <div class="tc-body" style="background:#ffffff;padding:28px 28px 24px">

      <p style="font-size:15px;color:#111827;margin:0 0 10px;font-weight:500">Hi ${firstName},</p>

      <p style="font-size:14px;color:#4b5563;margin:0 0 22px;line-height:1.7">
        You've spent real time setting up ${companyName ? `<strong style="color:#111827">${companyName}</strong>` : "your business"} in PoolOS.
        Here's where things stand:
      </p>

      <!-- Account snapshot card -->
      <div class="tc-snap" style="background:#0f172a;border-radius:10px;padding:22px 24px;margin-bottom:24px">
        <p style="margin:0 0 16px;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.1em;color:#94a3b8">
          ${companyName || "Your account"}, right now
        </p>
        <table style="width:100%;border-collapse:collapse">
          ${snapshotRows.map((row, i) => `
          <tr>
            <td style="padding:${i === 0 ? "0" : "8px"} 0 0;vertical-align:baseline;width:44px">
              <span style="font-size:${row.value.length <= 3 ? "22px" : "15px"};font-weight:700;color:#38bdf8;font-variant-numeric:tabular-nums">${row.value}</span>
            </td>
            <td style="padding:${i === 0 ? "0" : "8px"} 0 0 4px;font-size:13px;color:#cbd5e1;vertical-align:baseline">${row.label}</td>
          </tr>`).join("")}
        </table>
      </div>

      <!-- Bridge copy -->
      <p style="font-size:14px;color:#4b5563;margin:0 0 8px;line-height:1.7">
        That's a real book of business — not a demo. Every customer, every visit, every route
        is saved exactly as you left it.
      </p>
      <p style="font-size:14px;color:#4b5563;margin:0 0 24px;line-height:1.7">
        ${deadlineText}
      </p>

      <!-- Divider -->
      <div style="border-top:1px solid #f1f5f9;margin-bottom:24px"></div>

      <!-- Plans side by side -->
      <p style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.08em;color:#94a3b8;margin:0 0 12px">Pick a plan and keep going</p>
      <table class="tc-plans" style="width:100%;border-collapse:separate;border-spacing:8px 0;margin:0 -8px 20px">
        <tr class="tc-plans">
          <td class="tc-plan" style="width:50%;vertical-align:top;background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:16px">
            <p style="margin:0 0 2px;font-size:15px;font-weight:700;color:#111827">Starter</p>
            <p style="margin:0 0 10px;font-size:22px;font-weight:800;color:#0ea5e9">$49<span style="font-size:13px;font-weight:500;color:#64748b">/mo</span></p>
            <p style="margin:0;font-size:12px;color:#64748b;line-height:1.6">Up to 50 customers<br>2 staff accounts<br>Invoicing &amp; routes<br>Customer portal</p>
          </td>
          <td class="tc-plan" style="width:50%;vertical-align:top;background:#f0f9ff;border:2px solid #0ea5e9;border-radius:10px;padding:16px;position:relative">
            <p style="margin:0 0 0 0;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:#0284c7">Most popular</p>
            <p style="margin:2px 0 2px;font-size:15px;font-weight:700;color:#111827">Pro</p>
            <p style="margin:0 0 10px;font-size:22px;font-weight:800;color:#0ea5e9">$99<span style="font-size:13px;font-weight:500;color:#64748b">/mo</span></p>
            <p style="margin:0;font-size:12px;color:#64748b;line-height:1.6">Unlimited customers<br>Multiple techs<br>Full reports<br>Priority support</p>
          </td>
        </tr>
      </table>

      <!-- CTA -->
      <div style="text-align:center;margin-bottom:8px">
        <a href="${upgradeUrl}"
           class="tc-cta"
           style="display:inline-block;background:#0ea5e9;color:#ffffff;font-size:16px;font-weight:700;text-decoration:none;padding:15px 40px;border-radius:9px;letter-spacing:.01em">
          Keep my account →
        </a>
      </div>
      <p style="text-align:center;font-size:12px;color:#94a3b8;margin:10px 0 24px">
        No contracts &nbsp;·&nbsp; Cancel anytime &nbsp;·&nbsp; Your data is never deleted
      </p>

      <!-- Divider -->
      <div style="border-top:1px solid #f1f5f9;margin-bottom:20px"></div>

      <!-- Personal sign-off -->
      <p style="font-size:13px;color:#6b7280;margin:0 0 12px;line-height:1.7">
        Not sure which plan fits? Hit reply — I read every one and I'm happy to help you figure it out.
      </p>
      <p style="font-size:14px;color:#374151;margin:0;font-weight:500">— Chris, PoolOS</p>
    </div>

    <!-- Footer -->
    <div style="background:#e2e8f0;border-radius:0 0 12px 12px;padding:14px 24px;text-align:center;font-size:11px;color:#94a3b8">
      PoolOS &nbsp;·&nbsp; <a href="mailto:billing@poolos.biz" style="color:#94a3b8;text-decoration:none">billing@poolos.biz</a>
      &nbsp;·&nbsp; <a href="${upgradeUrl}" style="color:#94a3b8;text-decoration:none">View all plans</a>
    </div>

  </div>
</body>
</html>`
}

export function trialConversionSubject(firstName: string, daysLeft: number | null): string {
  if (daysLeft === null) return `${firstName}, your data is still here — pick up where you left off`
  if (daysLeft === 0)   return `Your PoolOS account pauses tonight — keep it going`
  if (daysLeft === 1)   return `Tomorrow's the last day — keep your routes and customers`
  if (daysLeft <= 3)    return `${firstName}, ${daysLeft} days left to keep your PoolOS account`
  return `${firstName}, keep what you've built`
}

export function buildContactReplyHtml(data: {
  name: string
  originalBody: string
  replyBody: string
}) {
  const { name, originalBody, replyBody } = data
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
  <div style="max-width:520px;margin:40px auto">
    <div style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,.08)">
      <div style="background:#0ea5e9;padding:24px;text-align:center">
        <p style="margin:0;font-size:18px;font-weight:700;color:#ffffff">PoolOS</p>
      </div>
      <div style="padding:32px 24px">
        <p style="font-size:15px;color:#111827;margin:0 0 16px">Hi ${name},</p>
        <p style="font-size:14px;color:#374151;line-height:1.6;margin:0 0 24px;white-space:pre-wrap">${replyBody}</p>
        <div style="border-top:1px solid #f3f4f6;padding-top:20px;margin-top:4px">
          <p style="font-size:11px;font-weight:600;color:#9ca3af;text-transform:uppercase;letter-spacing:.05em;margin:0 0 8px">Your original message</p>
          <p style="font-size:13px;color:#6b7280;line-height:1.6;margin:0;white-space:pre-wrap">${originalBody}</p>
        </div>
      </div>
      <div style="background:#f9fafb;border-top:1px solid #f3f4f6;padding:16px 24px;text-align:center;font-size:12px;color:#9ca3af">
        PoolOS · hello@poolos.biz
      </div>
    </div>
  </div>
</body>
</html>`
}
