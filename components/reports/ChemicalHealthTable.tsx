import Link from "next/link"
import { FlaskConical, ChevronRight } from "lucide-react"
import Card, { CardBody } from "@/components/ui/Card"
import { formatDate } from "@/lib/utils"
import { chemStatus, CHEM_RANGES, STATUS_BG, visitNeedsAttention } from "@/lib/chemistry"

const CHEM_KEYS = ["chlorine", "ph", "alkalinity", "calcium"] as const
type ChemKey = typeof CHEM_KEYS[number]

type ChemVisit = {
  visitedAt: Date
  chlorine:   number | null
  ph:         number | null
  alkalinity: number | null
  calcium:    number | null
}

type ChemEntry = {
  customer: { id: string; firstName: string; lastName: string }
  visit: ChemVisit | null
}

export default function ChemicalHealthTable({
  withReadings,
  noReadings,
}: {
  withReadings:   ChemEntry[]
  noReadings:     ChemEntry[]
  needsAttention: ChemEntry[]
}) {
  if (withReadings.length === 0) {
    return (
      <Card>
        <CardBody>
          <div className="text-center py-8">
            <FlaskConical className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-400">No chemical readings recorded yet.</p>
            <p className="text-xs text-gray-400 mt-1">Log readings during service visits to see health data here.</p>
          </div>
        </CardBody>
      </Card>
    )
  }

  const sorted = [...withReadings].sort((a, b) => {
    const aN = a.visit && visitNeedsAttention({ chlorine: a.visit.chlorine, ph: a.visit.ph, alkalinity: a.visit.alkalinity, calcium: a.visit.calcium }) ? 0 : 1
    const bN = b.visit && visitNeedsAttention({ chlorine: b.visit.chlorine, ph: b.visit.ph, alkalinity: b.visit.alkalinity, calcium: b.visit.calcium }) ? 0 : 1
    return aN - bN
  })

  return (
    <Card>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 text-xs text-gray-500 uppercase tracking-wide">
              <th className="px-5 py-3 text-left font-medium">Customer</th>
              <th className="px-5 py-3 text-left font-medium">Last Reading</th>
              {CHEM_KEYS.map((k) => (
                <th key={k} className="px-3 py-3 text-center font-medium">{CHEM_RANGES[k].label}</th>
              ))}
              <th className="px-5 py-3 text-right font-medium">Trends</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {sorted.map(({ customer: c, visit: v }) => (
              <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-5 py-3">
                  <Link href={`/customers/${c.id}`} className="font-medium text-gray-900 hover:text-sky-600">
                    {c.firstName} {c.lastName}
                  </Link>
                </td>
                <td className="px-5 py-3 text-xs text-gray-400">
                  {v ? formatDate(v.visitedAt) : "—"}
                </td>
                {CHEM_KEYS.map((k) => {
                  const val = v?.[k as ChemKey] ?? null
                  const s   = chemStatus(k, val)
                  return (
                    <td key={k} className="px-3 py-3 text-center">
                      {val == null ? (
                        <span className="text-gray-300">—</span>
                      ) : (
                        <span className={`inline-flex items-center justify-center rounded-full border px-2 py-0.5 text-xs font-medium ${s ? STATUS_BG[s] : "bg-gray-50 text-gray-500 border-gray-200"}`}>
                          {val}
                          {s === "low"  && " ▼"}
                          {s === "high" && " ▲"}
                        </span>
                      )}
                    </td>
                  )
                })}
                <td className="px-5 py-3 text-right">
                  <Link
                    href={`/reports/chemicals/${c.id}`}
                    className="inline-flex items-center gap-1 text-xs text-sky-600 hover:text-sky-800 font-medium"
                  >
                    View <ChevronRight className="w-3 h-3" />
                  </Link>
                </td>
              </tr>
            ))}
            {noReadings.length > 0 && (
              <tr>
                <td colSpan={7} className="px-5 py-2 text-xs text-gray-400 bg-gray-50">
                  {noReadings.length} customer{noReadings.length !== 1 ? "s" : ""} with no readings recorded
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Card>
  )
}

