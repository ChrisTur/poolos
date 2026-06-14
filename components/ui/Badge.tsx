import { cn } from "@/lib/utils"

type BadgeVariant = "green" | "yellow" | "red" | "blue" | "gray" | "orange"

const variantMap: Record<BadgeVariant, string> = {
  green: "bg-green-100 text-green-800",
  yellow: "bg-yellow-100 text-yellow-800",
  red: "bg-red-100 text-red-800",
  blue: "bg-blue-100 text-blue-800",
  gray: "bg-gray-100 text-gray-700",
  orange: "bg-orange-100 text-orange-800",
}

interface BadgeProps {
  label: string
  variant?: BadgeVariant
  className?: string
}

export default function Badge({ label, variant = "gray", className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium",
        variantMap[variant],
        className
      )}
    >
      {label}
    </span>
  )
}

export function statusBadge(status: string) {
  const map: Record<string, { label: string; variant: BadgeVariant }> = {
    active: { label: "Active", variant: "green" },
    inactive: { label: "Inactive", variant: "gray" },
    suspended: { label: "Suspended", variant: "red" },
    draft: { label: "Draft", variant: "gray" },
    sent: { label: "Sent", variant: "blue" },
    paid: { label: "Paid", variant: "green" },
    overdue: { label: "Overdue", variant: "red" },
    cancelled: { label: "Cancelled", variant: "gray" },
    completed: { label: "Completed", variant: "green" },
    skipped: { label: "Skipped", variant: "yellow" },
    issue: { label: "Issue", variant: "red" },
  }
  const { label, variant } = map[status] ?? { label: status, variant: "gray" as BadgeVariant }
  return <Badge label={label} variant={variant} />
}
