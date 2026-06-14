"use client"

import { pdf } from "@react-pdf/renderer"
import { saveAs } from "file-saver"
import { Download } from "lucide-react"
import Button from "@/components/ui/Button"
import InvoicePDF from "./InvoicePDF"
import type { Customer, Invoice, InvoiceItem, Payment } from "@/app/generated/prisma/client"

type FullInvoice = Invoice & {
  customer: Customer
  items: InvoiceItem[]
  payments: Payment[]
}

export default function InvoicePDFButton({ invoice }: { invoice: FullInvoice }) {
  const handleDownload = async () => {
    const blob = await pdf(<InvoicePDF invoice={invoice} />).toBlob()
    saveAs(blob, `${invoice.invoiceNumber}.pdf`)
  }

  return (
    <Button variant="secondary" size="sm" onClick={handleDownload}>
      <Download className="w-4 h-4" />
      PDF
    </Button>
  )
}
