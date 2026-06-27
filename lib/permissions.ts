export const PERMISSIONS = {
  // Operations
  "customers.view":     "View customers",
  "customers.edit":     "Add & edit customers",
  "messages.view":      "View messages",
  "messages.send":      "Send messages",
  "schedule.view":      "View schedule",
  "schedule.log":       "Log service visits",
  "routes.view":        "View routes",
  "routes.manage":      "Manage routes",
  "issues.view":        "View issues",
  "issues.manage":      "Create & resolve issues",
  "equipment.view":     "View equipment",
  "equipment.manage":   "Add & service equipment",

  // Billing
  "invoices.view":      "View invoices",
  "invoices.manage":    "Create & edit invoices",
  "estimates.view":     "View estimates",
  "estimates.manage":   "Create & edit estimates",
  "expenses.view":      "View expenses",
  "expenses.manage":    "Log & manage expenses",
  "reports.view":       "View reports",

  // Settings
  "settings.company":   "Edit company profile",
  "settings.checklist": "Manage visit checklists",
  "settings.payments":  "Manage payment settings",
  "settings.team":      "Manage team members",
  "settings.billing":   "Manage subscription",

  // Support
  "support.view":       "Access support",
} as const

export type Permission = keyof typeof PERMISSIONS

export const PERMISSION_GROUPS: { label: string; keys: Permission[] }[] = [
  {
    label: "Operations",
    keys: [
      "customers.view", "customers.edit",
      "messages.view", "messages.send",
      "schedule.view", "schedule.log",
      "routes.view", "routes.manage",
      "issues.view", "issues.manage",
      "equipment.view", "equipment.manage",
    ],
  },
  {
    label: "Billing",
    keys: [
      "invoices.view", "invoices.manage",
      "estimates.view", "estimates.manage",
      "expenses.view", "expenses.manage",
      "reports.view",
    ],
  },
  {
    label: "Settings",
    keys: [
      "settings.company", "settings.checklist",
      "settings.payments", "settings.team",
      "settings.billing",
    ],
  },
  {
    label: "Support",
    keys: ["support.view"],
  },
]

const ALL_PERMISSIONS = Object.keys(PERMISSIONS) as Permission[]

export const DEFAULT_ROLE_PERMISSIONS: Record<string, Permission[]> = {
  owner: ALL_PERMISSIONS,
  supervisor: ALL_PERMISSIONS.filter(
    (p) => p !== "settings.billing" && p !== "settings.team"
  ),
  technician: [
    "customers.view",
    "schedule.view", "schedule.log",
    "routes.view",
    "messages.view",
    "issues.view", "issues.manage",
    "equipment.view",
    "support.view",
  ],
}
