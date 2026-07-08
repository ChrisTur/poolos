import { PrismaClient } from "../app/generated/prisma/client.js"
import { PrismaNeon } from "@prisma/adapter-neon"
import bcrypt from "bcryptjs"

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! })
const db = new PrismaClient({ adapter } as unknown as ConstructorParameters<typeof PrismaClient>[0])

function daysAgo(n: number) {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d
}
function daysFromNow(n: number) {
  const d = new Date()
  d.setDate(d.getDate() + n)
  return d
}

async function main() {
  console.log("🌱 Seeding database…")

  // ── Wipe existing test company if present ──────────────────────────────────
  const existing = await db.company.findUnique({ where: { slug: "sunshine-pool-service" } })
  if (existing) {
    await db.company.delete({ where: { id: existing.id } })
    console.log("  Removed previous seed data")
  }

  const password = await bcrypt.hash("password123", 12)

  // ── Company ────────────────────────────────────────────────────────────────
  const company = await db.company.create({
    data: {
      name: "Sunshine Pool Service",
      slug: "sunshine-pool-service",
      phone: "(602) 555-0142",
      address: "4820 E Camelback Rd",
      city: "Phoenix",
      state: "AZ",
      zip: "85018",
      website: "https://sunshinepoolaz.com",
      replyToEmail: "hello@sunshinepoolaz.com",
      defaultDueDays: 15,
      plan: "pro",
      reviewRequestEnabled: true,
      reviewRequestAfterVisits: 5,
      googleReviewUrl: "https://g.page/r/EXAMPLE/review",
      publicPageEnabled: true,
      publicPageTagline: "Keeping the Valley's pools sparkling since 2011",
      publicPageAbout: "Sunshine Pool Service has been serving the Phoenix metro area for over a decade. We specialize in weekly maintenance, equipment repair, and full pool openings and closings. Our certified technicians treat every pool as if it were their own.",
      serviceArea: "Phoenix, Scottsdale, Tempe, Mesa, and Chandler",
      publicPageShowPhone: true,
      publicPageShowWebsite: true,
      publicPageShowReviews: true,
    },
  })

  // ── Users ──────────────────────────────────────────────────────────────────
  const owner = await db.user.create({
    data: {
      companyId: company.id,
      firstName: "Chris",
      lastName: "Turner",
      email: "owner@sunshine.com",
      password,
      role: "owner",
    },
  })

  const tech1 = await db.user.create({
    data: {
      companyId: company.id,
      firstName: "Jake",
      lastName: "Davis",
      email: "jake@sunshine.com",
      password,
      role: "technician",
    },
  })

  const tech2 = await db.user.create({
    data: {
      companyId: company.id,
      firstName: "Maria",
      lastName: "Lopez",
      email: "maria@sunshine.com",
      password,
      role: "technician",
    },
  })

  // ── Tags ───────────────────────────────────────────────────────────────────
  const [tagVip, tagDog, tagSaltwater, tagCommercial] = await Promise.all([
    db.tag.create({ data: { companyId: company.id, name: "VIP", color: "#f59e0b" } }),
    db.tag.create({ data: { companyId: company.id, name: "Dog on property", color: "#ef4444" } }),
    db.tag.create({ data: { companyId: company.id, name: "Saltwater", color: "#06b6d4" } }),
    db.tag.create({ data: { companyId: company.id, name: "Commercial", color: "#8b5cf6" } }),
  ])

  // ── Customers ──────────────────────────────────────────────────────────────
  const c1 = await db.customer.create({
    data: {
      companyId: company.id,
      firstName: "John", lastName: "Smith",
      email: "john.smith@email.com", phone: "(602) 555-0111",
      address: "3842 E Lone Cactus Dr", city: "Phoenix", state: "AZ", zip: "85050",
      poolType: "chlorine", poolSize: "16000", monthlyRate: 130,
      serviceFrequency: "weekly",
      accessNotes: "Gate code: 1492. Large golden retriever — friendly. Leave gate latched.",
      poolNotes: "Older plaster, tends to go high alkalinity in summer.",
    },
  })
  await db.customerTag.create({ data: { customerId: c1.id, tagId: tagVip.id } })
  await db.customerTag.create({ data: { customerId: c1.id, tagId: tagDog.id } })

  const c2 = await db.customer.create({
    data: {
      companyId: company.id,
      firstName: "Maria", lastName: "Garcia",
      email: "mgarcia@email.com", phone: "(480) 555-0188",
      address: "9201 E Shea Blvd", city: "Scottsdale", state: "AZ", zip: "85260",
      poolType: "saltwater", poolSize: "22000", monthlyRate: 165,
      serviceFrequency: "weekly",
      accessNotes: "Side gate on north side of house. Key under terracotta pot by door.",
      poolNotes: "Pentair salt cell — check output quarterly.",
    },
  })
  await db.customerTag.create({ data: { customerId: c2.id, tagId: tagSaltwater.id } })
  await db.customerTag.create({ data: { customerId: c2.id, tagId: tagVip.id } })

  const c3 = await db.customer.create({
    data: {
      companyId: company.id,
      firstName: "Bob", lastName: "Johnson",
      phone: "(480) 555-0134",
      address: "1627 W Elliot Rd", city: "Tempe", state: "AZ", zip: "85284",
      poolType: "chlorine", poolSize: "12000", monthlyRate: 105,
      serviceFrequency: "biweekly",
      accessNotes: "No gate — pool is in back yard, walk around right side of house.",
    },
  })

  const c4 = await db.customer.create({
    data: {
      companyId: company.id,
      firstName: "Lisa", lastName: "Williams",
      email: "lwilliams@email.com", phone: "(480) 555-0199",
      address: "4400 E University Dr", city: "Mesa", state: "AZ", zip: "85205",
      poolType: "saltwater", poolSize: "18000", monthlyRate: 150,
      serviceFrequency: "weekly",
      accessNotes: "Gate code: 8823. Two small dogs — keep gate closed at all times.",
      poolNotes: "Has a spa. Service both pool and spa each visit.",
    },
  })
  await db.customerTag.create({ data: { customerId: c4.id, tagId: tagSaltwater.id } })
  await db.customerTag.create({ data: { customerId: c4.id, tagId: tagDog.id } })

  const c5 = await db.customer.create({
    data: {
      companyId: company.id,
      firstName: "David", lastName: "Nguyen",
      email: "david.nguyen@email.com", phone: "(602) 555-0177",
      address: "6015 N 16th St", city: "Phoenix", state: "AZ", zip: "85016",
      poolType: "chlorine", poolSize: "14000", monthlyRate: 120,
      serviceFrequency: "weekly",
      accessNotes: "Back gate is always unlocked.",
    },
  })

  const c6 = await db.customer.create({
    data: {
      companyId: company.id,
      firstName: "Karen", lastName: "Patel",
      email: "k.patel@email.com", phone: "(480) 555-0122",
      address: "2100 N Scottsdale Rd", city: "Scottsdale", state: "AZ", zip: "85257",
      poolType: "chlorine", poolSize: "20000", monthlyRate: 145,
      serviceFrequency: "weekly",
      accessNotes: "Call ahead 30 min — she works from home and will open gate.",
      poolNotes: "Pool has an attached water feature that needs brushing weekly.",
    },
  })

  const c7 = await db.customer.create({
    data: {
      companyId: company.id,
      firstName: "Desert Vista", lastName: "HOA",
      email: "manager@desertvistahoa.com", phone: "(602) 555-0166",
      address: "800 S Desert Vista Blvd", city: "Chandler", state: "AZ", zip: "85225",
      poolType: "chlorine", poolSize: "45000", monthlyRate: 350,
      serviceFrequency: "weekly",
      accessNotes: "Facility manager John Cruz has the key fob. His cell: (602) 555-0300. Service entrance on south side.",
      poolNotes: "Commercial pool — health dept inspection every 6 months. Log all readings.",
    },
  })
  await db.customerTag.create({ data: { customerId: c7.id, tagId: tagCommercial.id } })

  const c8 = await db.customer.create({
    data: {
      companyId: company.id,
      firstName: "Tom", lastName: "Bradley",
      email: "tombradley@email.com", phone: "(480) 555-0144",
      address: "711 W Chandler Blvd", city: "Chandler", state: "AZ", zip: "85225",
      poolType: "chlorine", poolSize: "13500", monthlyRate: 110,
      serviceFrequency: "biweekly",
    },
  })

  const customers = [c1, c2, c3, c4, c5, c6, c7, c8]

  // ── Checklist items ────────────────────────────────────────────────────────
  await db.visitChecklistItem.createMany({
    data: [
      { companyId: company.id, label: "Test and record all chemical levels", position: 0 },
      { companyId: company.id, label: "Brush walls and steps", position: 1 },
      { companyId: company.id, label: "Skim surface and empty baskets", position: 2 },
      { companyId: company.id, label: "Check equipment — pump, filter, heater", position: 3 },
      { companyId: company.id, label: "Backwash filter if pressure is high", position: 4 },
      { companyId: company.id, label: "Take before/after photo", position: 5 },
    ],
  })

  // ── Job templates ──────────────────────────────────────────────────────────
  const jtWeekly = await db.jobTemplate.create({
    data: {
      companyId: company.id,
      name: "Weekly Maintenance",
      description: "Standard weekly pool service visit.",
      estimatedMinutes: 45,
      steps: { create: [
        { label: "Test water chemistry", position: 0 },
        { label: "Add chemicals as needed", position: 1 },
        { label: "Brush walls, steps, and ledges", position: 2 },
        { label: "Skim and vacuum", position: 3 },
        { label: "Empty pump and skimmer baskets", position: 4 },
        { label: "Inspect equipment", position: 5 },
      ]},
    },
  })

  const jtOpening = await db.jobTemplate.create({
    data: {
      companyId: company.id,
      name: "Pool Opening",
      description: "Full pool opening service for spring season.",
      estimatedMinutes: 120,
      steps: { create: [
        { label: "Remove and clean cover", position: 0 },
        { label: "Reinstall equipment and fittings", position: 1 },
        { label: "Fill pool to proper level", position: 2 },
        { label: "Start up circulation system", position: 3 },
        { label: "Shock and balance water chemistry", position: 4 },
        { label: "Run filter 24 hrs before returning", position: 5 },
      ]},
    },
  })

  const jtFilterClean = await db.jobTemplate.create({
    data: {
      companyId: company.id,
      name: "Filter Clean",
      description: "Deep clean of cartridge or DE filter.",
      estimatedMinutes: 60,
      steps: { create: [
        { label: "Shut off pump and release pressure", position: 0 },
        { label: "Remove and disassemble filter", position: 1 },
        { label: "Rinse cartridges or clean DE grids", position: 2 },
        { label: "Inspect for damage or wear", position: 3 },
        { label: "Reassemble and restart system", position: 4 },
        { label: "Check and log operating pressure", position: 5 },
      ]},
    },
  })

  await db.jobTemplate.create({
    data: {
      companyId: company.id,
      name: "Acid Wash",
      description: "Drain and acid wash for stained or algae-affected plaster.",
      estimatedMinutes: 240,
      steps: { create: [
        { label: "Drain pool completely", position: 0 },
        { label: "Apply acid wash in sections", position: 1 },
        { label: "Rinse thoroughly after each section", position: 2 },
        { label: "Neutralize any remaining acid", position: 3 },
        { label: "Refill and balance chemistry", position: 4 },
      ]},
    },
  })

  await db.jobTemplate.create({
    data: {
      companyId: company.id,
      name: "Green Pool Cleanup",
      description: "Treatment for algae-infested pools.",
      estimatedMinutes: 90,
      steps: { create: [
        { label: "Brush entire pool surface", position: 0 },
        { label: "Shock heavily and add algaecide", position: 1 },
        { label: "Run filter continuously for 48 hrs", position: 2 },
        { label: "Backwash filter as needed", position: 3 },
        { label: "Return to balance water", position: 4 },
      ]},
    },
  })

  // ── Routes ─────────────────────────────────────────────────────────────────
  const route1 = await db.route.create({
    data: {
      companyId: company.id,
      name: "Monday — North Phoenix",
      description: "Phoenix / Scottsdale north corridor",
      dayOfWeek: 1,
      stops: { create: [
        { position: 0, customerId: c1.id },
        { position: 1, customerId: c2.id },
        { position: 2, customerId: c5.id },
        { position: 3, customerId: c6.id },
      ]},
    },
  })

  const route2 = await db.route.create({
    data: {
      companyId: company.id,
      name: "Wednesday — East Valley",
      description: "Tempe / Mesa / Chandler",
      dayOfWeek: 3,
      stops: { create: [
        { position: 0, customerId: c3.id },
        { position: 1, customerId: c4.id },
        { position: 2, customerId: c7.id },
        { position: 3, customerId: c8.id },
      ]},
    },
  })

  // ── Service visits (3 months of history) ──────────────────────────────────
  // Helper to create a visit with chemical usage
  async function makeVisit(
    customerId: string,
    routeId: string,
    daysBack: number,
    techId: string,
    opts: {
      chlorine?: number; ph?: number; alkalinity?: number; calcium?: number; cya?: number
      salt?: number; saltwater?: boolean; notes?: string; status?: string; rating?: number
    } = {},
    chemicals: { name: string; qty: number; unit: string; cost: number }[] = [],
  ) {
    const visit = await db.serviceVisit.create({
      data: {
        customerId,
        routeId,
        technicianId: techId,
        visitedAt: daysAgo(daysBack),
        status: opts.status ?? "completed",
        notes: opts.notes,
        chlorine:   opts.chlorine,
        ph:         opts.ph,
        alkalinity: opts.alkalinity,
        calcium:    opts.calcium,
        cya:        opts.cya,
        salt:       opts.salt,
        saltwater:  opts.saltwater ?? false,
        rating:     opts.rating,
      },
    })
    if (chemicals.length > 0) {
      await db.chemicalUsage.createMany({
        data: chemicals.map((c) => ({
          visitId: visit.id,
          companyId: company.id,
          productName: c.name,
          quantity: c.qty,
          unit: c.unit,
          unitCost: c.cost,
          totalCost: c.qty * c.cost,
        })),
      })
    }
    return visit
  }

  // c1 — John Smith (4 months of weekly visits)
  await makeVisit(c1.id, route1.id, 91, tech1.id, { chlorine: 1.2, ph: 7.8, alkalinity: 115, calcium: 280, cya: 40, notes: "Ph running high, added muriatic acid." }, [{ name: "Muriatic Acid", qty: 32, unit: "oz", cost: 0.05 }])
  await makeVisit(c1.id, route1.id, 84, tech1.id, { chlorine: 2.0, ph: 7.5, alkalinity: 110, calcium: 280, cya: 40 }, [{ name: "Liquid Chlorine", qty: 1, unit: "gal", cost: 3.50 }])
  await makeVisit(c1.id, route1.id, 77, tech1.id, { chlorine: 1.8, ph: 7.6, alkalinity: 100, calcium: 275, cya: 42, notes: "Added shock — algae spot on step." }, [{ name: "Cal-Hypo Shock", qty: 1, unit: "lbs", cost: 4.20 }, { name: "Liquid Chlorine", qty: 1, unit: "gal", cost: 3.50 }])
  await makeVisit(c1.id, route1.id, 70, tech1.id, { chlorine: 2.5, ph: 7.4, alkalinity: 100, calcium: 275, cya: 42 }, [{ name: "Liquid Chlorine", qty: 1, unit: "gal", cost: 3.50 }])
  await makeVisit(c1.id, route1.id, 63, tech1.id, { chlorine: 2.2, ph: 7.5, alkalinity: 105, calcium: 280, cya: 45 }, [])
  await makeVisit(c1.id, route1.id, 56, tech2.id, { chlorine: 3.0, ph: 7.3, alkalinity: 90, calcium: 280, cya: 45, notes: "Alkalinity low — added bicarb." }, [{ name: "Sodium Bicarbonate", qty: 2, unit: "lbs", cost: 1.80 }])
  await makeVisit(c1.id, route1.id, 49, tech1.id, { chlorine: 2.8, ph: 7.4, alkalinity: 100, calcium: 280, cya: 45, rating: 5 })
  await makeVisit(c1.id, route1.id, 42, tech1.id, { chlorine: 2.5, ph: 7.5, alkalinity: 105, calcium: 285, cya: 45 }, [{ name: "Liquid Chlorine", qty: 1, unit: "gal", cost: 3.50 }])
  await makeVisit(c1.id, route1.id, 35, tech1.id, { chlorine: 2.2, ph: 7.4, alkalinity: 100, calcium: 285, cya: 45 })
  await makeVisit(c1.id, route1.id, 28, tech2.id, { chlorine: 1.5, ph: 7.7, alkalinity: 110, calcium: 290, cya: 48, notes: "Ph creeping up again. Advised customer on bather load." }, [{ name: "Muriatic Acid", qty: 16, unit: "oz", cost: 0.05 }])
  await makeVisit(c1.id, route1.id, 21, tech1.id, { chlorine: 2.0, ph: 7.5, alkalinity: 105, calcium: 290, cya: 48, rating: 4 })
  await makeVisit(c1.id, route1.id, 14, tech1.id, { chlorine: 2.3, ph: 7.4, alkalinity: 100, calcium: 290, cya: 50 }, [{ name: "Liquid Chlorine", qty: 1, unit: "gal", cost: 3.50 }])
  await makeVisit(c1.id, route1.id, 7, tech1.id, { chlorine: 2.5, ph: 7.4, alkalinity: 102, calcium: 290, cya: 50 })

  // c2 — Maria Garcia (saltwater)
  await makeVisit(c2.id, route1.id, 84, tech2.id, { chlorine: 2.8, ph: 7.5, alkalinity: 100, calcium: 350, cya: 75, salt: 3200, saltwater: true })
  await makeVisit(c2.id, route1.id, 77, tech2.id, { chlorine: 3.0, ph: 7.6, alkalinity: 105, calcium: 355, cya: 75, salt: 3150, saltwater: true, notes: "Salt cell output at 75%. Cleaned electrodes." }, [{ name: "Salt Cell Cleaner", qty: 1, unit: "each", cost: 8.00 }])
  await makeVisit(c2.id, route1.id, 63, tech2.id, { chlorine: 2.5, ph: 7.5, alkalinity: 100, calcium: 360, cya: 80, salt: 3200, saltwater: true })
  await makeVisit(c2.id, route1.id, 49, tech2.id, { chlorine: 2.2, ph: 7.6, alkalinity: 100, calcium: 360, cya: 80, salt: 3000, saltwater: true, notes: "Salt level low. Added 40 lbs." }, [{ name: "Pool Salt", qty: 40, unit: "lbs", cost: 0.35 }])
  await makeVisit(c2.id, route1.id, 35, tech1.id, { chlorine: 2.8, ph: 7.5, alkalinity: 105, calcium: 365, cya: 80, salt: 3200, saltwater: true, rating: 5 })
  await makeVisit(c2.id, route1.id, 21, tech2.id, { chlorine: 3.0, ph: 7.4, alkalinity: 100, calcium: 365, cya: 80, salt: 3200, saltwater: true })
  await makeVisit(c2.id, route1.id, 7, tech2.id, { chlorine: 2.5, ph: 7.5, alkalinity: 100, calcium: 370, cya: 80, salt: 3150, saltwater: true })

  // c3 — Bob Johnson (biweekly, one skipped visit)
  await makeVisit(c3.id, route2.id, 70, tech1.id, { chlorine: 1.0, ph: 7.8, alkalinity: 80, cya: 30, notes: "Chlorine low, pH high. Pool hasn't been serviced in a while." }, [{ name: "Cal-Hypo Shock", qty: 2, unit: "lbs", cost: 4.20 }, { name: "Muriatic Acid", qty: 32, unit: "oz", cost: 0.05 }, { name: "Sodium Bicarbonate", qty: 3, unit: "lbs", cost: 1.80 }])
  await makeVisit(c3.id, route2.id, 56, tech1.id, { chlorine: 2.0, ph: 7.5, alkalinity: 100, cya: 35, notes: "Levels recovering." }, [{ name: "Liquid Chlorine", qty: 2, unit: "gal", cost: 3.50 }])
  await makeVisit(c3.id, route2.id, 42, tech1.id, { status: "skipped", notes: "Gate was locked, left door hanger. Will reschedule." })
  await makeVisit(c3.id, route2.id, 28, tech1.id, { chlorine: 2.5, ph: 7.4, alkalinity: 100, cya: 40 })
  await makeVisit(c3.id, route2.id, 14, tech2.id, { chlorine: 2.2, ph: 7.5, alkalinity: 100, cya: 40, rating: 3, notes: "Filter pressure at 25 psi — backwashed." })
  await makeVisit(c3.id, route2.id, 0, tech2.id, { chlorine: 2.8, ph: 7.4, alkalinity: 100, cya: 40 })

  // c4 — Lisa Williams (spa + pool)
  await makeVisit(c4.id, route2.id, 77, tech2.id, { chlorine: 2.0, ph: 7.6, alkalinity: 110, salt: 3100, saltwater: true, notes: "Spa jets need attention — flow restricted." })
  await makeVisit(c4.id, route2.id, 63, tech2.id, { chlorine: 2.5, ph: 7.5, alkalinity: 105, salt: 3100, saltwater: true }, [{ name: "Pool Salt", qty: 20, unit: "lbs", cost: 0.35 }])
  await makeVisit(c4.id, route2.id, 49, tech1.id, { chlorine: 3.0, ph: 7.4, alkalinity: 100, salt: 3200, saltwater: true, rating: 4 })
  await makeVisit(c4.id, route2.id, 35, tech2.id, { chlorine: 2.8, ph: 7.5, alkalinity: 100, salt: 3200, saltwater: true })
  await makeVisit(c4.id, route2.id, 21, tech2.id, { chlorine: 2.5, ph: 7.4, alkalinity: 100, salt: 3150, saltwater: true })
  await makeVisit(c4.id, route2.id, 7, tech1.id, { chlorine: 2.2, ph: 7.5, alkalinity: 105, salt: 3200, saltwater: true })

  // c5, c6, c7 — a few months of visits
  await makeVisit(c5.id, route1.id, 56, tech1.id, { chlorine: 1.5, ph: 7.7, alkalinity: 90, cya: 35, notes: "Low chlorine — added liquid chlorine and raised CYA." }, [{ name: "Liquid Chlorine", qty: 2, unit: "gal", cost: 3.50 }, { name: "Cyanuric Acid", qty: 1, unit: "lbs", cost: 3.20 }])
  await makeVisit(c5.id, route1.id, 42, tech1.id, { chlorine: 2.5, ph: 7.4, alkalinity: 100, cya: 45 })
  await makeVisit(c5.id, route1.id, 28, tech2.id, { chlorine: 2.8, ph: 7.5, alkalinity: 100, cya: 45, rating: 5 })
  await makeVisit(c5.id, route1.id, 14, tech1.id, { chlorine: 2.5, ph: 7.5, alkalinity: 100, cya: 45 })
  await makeVisit(c5.id, route1.id, 7, tech1.id, { chlorine: 2.2, ph: 7.4, alkalinity: 100, cya: 45 })

  await makeVisit(c6.id, route1.id, 49, tech2.id, { chlorine: 2.0, ph: 7.5, alkalinity: 110, calcium: 320, cya: 50, notes: "Water feature pump making noise — told owner to call plumber." })
  await makeVisit(c6.id, route1.id, 35, tech2.id, { chlorine: 2.5, ph: 7.4, alkalinity: 105, calcium: 320, cya: 50 })
  await makeVisit(c6.id, route1.id, 21, tech2.id, { chlorine: 2.8, ph: 7.5, alkalinity: 100, calcium: 325, cya: 50, rating: 5 })
  await makeVisit(c6.id, route1.id, 7, tech2.id, { chlorine: 2.5, ph: 7.4, alkalinity: 100, calcium: 325, cya: 50 })

  const v7a = await makeVisit(c7.id, route2.id, 42, tech1.id, { chlorine: 1.8, ph: 7.5, alkalinity: 100, calcium: 300, cya: 40, notes: "Commercial pool — all levels logged for health dept." })
  await makeVisit(c7.id, route2.id, 35, tech1.id, { chlorine: 2.0, ph: 7.5, alkalinity: 100, calcium: 300, cya: 40 }, [{ name: "Cal-Hypo Shock", qty: 3, unit: "lbs", cost: 4.20 }, { name: "Liquid Chlorine", qty: 2, unit: "gal", cost: 3.50 }])
  await makeVisit(c7.id, route2.id, 28, tech1.id, { chlorine: 2.5, ph: 7.4, alkalinity: 100, calcium: 305, cya: 40 })
  await makeVisit(c7.id, route2.id, 14, tech2.id, { chlorine: 2.2, ph: 7.5, alkalinity: 100, calcium: 305, cya: 40, rating: 4 })
  await makeVisit(c7.id, route2.id, 7, tech1.id, { chlorine: 2.8, ph: 7.4, alkalinity: 100, calcium: 305, cya: 40 })

  await makeVisit(c8.id, route2.id, 28, tech2.id, { chlorine: 2.0, ph: 7.5, alkalinity: 100, cya: 40 })
  await makeVisit(c8.id, route2.id, 14, tech2.id, { chlorine: 2.5, ph: 7.5, alkalinity: 100, cya: 40 })
  await makeVisit(c8.id, route2.id, 0, tech1.id, { chlorine: 2.2, ph: 7.4, alkalinity: 100, cya: 40, rating: 5 })

  // ── Equipment ──────────────────────────────────────────────────────────────
  const pump1 = await db.equipment.create({
    data: {
      customerId: c1.id, type: "pump", brand: "Pentair", model: "IntelliFlo VSF",
      serialNumber: "PNT-2019-83721", installedAt: new Date("2019-04-01"),
      warrantyExpiry: new Date("2024-04-01"), warrantyProvider: "Pentair",
      serviceIntervalDays: 180, lastServicedAt: daysAgo(45),
      notes: "Variable speed — runs at 1750 RPM for circulation, 2800 RPM for cleaning.",
    },
  })
  await db.equipmentService.create({
    data: {
      equipmentId: pump1.id, technicianId: tech1.id,
      date: daysAgo(45), description: "Replaced worn shaft seal. Inspected impeller — clear.",
      partsCost: 28.50, laborCost: 75.00,
    },
  })

  await db.equipment.create({
    data: {
      customerId: c1.id, type: "filter", brand: "Hayward", model: "Pro-Series 36 in.",
      installedAt: new Date("2019-04-01"),
      serviceIntervalDays: 90, lastServicedAt: daysAgo(30),
      notes: "Sand filter. Backwash when pressure exceeds 25 psi.",
    },
  })

  const saltCell = await db.equipment.create({
    data: {
      customerId: c2.id, type: "salt_system", brand: "Pentair", model: "IntelliChlor IC40",
      serialNumber: "IC40-2021-44198", installedAt: new Date("2021-06-15"),
      warrantyExpiry: new Date("2026-06-15"), warrantyProvider: "Pentair",
      serviceIntervalDays: 90, lastServicedAt: daysAgo(77),
      notes: "Set to 60% output. Cell cleaned at last service.",
    },
  })
  await db.equipmentService.create({
    data: {
      equipmentId: saltCell.id, technicianId: tech2.id,
      date: daysAgo(77), description: "Cleaned electrodes with acid solution. Output confirmed at 75%.",
      partsCost: 8.00, laborCost: 0,
    },
  })

  const heater4 = await db.equipment.create({
    data: {
      customerId: c4.id, type: "heater", brand: "Hayward", model: "H400FDN",
      installedAt: new Date("2020-03-10"),
      warrantyExpiry: new Date("2025-03-10"),
      serviceIntervalDays: 365, lastServicedAt: daysAgo(200),
      notes: "Gas heater for spa. Customer keeps spa at 102°F.",
    },
  })

  // Overdue equipment — triggers notification
  await db.equipment.create({
    data: {
      customerId: c7.id, type: "filter", brand: "Pentair", model: "Clean & Clear 320",
      installedAt: new Date("2018-05-01"),
      serviceIntervalDays: 90, lastServicedAt: daysAgo(110),
      notes: "Cartridge filter for commercial pool. Replace cartridges annually.",
    },
  })

  // ── Issue Reports ──────────────────────────────────────────────────────────
  await db.issueReport.create({
    data: {
      companyId: company.id, customerId: c1.id, visitId: null,
      reportedById: tech1.id,
      category: "equipment_failure", priority: "high", status: "in_progress",
      notes: "Pump is making a grinding noise on startup. Likely bearing failure. Customer notified — quoted $350 for repair.",
    },
  })

  await db.issueReport.create({
    data: {
      companyId: company.id, customerId: c4.id, visitId: null,
      reportedById: tech2.id,
      category: "leak", priority: "normal", status: "open",
      notes: "Small drip at backwash valve — losing about 1 inch per week. Not urgent but should be addressed before summer.",
    },
  })

  await db.issueReport.create({
    data: {
      companyId: company.id, customerId: c7.id, visitId: v7a.id,
      reportedById: tech1.id,
      category: "safety_hazard", priority: "high", status: "resolved",
      notes: "Missing drain cover on main drain — replaced same day with spare from truck. Health dept notified.",
    },
  })

  await db.issueReport.create({
    data: {
      companyId: company.id, customerId: c3.id, visitId: null,
      reportedById: tech1.id,
      category: "water_quality", priority: "normal", status: "resolved",
      notes: "Pool had light algae on steps. Shocked and brushed — cleared within 48 hrs.",
    },
  })

  // ── Rate history ───────────────────────────────────────────────────────────
  await db.rateHistory.createMany({
    data: [
      { customerId: c1.id, companyId: company.id, changedById: owner.id, oldRate: 110, newRate: 130, changedAt: daysAgo(90), note: "Price increase wizard — annual adjustment" },
      { customerId: c2.id, companyId: company.id, changedById: owner.id, oldRate: 145, newRate: 165, changedAt: daysAgo(90), note: "Price increase wizard — annual adjustment" },
      { customerId: c4.id, companyId: company.id, changedById: owner.id, oldRate: 130, newRate: 150, changedAt: daysAgo(90), note: "Price increase wizard — annual adjustment" },
      { customerId: c7.id, companyId: company.id, changedById: owner.id, oldRate: 300, newRate: 350, changedAt: daysAgo(60), note: "Contract renewal — added spa coverage" },
    ],
  })

  // ── Invoices ───────────────────────────────────────────────────────────────
  let invNum = 1
  function nextInv() { return `INV-${String(invNum++).padStart(4, "0")}` }

  // Paid invoices (last 2 months)
  for (const [cust, rate] of [[c1, 130], [c2, 165], [c4, 150], [c5, 120], [c7, 350]] as const) {
    await db.invoice.create({
      data: {
        companyId: company.id, customerId: cust.id,
        invoiceNumber: nextInv(), status: "paid",
        dueDate: daysAgo(45), paidAt: daysAgo(40),
        items: { create: [{ description: "Monthly pool service", quantity: 1, unitPrice: rate }] },
        payments: { create: [{ amount: rate, method: "card" }] },
      },
    })
  }

  // Current month — sent
  await db.invoice.create({
    data: {
      companyId: company.id, customerId: c1.id,
      invoiceNumber: nextInv(), status: "sent",
      dueDate: daysFromNow(10),
      items: { create: [{ description: "Monthly pool service — July", quantity: 1, unitPrice: 130 }] },
    },
  })
  await db.invoice.create({
    data: {
      companyId: company.id, customerId: c2.id,
      invoiceNumber: nextInv(), status: "sent",
      dueDate: daysFromNow(10),
      items: { create: [{ description: "Monthly pool service — July", quantity: 1, unitPrice: 165 }] },
    },
  })
  await db.invoice.create({
    data: {
      companyId: company.id, customerId: c6.id,
      invoiceNumber: nextInv(), status: "sent",
      dueDate: daysFromNow(10),
      items: { create: [{ description: "Monthly pool service — July", quantity: 1, unitPrice: 145 }] },
    },
  })

  // Overdue
  await db.invoice.create({
    data: {
      companyId: company.id, customerId: c3.id,
      invoiceNumber: nextInv(), status: "sent",
      dueDate: daysAgo(18),
      items: { create: [{ description: "Monthly pool service — June", quantity: 1, unitPrice: 105 }] },
    },
  })
  await db.invoice.create({
    data: {
      companyId: company.id, customerId: c8.id,
      invoiceNumber: nextInv(), status: "sent",
      dueDate: daysAgo(22),
      items: { create: [
        { description: "Monthly pool service — June", quantity: 1, unitPrice: 110 },
        { description: "Algae treatment", quantity: 1, unitPrice: 45 },
      ]},
    },
  })

  // Repair invoice
  await db.invoice.create({
    data: {
      companyId: company.id, customerId: c4.id,
      invoiceNumber: nextInv(), status: "sent",
      dueDate: daysFromNow(7), serviceType: "repair",
      items: { create: [
        { description: "Backwash valve replacement", quantity: 1, unitPrice: 185 },
        { description: "Labor — 1.5 hrs", quantity: 1.5, unitPrice: 75 },
      ]},
    },
  })

  // Draft
  await db.invoice.create({
    data: {
      companyId: company.id, customerId: c7.id,
      invoiceNumber: nextInv(), status: "draft", serviceType: "repair",
      dueDate: daysFromNow(15),
      notes: "Replace missing drain cover — parts + labor. Awaiting manager approval.",
      items: { create: [
        { description: "VGB-compliant drain cover", quantity: 1, unitPrice: 95 },
        { description: "Labor — 1 hr", quantity: 1, unitPrice: 75 },
      ]},
    },
  })

  // ── Estimates ──────────────────────────────────────────────────────────────
  await db.estimate.create({
    data: {
      companyId: company.id, customerId: c1.id,
      estimateNumber: "EST-0001", status: "sent",
      serviceType: "repair",
      validUntil: daysFromNow(30),
      notes: "Pump bearing replacement. Recommend sooner rather than later to prevent full pump failure.",
      items: { create: [
        { description: "IntelliFlo VSF bearing kit", quantity: 1, unitPrice: 120 },
        { description: "Labor — 2 hrs", quantity: 2, unitPrice: 75 },
      ]},
    },
  })

  await db.estimate.create({
    data: {
      companyId: company.id, customerId: c6.id,
      estimateNumber: "EST-0002", status: "accepted",
      serviceType: "equipment",
      validUntil: daysFromNow(10),
      approvedAt: daysAgo(3),
      signedByName: "Karen Patel",
      signedAt: daysAgo(3),
      notes: "Water feature pump replacement.",
      items: { create: [
        { description: "Pentair WaterFall pump 1HP", quantity: 1, unitPrice: 380 },
        { description: "Labor — 3 hrs", quantity: 3, unitPrice: 75 },
      ]},
    },
  })

  // ── Expenses ───────────────────────────────────────────────────────────────
  const expensesData = [
    { date: daysAgo(80), category: "chemicals", description: "Monthly chemical order — liquid chlorine", amount: 220, vendor: "Pool Supply World" },
    { date: daysAgo(80), category: "chemicals", description: "Shock, algaecide, stabilizer restock", amount: 145, vendor: "Pool Supply World" },
    { date: daysAgo(75), category: "fuel",      description: "Fuel — route trucks (June)", amount: 185, vendor: "Shell" },
    { date: daysAgo(60), category: "equipment", description: "Replacement pump shaft seal — c1", amount: 28.50, vendor: "Pentair Parts Direct" },
    { date: daysAgo(55), category: "supplies",  description: "Test strips, brushes, nets restock", amount: 88, vendor: "Inyopools.com" },
    { date: daysAgo(50), category: "chemicals", description: "Monthly chemical order — liquid chlorine", amount: 210, vendor: "Pool Supply World" },
    { date: daysAgo(45), category: "labor",     description: "Contract tech — extra route coverage", amount: 320, vendor: null },
    { date: daysAgo(45), category: "fuel",      description: "Fuel — route trucks (July partial)", amount: 95, vendor: "Shell" },
    { date: daysAgo(30), category: "office",    description: "PoolOS subscription — Pro plan", amount: 79, vendor: "PoolOS" },
    { date: daysAgo(15), category: "chemicals", description: "Monthly chemical order — liquid chlorine + salt", amount: 260, vendor: "Pool Supply World" },
    { date: daysAgo(10), category: "equipment", description: "Backwash valve — Lisa Williams repair", amount: 62, vendor: "Pentair Parts Direct" },
    { date: daysAgo(5),  category: "fuel",      description: "Fuel — route trucks", amount: 180, vendor: "Shell" },
  ]
  await db.expense.createMany({
    data: expensesData.map((e) => ({ ...e, companyId: company.id })),
  })

  // ── Recurring expenses ─────────────────────────────────────────────────────
  await db.recurringExpense.createMany({
    data: [
      { companyId: company.id, description: "PoolOS Pro subscription", amount: 79, category: "office", vendor: "PoolOS", frequency: "monthly", nextDueAt: daysFromNow(30), isActive: true },
      { companyId: company.id, description: "Truck insurance — both vehicles", amount: 290, category: "other", vendor: "State Farm", frequency: "monthly", nextDueAt: daysFromNow(22), isActive: true },
      { companyId: company.id, description: "Chemical supplier account fee", amount: 25, category: "chemicals", vendor: "Pool Supply World", frequency: "monthly", nextDueAt: daysFromNow(15), isActive: true },
      { companyId: company.id, description: "Annual business license renewal", amount: 175, category: "office", vendor: "City of Phoenix", frequency: "annual", nextDueAt: daysFromNow(120), isActive: true },
    ],
  })

  // ── Inventory ──────────────────────────────────────────────────────────────
  const [invChlor, invShock, invAlk, invMuri, invSalt, invStabs, invTablets] = await Promise.all([
    db.inventoryItem.create({ data: { companyId: company.id, name: "Liquid Chlorine", category: "chemical", unit: "gal", onHand: 12, lowStockThreshold: 5, reorderQty: 20, costPerUnit: 3.50, notes: "10% sodium hypochlorite" } }),
    db.inventoryItem.create({ data: { companyId: company.id, name: "Cal-Hypo Shock", category: "chemical", unit: "lbs", onHand: 8, lowStockThreshold: 10, reorderQty: 25, costPerUnit: 4.20 } }),
    db.inventoryItem.create({ data: { companyId: company.id, name: "Sodium Bicarbonate", category: "chemical", unit: "lbs", onHand: 25, lowStockThreshold: 10, reorderQty: 40, costPerUnit: 1.80 } }),
    db.inventoryItem.create({ data: { companyId: company.id, name: "Muriatic Acid", category: "chemical", unit: "oz", onHand: 128, lowStockThreshold: 64, reorderQty: 256, costPerUnit: 0.05 } }),
    db.inventoryItem.create({ data: { companyId: company.id, name: "Pool Salt", category: "chemical", unit: "lbs", onHand: 3, lowStockThreshold: 40, reorderQty: 200, costPerUnit: 0.35, notes: "Low — need to reorder before weekend routes" } }),
    db.inventoryItem.create({ data: { companyId: company.id, name: "Cyanuric Acid", category: "chemical", unit: "lbs", onHand: 5, lowStockThreshold: 3, reorderQty: 15, costPerUnit: 3.20 } }),
    db.inventoryItem.create({ data: { companyId: company.id, name: "3-inch Trichlor Tablets", category: "chemical", unit: "lbs", onHand: 0, lowStockThreshold: 10, reorderQty: 50, costPerUnit: 3.80, notes: "Out of stock!" } }),
  ])

  await db.inventoryItem.createMany({
    data: [
      { companyId: company.id, name: "Pool Brush (18 in.)", category: "supply", unit: "each", onHand: 6, lowStockThreshold: 2, reorderQty: 5, costPerUnit: 18 },
      { companyId: company.id, name: "Leaf Skimmer Net", category: "supply", unit: "each", onHand: 4, lowStockThreshold: 2, reorderQty: 4, costPerUnit: 12 },
      { companyId: company.id, name: "Test Strips (100-pack)", category: "supply", unit: "each", onHand: 2, lowStockThreshold: 2, reorderQty: 5, costPerUnit: 9.50 },
      { companyId: company.id, name: "O-Ring Assortment Kit", category: "part", unit: "each", onHand: 3, lowStockThreshold: 1, reorderQty: 3, costPerUnit: 22 },
      { companyId: company.id, name: "Salt Cell Cleaner", category: "chemical", unit: "each", onHand: 4, lowStockThreshold: 2, reorderQty: 6, costPerUnit: 8.00 },
    ],
  })

  // Restock transactions for inventory
  await db.inventoryTransaction.createMany({
    data: [
      { itemId: invChlor.id, companyId: company.id, type: "restock", quantity: 20, note: "Monthly order — Pool Supply World", createdById: owner.id },
      { itemId: invShock.id, companyId: company.id, type: "restock", quantity: 25, note: "Monthly order", createdById: owner.id },
      { itemId: invSalt.id, companyId: company.id, type: "restock", quantity: 200, note: "Bulk order", createdById: owner.id },
      { itemId: invSalt.id, companyId: company.id, type: "usage", quantity: -197, note: "Season usage", createdById: tech1.id },
      { itemId: invTablets.id, companyId: company.id, type: "restock", quantity: 50, note: "Initial stock", createdById: owner.id },
      { itemId: invTablets.id, companyId: company.id, type: "usage", quantity: -50, note: "Route usage", createdById: tech1.id },
    ],
  })

  // ── Customer messages (portal replies) ─────────────────────────────────────
  await db.customerMessage.createMany({
    data: [
      { companyId: company.id, customerId: c1.id, fromCompany: true, body: "Hi John! Just a heads up — we noticed your pump may have a bearing issue. We've sent you an estimate for the repair. Let us know if you have any questions!", sentByName: "Chris Turner" },
      { companyId: company.id, customerId: c1.id, fromCompany: false, body: "Thanks for the heads up. The estimate looks good — please go ahead with the repair on your next visit." },
      { companyId: company.id, customerId: c3.id, fromCompany: true, body: "Hi Bob, we stopped by on Wednesday but the gate was locked. We've rescheduled for Friday. Please make sure the gate is accessible.", sentByName: "Sunshine Pool Service" },
      { companyId: company.id, customerId: c3.id, fromCompany: false, body: "Sorry about that! I'll leave it unlocked Friday morning. Thanks for rescheduling." },
      { companyId: company.id, customerId: c7.id, fromCompany: true, body: "Hi — just a reminder that the commercial pool's filter cartridges are overdue for service. We'd recommend scheduling a filter clean before the health department inspection next month.", sentByName: "Chris Turner" },
    ],
  })

  // ── Vendors ────────────────────────────────────────────────────────────────
  await db.vendor.createMany({
    data: [
      { companyId: company.id, name: "Pool Supply World", category: "chemicals", notes: "Primary chemical supplier. Net-30 terms." },
      { companyId: company.id, name: "Pentair Parts Direct", category: "equipment", notes: "OEM parts, ships in 2 days." },
      { companyId: company.id, name: "Inyopools.com", category: "supplies" },
    ],
  })

  console.log("")
  console.log("✅ Seed complete!")
  console.log("")
  console.log("  Company: Sunshine Pool Service")
  console.log("  ─────────────────────────────────────────────")
  console.log("  Owner login:  owner@sunshine.com / password123")
  console.log("  Tech 1:       jake@sunshine.com  / password123")
  console.log("  Tech 2:       maria@sunshine.com / password123")
  console.log("")
  console.log("  8 customers, 2 routes, ~50 service visits")
  console.log("  13 invoices, 2 estimates, 12 expenses")
  console.log("  12 inventory items, 5 job templates")
  console.log("  Equipment + issue reports + rate history seeded")
  console.log("  Public profile page enabled at /pro/sunshine-pool-service")
  console.log("")
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect())
