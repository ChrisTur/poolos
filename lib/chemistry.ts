export const CHEM_RANGES = {
  chlorine:   { low: 1.0, high: 3.0,  unit: "ppm", label: "Chlorine" },
  ph:         { low: 7.2, high: 7.8,  unit: "",    label: "pH" },
  alkalinity: { low: 80,  high: 120,  unit: "ppm", label: "Alkalinity" },
  calcium:    { low: 200, high: 400,  unit: "ppm", label: "Calcium" },
} as const

export type ChemKey = keyof typeof CHEM_RANGES

export type ChemStatus = "ok" | "low" | "high"

export function chemStatus(key: ChemKey, value: number | null | undefined): ChemStatus | null {
  if (value == null) return null
  const r = CHEM_RANGES[key]
  if (value < r.low) return "low"
  if (value > r.high) return "high"
  return "ok"
}

export function visitNeedsAttention(v: {
  chlorine?: number | null
  ph?: number | null
  alkalinity?: number | null
  calcium?: number | null
}): boolean {
  const keys: ChemKey[] = ["chlorine", "ph", "alkalinity", "calcium"]
  const hasAny = keys.some((k) => v[k] != null)
  if (!hasAny) return false
  return keys.some((k) => {
    const s = chemStatus(k, v[k])
    return s === "low" || s === "high"
  })
}

export const STATUS_COLORS: Record<ChemStatus, string> = {
  ok:   "text-green-600",
  low:  "text-amber-600",
  high: "text-red-600",
}

export const STATUS_BG: Record<ChemStatus, string> = {
  ok:   "bg-green-50 text-green-700 border-green-200",
  low:  "bg-amber-50 text-amber-700 border-amber-200",
  high: "bg-red-50  text-red-700   border-red-200",
}
