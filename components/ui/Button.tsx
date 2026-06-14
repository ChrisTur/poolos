import { cn } from "@/lib/utils"
import { ButtonHTMLAttributes } from "react"

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger"
  size?: "sm" | "md" | "lg"
}

export default function Button({
  className,
  variant = "primary",
  size = "md",
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:pointer-events-none",
        {
          "bg-sky-600 text-white hover:bg-sky-700": variant === "primary",
          "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50": variant === "secondary",
          "text-gray-600 hover:bg-gray-100": variant === "ghost",
          "bg-red-600 text-white hover:bg-red-700": variant === "danger",
        },
        {
          "text-xs px-2.5 py-1.5": size === "sm",
          "text-sm px-4 py-2": size === "md",
          "text-base px-5 py-2.5": size === "lg",
        },
        className
      )}
    />
  )
}
