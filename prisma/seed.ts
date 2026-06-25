import { PrismaClient } from "../app/generated/prisma/client.js"
import { PrismaNeon } from "@prisma/adapter-neon"
import bcrypt from "bcryptjs"

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! })
const db = new PrismaClient({ adapter } as unknown as ConstructorParameters<typeof PrismaClient>[0])

async function main() {
  const password = await bcrypt.hash("password123", 12)

  // Demo company
  const company = await db.company.create({
    data: {
      name: "Sunshine Pool Service",
      slug: "sunshine-pool-service",
      phone: "5551234567",
      address: "100 Business Blvd",
      city: "Phoenix",
      state: "AZ",
      zip: "85001",
      users: {
        create: [
          { firstName: "Chris", lastName: "Turner", email: "owner@sunshine.com", password, role: "owner" },
          { firstName: "Jake", lastName: "Davis", email: "jake@sunshine.com", password, role: "technician" },
        ],
      },
    },
  })

  // Customers
  const customers = await Promise.all([
    db.customer.create({
      data: {
        companyId: company.id,
        firstName: "John", lastName: "Smith",
        email: "john.smith@email.com", phone: "5551234567",
        address: "123 Oak Street", city: "Phoenix", state: "AZ", zip: "85001",
        poolType: "chlorine", poolSize: "15000", monthlyRate: 120,
      },
    }),
    db.customer.create({
      data: {
        companyId: company.id,
        firstName: "Maria", lastName: "Garcia",
        email: "mgarcia@email.com", phone: "5559876543",
        address: "456 Palm Ave", city: "Scottsdale", state: "AZ", zip: "85251",
        poolType: "saltwater", poolSize: "20000", monthlyRate: 150,
      },
    }),
    db.customer.create({
      data: {
        companyId: company.id,
        firstName: "Bob", lastName: "Johnson",
        phone: "5554561234",
        address: "789 Desert Dr", city: "Tempe", state: "AZ", zip: "85281",
        poolType: "chlorine", poolSize: "12000", monthlyRate: 100,
      },
    }),
    db.customer.create({
      data: {
        companyId: company.id,
        firstName: "Lisa", lastName: "Williams",
        email: "lwilliams@email.com", phone: "5557891234",
        address: "321 Cactus Rd", city: "Mesa", state: "AZ", zip: "85201",
        poolType: "saltwater", poolSize: "18000", monthlyRate: 135,
      },
    }),
  ])

  // Routes
  const route = await db.route.create({
    data: {
      companyId: company.id,
      name: "Monday North",
      description: "North Phoenix / Scottsdale",
      dayOfWeek: 1,
      stops: {
        create: [
          { position: 0, customerId: customers[0].id },
          { position: 1, customerId: customers[1].id },
          { position: 2, customerId: customers[3].id },
        ],
      },
    },
  })

  const route2 = await db.route.create({
    data: {
      companyId: company.id,
      name: "Wednesday South",
      description: "Tempe / Mesa",
      dayOfWeek: 3,
      stops: {
        create: [{ position: 0, customerId: customers[2].id }],
      },
    },
  })

  // Service visits
  await db.serviceVisit.createMany({
    data: [
      { customerId: customers[0].id, routeId: route.id, status: "completed", notes: "All good. Added shock.", chlorine: 2.5, ph: 7.4, alkalinity: 100 },
      { customerId: customers[1].id, routeId: route.id, status: "completed", chlorine: 3.0, ph: 7.6 },
      { customerId: customers[2].id, routeId: route2.id, status: "skipped", notes: "Gate locked, left notice." },
    ],
  })

  // Invoices
  await db.invoice.create({
    data: {
      companyId: company.id,
      customerId: customers[0].id,
      invoiceNumber: "INV-0001",
      status: "sent",
      dueDate: new Date(Date.now() + 14 * 86400000),
      items: {
        create: [
          { description: "Monthly pool service", quantity: 1, unitPrice: 120 },
          { description: "Shock treatment", quantity: 1, unitPrice: 25 },
        ],
      },
    },
  })

  await db.invoice.create({
    data: {
      companyId: company.id,
      customerId: customers[1].id,
      invoiceNumber: "INV-0002",
      status: "overdue",
      dueDate: new Date(Date.now() - 7 * 86400000),
      items: { create: [{ description: "Monthly pool service", quantity: 1, unitPrice: 150 }] },
    },
  })

  await db.invoice.create({
    data: {
      companyId: company.id,
      customerId: customers[2].id,
      invoiceNumber: "INV-0003",
      status: "paid",
      dueDate: new Date(Date.now() - 30 * 86400000),
      paidAt: new Date(Date.now() - 25 * 86400000),
      items: { create: [{ description: "Monthly pool service", quantity: 1, unitPrice: 100 }] },
      payments: { create: [{ amount: 100, method: "check" }] },
    },
  })

  console.log("✓ Seeded database")
  console.log("  Company: Sunshine Pool Service")
  console.log("  Login: christopher.turnerl@outlook.com / password123")
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect())
