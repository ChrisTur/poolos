import { Resend } from "resend"

export const resend = new Resend(process.env.RESEND_API_KEY)
export const FROM = process.env.EMAIL_FROM ?? "PoolOS <noreply@poolos.biz>"

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
            ? `<img src="${inv.companyLogoUrl}" alt="${inv.companyName}" style="max-height:48px;max-width:160px;width:auto;display:block" />`
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
            ? `<img src="${inv.companyLogoUrl}" alt="${inv.companyName}" style="max-height:48px;max-width:160px;width:auto;display:block" />`
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
        <div style="font-size:14px;font-weight:600;color:#92400e;margin-bottom:4px;word-break:break-word">Estimate Total: ${fmt(inv.total)}</div>
        <div style="font-size:13px;color:#b45309">${
          inv.companyReplyTo
            ? `Reply to this email to approve, ask questions, or request changes.`
            : inv.companyPhone
              ? `Call us at <strong>${inv.companyPhone}</strong> to approve or request changes.`
              : `Contact us to approve or request any changes.`
        }</div>
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
        ? `<div style="display:inline-block;background:#ffffff;padding:6px 12px;border-radius:8px;margin-bottom:10px">
             <img src="${data.companyLogoUrl}" alt="${data.companyName}" style="max-height:40px;max-width:140px;width:auto;display:block" />
           </div>
           <div style="font-size:14px;font-weight:600;color:#ffffff">${data.companyName}</div>`
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
        ? `<div style="display:inline-block;background:#ffffff;padding:6px 12px;border-radius:8px;margin-bottom:10px">
             <img src="${data.companyLogoUrl}" alt="${data.companyName}" style="max-height:40px;max-width:140px;width:auto;display:block" />
           </div>
           <div style="font-size:14px;font-weight:600;color:#ffffff">${data.companyName}</div>`
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
