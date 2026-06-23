// ─── Plan configuration ────────────────────────────────────────────────────
//
// This file is the single source of truth for every subscription plan and the
// feature flags that each plan unlocks.
//
// Adding a new feature to the product:
//   1. Add a key to PlanFeatures below and give it a human-readable label in
//      FEATURE_LABELS.
//   2. Set the value to `true` on whichever plans should include it (leave it
//      `false` on lower tiers).
//   3. Gate the feature in the UI / server actions using:
//        getPlan(company.plan).features.yourNewFeature

export type PlanId = "trial" | "starter" | "pro" | "unlimited"

export interface PlanFeatures {
  // ── Core (all plans) ──────────────────────────────────────────────────────
  invoicing:        boolean  // Invoicing & online payments
  routes:           boolean  // Route scheduling & management
  customerPortal:   boolean  // Per-customer branded portal
  chemicalTracking: boolean  // Chemical readings + trend charts
  emailNotifications: boolean  // Auto-email customers on visit / invoice

  // ── Reporting ─────────────────────────────────────────────────────────────
  reports:          boolean  // Revenue, aging, chemical trend reports
  csvExport:        boolean  // Export customers / invoices / expenses to CSV

  // ── Advanced ──────────────────────────────────────────────────────────────
  bulkInvoicing:    boolean  // Generate invoices for all customers at once
  fileAttachments:  boolean  // Photo & file attachments on visits / customers
  customBranding:   boolean  // Custom logo on all customer-facing emails & portal

  // ── Coming soon (set to false on all plans until the feature ships) ───────
  smsNotifications: boolean  // SMS alerts via Twilio
  calendarView:     boolean  // Visual weekly / monthly schedule calendar
  techAssignment:   boolean  // Assign specific technicians to visits / routes
  autoInvoicing:    boolean  // Auto-generate monthly invoices on a schedule
  quickbooksExport: boolean  // QuickBooks / Xero formatted export
}

export interface Plan {
  id:           PlanId
  label:        string
  description:  string
  priceMonthly: number | null  // null = free trial
  priceAnnual?: number         // total annual cost (10 months = 2 months free)
  badge:        string         // Tailwind classes for the colored badge
  mostPopular?: boolean        // Highlighted on the marketing pricing page
  /** Marketing-facing bullet points shown on the pricing page. */
  highlights:   string[]
  limits: {
    customers: number  // use Infinity for unlimited
    staff:     number
  }
  features: PlanFeatures
}

// ─── Feature display labels ────────────────────────────────────────────────
export const FEATURE_LABELS: Record<keyof PlanFeatures, string> = {
  invoicing:          "Invoicing & Payments",
  routes:             "Route Scheduling",
  customerPortal:     "Customer Portal",
  chemicalTracking:   "Chemical Tracking",
  emailNotifications: "Email Notifications",
  reports:            "Reports & Analytics",
  csvExport:          "CSV Export",
  bulkInvoicing:      "Bulk Invoicing",
  fileAttachments:    "File & Photo Attachments",
  customBranding:     "Custom Branding",
  smsNotifications:   "SMS Notifications",
  calendarView:       "Calendar View",
  techAssignment:     "Technician Assignment",
  autoInvoicing:      "Auto-Invoicing",
  quickbooksExport:   "QuickBooks / Xero Export",
}

// ─── Plan definitions ──────────────────────────────────────────────────────
export const PLANS: Record<PlanId, Plan> = {
  trial: {
    id: "trial",
    label: "Trial",
    description: "14-day free trial with full access",
    priceMonthly: null,
    badge: "bg-blue-100 text-blue-700",
    highlights: [],
    limits: { customers: 10, staff: 2 },
    features: {
      invoicing:          true,
      routes:             true,
      customerPortal:     true,
      chemicalTracking:   true,
      emailNotifications: true,
      reports:            false,
      csvExport:          false,
      bulkInvoicing:      false,
      fileAttachments:    true,
      customBranding:     false,
      smsNotifications:   false,
      calendarView:       false,
      techAssignment:     false,
      autoInvoicing:      false,
      quickbooksExport:   false,
    },
  },

  starter: {
    id: "starter",
    label: "Starter",
    description: "Perfect for solo operators just getting started.",
    priceMonthly: 49,
    priceAnnual: 490,
    badge: "bg-gray-100 text-gray-700",
    highlights: [
      "Up to 50 customers",
      "2 staff accounts",
      "Invoicing & payments",
      "Route scheduling",
      "Customer portal",
      "Email notifications",
    ],
    limits: { customers: 50, staff: 2 },
    features: {
      invoicing:          true,
      routes:             true,
      customerPortal:     true,
      chemicalTracking:   true,
      emailNotifications: true,
      reports:            false,
      csvExport:          true,
      bulkInvoicing:      false,
      fileAttachments:    true,
      customBranding:     false,
      smsNotifications:   false,
      calendarView:       false,
      techAssignment:     false,
      autoInvoicing:      false,
      quickbooksExport:   false,
    },
  },

  pro: {
    id: "pro",
    label: "Pro",
    description: "For growing companies with multiple techs.",
    priceMonthly: 99,
    priceAnnual: 990,
    badge: "bg-sky-100 text-sky-700",
    mostPopular: true,
    highlights: [
      "Up to 200 customers",
      "Unlimited staff",
      "Everything in Starter",
      "Reports & analytics",
      "Bulk invoicing",
      "Priority support",
    ],
    limits: { customers: 200, staff: Infinity },
    features: {
      invoicing:          true,
      routes:             true,
      customerPortal:     true,
      chemicalTracking:   true,
      emailNotifications: true,
      reports:            true,
      csvExport:          true,
      bulkInvoicing:      true,
      fileAttachments:    true,
      customBranding:     false,
      smsNotifications:   false,
      calendarView:       false,
      techAssignment:     false,
      autoInvoicing:      false,
      quickbooksExport:   false,
    },
  },

  unlimited: {
    id: "unlimited",
    label: "Unlimited",
    description: "Enterprise-scale operations with no limits.",
    priceMonthly: 199,
    priceAnnual: 1990,
    badge: "bg-purple-100 text-purple-700",
    highlights: [
      "Unlimited customers",
      "Unlimited staff",
      "Everything in Pro",
      "Custom branding",
      "Advanced analytics",
      "Dedicated support",
    ],
    limits: { customers: Infinity, staff: Infinity },
    features: {
      invoicing:          true,
      routes:             true,
      customerPortal:     true,
      chemicalTracking:   true,
      emailNotifications: true,
      reports:            true,
      csvExport:          true,
      bulkInvoicing:      true,
      fileAttachments:    true,
      customBranding:     true,
      smsNotifications:   false,
      calendarView:       false,
      techAssignment:     false,
      autoInvoicing:      false,
      quickbooksExport:   false,
    },
  },
}

export const PLAN_IDS = Object.keys(PLANS) as PlanId[]

/** Returns the plan object for a given plan id, defaulting to trial. */
export function getPlan(planId?: string | null): Plan {
  return PLANS[(planId ?? "trial") as PlanId] ?? PLANS.trial
}

/** Tailwind badge classes for a given plan id. */
export function planBadge(planId?: string | null): string {
  return getPlan(planId).badge
}
