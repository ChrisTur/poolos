import { NextResponse } from "next/server"

export function GET() {
  const headers = [
    "firstName", "lastName", "email", "phone",
    "address", "city", "state", "zip",
    "monthlyRate", "poolType", "poolSize", "serviceFrequency", "status",
  ].join(",")

  const example = [
    "Jane", "Smith", "jane@example.com", "555-123-4567",
    "123 Main St", "Austin", "TX", "78701",
    "150", "inground", "15000 gallons", "weekly", "active",
  ].join(",")

  const csv = `${headers}\n${example}\n`

  return new NextResponse(csv, {
    headers: {
      "Content-Type":        "text/csv",
      "Content-Disposition": 'attachment; filename="poolos-customers-template.csv"',
    },
  })
}
