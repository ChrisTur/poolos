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

// ── Water Chemistry Calculator ───────────────────────────────────────────────
// Dosing math for the public /chemistry calculator page.
// All doses scale linearly from a 10,000-gallon baseline.
// Amounts are approximate — re-test after each addition.

export type PoolShape = "rectangular" | "round" | "oval" | "kidney"

export interface PoolDimensions {
  shape:  PoolShape
  length: number  // ft  (diameter when shape = "round")
  width:  number  // ft  (unused when shape = "round")
  depth:  number  // ft  (average depth)
}

export function calcVolumeGal(d: PoolDimensions): number {
  const { length: l, width: w, depth: dep } = d
  const factor =
    d.shape === "rectangular" ? 1      :
    d.shape === "round"       ? Math.PI / 4 :  // l = diameter
    d.shape === "oval"        ? 0.785  :
    /* kidney */                0.75
  const area = d.shape === "round" ? l * l : l * w
  return Math.round(area * factor * dep * 7.48)
}

export interface ChemReading {
  volume:    number   // gallons
  fc:        number   // free chlorine, ppm
  ph:        number   // pH value
  ta:        number   // total alkalinity, ppm
  ch:        number   // calcium hardness, ppm
  cya:       number   // cyanuric acid, ppm
  salt:      number   // ppm (meaningful only when saltwater = true)
  saltwater: boolean
}

export type DoseStatus = "low" | "ok" | "high"

export interface DoseAction {
  chemical: string
  amount:   string
  note?:    string
}

export interface DoseResult {
  key:     string
  label:   string
  current: number
  unit:    string
  min:     number
  max:     number
  ideal:   number
  status:  DoseStatus
  actions: DoseAction[]
  tip?:    string
}

// ── Internal formatters ──────────────────────────────────────────────────────

function fmtFlOz(oz: number): string {
  oz = Math.ceil(Math.max(0, oz))
  if (oz === 0) return "< 1 fl oz"
  if (oz < 32)  return `${oz} fl oz`
  if (oz < 128) return `${(oz / 32).toFixed(1)} qt`
  return `${(oz / 128).toFixed(2)} gal`
}

function fmtLbs(weight: number): string {
  weight = Math.max(0, weight)
  if (weight < 0.1) return "< 0.1 lbs"
  if (weight < 1)   return `${Math.round(weight * 16)} oz`
  return `${weight.toFixed(1)} lbs`
}

function fmtDrain(fraction: number): string {
  return `${Math.min(75, Math.ceil(fraction * 100))}% of pool water`
}

// ── Main calculator ──────────────────────────────────────────────────────────

const BASE = 10_000  // gallons — all rates defined at this volume

