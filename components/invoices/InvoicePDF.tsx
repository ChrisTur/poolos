import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer"
import type { Customer, Invoice, InvoiceItem, Payment } from "@/app/generated/prisma/client"

type FullInvoice = Invoice & {
  customer: Customer
  items: InvoiceItem[]
  payments: Payment[]
}

const styles = StyleSheet.create({
  page: { padding: 48, fontFamily: "Helvetica", fontSize: 10, color: "#111827" },
  header: { flexDirection: "row", justifyContent: "space-between", marginBottom: 32 },
  title: { fontSize: 24, fontFamily: "Helvetica-Bold", color: "#0369a1" },
  label: { fontSize: 8, color: "#9ca3af", marginBottom: 2, textTransform: "uppercase", letterSpacing: 0.5 },
  sectionTitle: { fontFamily: "Helvetica-Bold", fontSize: 11, marginBottom: 8 },
  row: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: "#f3f4f6", paddingVertical: 6 },
  col6: { flex: 6 },
  col2: { flex: 2, textAlign: "center" },
  col2r: { flex: 2, textAlign: "right" },
  totalsRow: { flexDirection: "row", justifyContent: "flex-end", marginTop: 4 },
  totalsLabel: { width: 100, textAlign: "right", marginRight: 16, color: "#6b7280" },
  totalsValue: { width: 80, textAlign: "right" },
  bold: { fontFamily: "Helvetica-Bold" },
  divider: { borderTopWidth: 1, borderTopColor: "#e5e7eb", marginVertical: 16 },
  notes: { backgroundColor: "#f9fafb", padding: 10, borderRadius: 4, marginTop: 16, color: "#374151" },
})

function money(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n)
}

function fmtDate(d: Date | string) {
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
}

export default function InvoicePDF({ invoice }: { invoice: FullInvoice }) {
  const total = invoice.items.reduce((s, i) => s + i.quantity * i.unitPrice, 0)
  const paid = invoice.payments.reduce((s, p) => s + p.amount, 0)
  const balance = total - paid
  const { customer } = invoice

  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>PoolOS</Text>
            <Text style={{ color: "#6b7280", marginTop: 4 }}>Pool Service</Text>
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <Text style={[styles.bold, { fontSize: 16 }]}>{invoice.invoiceNumber}</Text>
            <Text style={{ color: "#6b7280", marginTop: 2 }}>Issued: {fmtDate(invoice.issuedAt)}</Text>
            <Text style={{ color: "#6b7280" }}>Due: {fmtDate(invoice.dueDate)}</Text>
          </View>
        </View>

        {/* Bill to */}
        <View style={{ marginBottom: 24 }}>
          <Text style={styles.label}>Bill To</Text>
          <Text style={styles.bold}>{customer.firstName} {customer.lastName}</Text>
          <Text style={{ color: "#374151" }}>{customer.address}</Text>
          <Text style={{ color: "#374151" }}>{customer.city}, {customer.state} {customer.zip}</Text>
          {customer.email && <Text style={{ color: "#374151" }}>{customer.email}</Text>}
        </View>

        <View style={styles.divider} />

        {/* Line items */}
        <Text style={styles.sectionTitle}>Services</Text>
        <View style={[styles.row, { borderTopWidth: 1, borderTopColor: "#e5e7eb" }]}>
          <Text style={[styles.col6, { color: "#9ca3af", fontSize: 8 }]}>DESCRIPTION</Text>
          <Text style={[styles.col2, { color: "#9ca3af", fontSize: 8 }]}>QTY</Text>
          <Text style={[styles.col2r, { color: "#9ca3af", fontSize: 8 }]}>UNIT PRICE</Text>
          <Text style={[styles.col2r, { color: "#9ca3af", fontSize: 8 }]}>TOTAL</Text>
        </View>
        {invoice.items.map((item, i) => (
          <View key={i} style={styles.row}>
            <Text style={styles.col6}>{item.description}</Text>
            <Text style={styles.col2}>{item.quantity}</Text>
            <Text style={styles.col2r}>{money(item.unitPrice)}</Text>
            <Text style={styles.col2r}>{money(item.quantity * item.unitPrice)}</Text>
          </View>
        ))}

        {/* Totals */}
        <View style={{ marginTop: 12 }}>
          <View style={styles.totalsRow}>
            <Text style={styles.totalsLabel}>Subtotal</Text>
            <Text style={styles.totalsValue}>{money(total)}</Text>
          </View>
          {paid > 0 && (
            <View style={styles.totalsRow}>
              <Text style={styles.totalsLabel}>Paid</Text>
              <Text style={[styles.totalsValue, { color: "#16a34a" }]}>{money(paid)}</Text>
            </View>
          )}
          <View style={[styles.totalsRow, { borderTopWidth: 1, borderTopColor: "#e5e7eb", paddingTop: 4, marginTop: 4 }]}>
            <Text style={[styles.totalsLabel, styles.bold]}>Balance Due</Text>
            <Text style={[styles.totalsValue, styles.bold, { fontSize: 12 }]}>{money(balance)}</Text>
          </View>
        </View>

        {invoice.notes && (
          <View style={styles.notes}>
            <Text style={{ color: "#6b7280", fontSize: 8, marginBottom: 4 }}>NOTES</Text>
            <Text>{invoice.notes}</Text>
          </View>
        )}

        <Text style={{ color: "#9ca3af", textAlign: "center", marginTop: 48, fontSize: 9 }}>
          Thank you for your business!
        </Text>
      </Page>
    </Document>
  )
}