export function runDosing(r: ChemReading): DoseResult[] {
  const M = r.volume / BASE
  const out: DoseResult[] = []

  // ── Free Chlorine ────────────────────────────────────────────────────────
  {
    const min = 1, max = 3, ideal = 2
    const s: DoseStatus = r.fc < min ? "low" : r.fc > max ? "high" : "ok"
    const actions: DoseAction[] = []
    if (s === "low") {
      if (r.fc < 0.5) {
        actions.push({
          chemical: "Pool shock (calcium hypochlorite 68%)",
          amount:   fmtLbs(M),
          note:     "Super-chlorinate. Run pump for 8+ hrs. Do not swim until FC drops below 5 ppm.",
        })
      } else {
        const deficit = ideal - r.fc
        actions.push({ chemical: "Liquid chlorine (sodium hypochlorite ~10%)", amount: fmtFlOz(12 * deficit * M) })
        actions.push({ chemical: "Granular trichlor (90%)",                    amount: fmtLbs((1.5 * deficit * M) / 16),
          note: "Trichlor raises CYA over time — monitor stabilizer level." })
      }
    } else if (s === "high") {
      actions.push({
        chemical: r.fc > 10 ? "Partial drain & refill" : "No chemical needed",
        amount:   r.fc > 10 ? fmtDrain((r.fc - ideal) / r.fc) : "",
        note: r.fc > 10
          ? "Level is dangerously high — do not swim. Drain and refill to dilute."
          : "Wait for natural dissipation. Direct sunlight helps. Retest in 24 hrs.",
      })
    }
    out.push({ key: "fc", label: "Free Chlorine", current: r.fc, unit: "ppm", min, max, ideal, status: s, actions,
      tip: "At pH 7.8 only ~30% of chlorine is active vs. ~75% at pH 7.0 — always balance pH first." })
  }

  // ── pH ───────────────────────────────────────────────────────────────────
  {
    const min = 7.2, max = 7.6, ideal = 7.4
    const s: DoseStatus = r.ph < min ? "low" : r.ph > max ? "high" : "ok"
    const actions: DoseAction[] = []
    if (s === "low") {
      // 6 oz soda ash raises pH 0.2 per 10k gal → 30 oz per 1.0 pH
      const deficit = min - r.ph
      actions.push({ chemical: "Soda ash (sodium carbonate)", amount: fmtLbs((30 * deficit * M) / 16),
        note: "Add near a return jet with pump running. May cloud water briefly." })
    } else if (s === "high") {
      // 10 fl oz muriatic acid lowers pH 0.2 per 10k gal → 50 fl oz per 1.0 pH
      const excess = r.ph - max
      actions.push({ chemical: "Muriatic acid (31.45%)", amount: fmtFlOz(50 * excess * M),
        note: "Dilute in a bucket of water first. Wear gloves and eye protection. Add slowly near a return jet." })
      actions.push({ chemical: "Dry acid (sodium bisulfate)", amount: fmtLbs((65 * excess * M) / 16),
        note: "Safer alternative. Pre-dissolve in water before adding." })
    }
    out.push({ key: "ph", label: "pH", current: r.ph, unit: "", min, max, ideal, status: s, actions,
      tip: "Adjust alkalinity before pH — TA stabilizes pH and affects how much chemical is needed." })
  }

  // ── Total Alkalinity ─────────────────────────────────────────────────────
  {
    const min = 80, max = 120, ideal = 100
    const s: DoseStatus = r.ta < min ? "low" : r.ta > max ? "high" : "ok"
    const actions: DoseAction[] = []
    if (s === "low") {
      // 1.4 lbs baking soda raises TA 10 ppm per 10k gal
      const deficit = ideal - r.ta
      actions.push({ chemical: "Baking soda (sodium bicarbonate)", amount: fmtLbs((1.4 / 10) * deficit * M),
        note: "Add in increments. Retest after 4–6 hrs of full circulation before adding more." })
    } else if (s === "high") {
      // 26 fl oz muriatic acid lowers TA 10 ppm per 10k gal
      const excess = r.ta - ideal
      actions.push({ chemical: "Muriatic acid (31.45%)", amount: fmtFlOz((26 / 10) * excess * M),
        note: "Turn pump off. Add acid near the deep end. Run pump 1 hr later. Aerate to bring pH back up without raising TA." })
    }
    out.push({ key: "ta", label: "Total Alkalinity", current: r.ta, unit: "ppm", min, max, ideal, status: s, actions,
      tip: "Low TA causes pH to swing wildly. High TA makes pH stubbornly resistant to adjustment." })
  }

  // ── Calcium Hardness ─────────────────────────────────────────────────────
  {
    const min = 200, max = 400, ideal = 300
    const s: DoseStatus = r.ch < min ? "low" : r.ch > max ? "high" : "ok"
    const actions: DoseAction[] = []
    if (s === "low") {
      // 1.25 lbs calcium chloride raises CH 10 ppm per 10k gal
      const deficit = ideal - r.ch
      actions.push({ chemical: "Calcium chloride (77–80%)", amount: fmtLbs((1.25 / 10) * deficit * M),
        note: "Add directly — do not pre-dissolve. The reaction generates heat. Add in portions over several hours." })
    } else if (s === "high") {
      actions.push({ chemical: "Partial drain & refill", amount: fmtDrain((r.ch - ideal) / r.ch),
        note: "No chemical lowers calcium. Drain the indicated percentage and refill with fresh water." })
    }
    out.push({ key: "ch", label: "Calcium Hardness", current: r.ch, unit: "ppm", min, max, ideal, status: s, actions,
      tip: "Low calcium aggressively dissolves plaster and corrodes metal equipment. High calcium causes scale and cloudy water." })
  }

  // ── Cyanuric Acid ────────────────────────────────────────────────────────
  {
    const min = 30, max = 50, ideal = 40
    const s: DoseStatus = r.cya < min ? "low" : r.cya > max ? "high" : "ok"
    const actions: DoseAction[] = []
    if (s === "low") {
      // 1.3 lbs cyanuric acid raises CYA 10 ppm per 10k gal
      const deficit = ideal - r.cya
      actions.push({ chemical: "Cyanuric acid (stabilizer)", amount: fmtLbs((1.3 / 10) * deficit * M),
        note: "Pre-dissolve in a bucket of warm water. May take 24–48 hrs to fully register on a test kit." })
    } else if (s === "high") {
      actions.push({ chemical: "Partial drain & refill", amount: fmtDrain((r.cya - ideal) / r.cya),
        note: "CYA cannot be reduced chemically. Drain and refill to dilute. Above 80 ppm causes chlorine lock." })
    }
    out.push({ key: "cya", label: "Cyanuric Acid (Stabilizer)", current: r.cya, unit: "ppm", min, max, ideal, status: s, actions,
      tip: "Outdoor pools need CYA to prevent UV from destroying chlorine. Indoor pools generally don't need it." })
  }

  // ── Salt (saltwater pools only) ──────────────────────────────────────────
  if (r.saltwater) {
    const min = 2700, max = 3400, ideal = 3200
    const s: DoseStatus = r.salt < min ? "low" : r.salt > max ? "high" : "ok"
    const actions: DoseAction[] = []
    if (s === "low") {
      // 1 lb salt raises 10k gal by ~12 ppm → (1/12) lbs per ppm per 10k gal
      const deficit = ideal - r.salt
      actions.push({ chemical: "Pool salt (NaCl, 99.8%+ purity)", amount: fmtLbs((deficit / 12) * M),
        note: "Add in the shallow end with pump running. Allow 24 hrs to fully dissolve and circulate." })
    } else if (s === "high") {
      actions.push({ chemical: "Partial drain & refill", amount: fmtDrain((r.salt - ideal) / r.salt),
        note: "Salt cannot be removed chemically. Dilute with fresh water." })
    }
    out.push({ key: "salt", label: "Salt Level", current: r.salt, unit: "ppm", min, max, ideal, status: s, actions,
      tip: "Most salt chlorine generators run best at 3,000–3,200 ppm. Check your SWG manual for exact targets." })
  }

  return out
}
