import { formatDate } from "@/lib/utils"
import { statusBadge } from "@/components/ui/Badge"
import { chemStatus, CHEM_RANGES, STATUS_BG } from "@/lib/chemistry"
import type { ServiceVisit, ChemicalUsage } from "@/app/generated/prisma/client"

type VisitWithChemicals = ServiceVisit & { chemicalUsages: ChemicalUsage[] }

export default function CustomerVisitHistory({ visits }: { visits: VisitWithChemicals[] }) {
  if (visits.length === 0) {
    return <p className="text-sm text-gray-400 px-5 py-4">No visits logged yet.</p>
  }

  return (
    <div className="divide-y divide-gray-50">
      {visits.map((v) => {
        const chemReadings = [
          { key: "chlorine"   as const, label: "Cl",   value: v.chlorine   },
          { key: "ph"         as const, label: "pH",   value: v.ph         },
          { key: "alkalinity" as const, label: "Alk",  value: v.alkalinity },
          { key: "calcium"    as const, label: "Ca",   value: v.calcium    },
          { key: null,                  label: "CYA",  value: v.cya        },
          { key: null,                  label: "Salt", value: v.salt       },
        ].filter((r) => r.value != null)

        return (
          <div key={v.id} className="px-5 py-3">
            <div className="flex items-start justify-between mb-1.5">
              <div>
                <p className="text-sm font-medium text-gray-900">{formatDate(v.visitedAt)}</p>
                {v.notes && <p className="text-gray-500 text-xs mt-0.5">{v.notes}</p>}
              </div>
              {statusBadge(v.status)}
            </div>
            {chemReadings.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                {chemReadings.map((r) => {
                  const s     = r.key ? chemStatus(r.key, r.value) : null
                  const range = r.key ? CHEM_RANGES[r.key] : null
                  const title = range
                    ? `${range.label}: ${r.value}${range.unit ? " " + range.unit : ""} (normal ${range.low}–${range.high}${range.unit ? " " + range.unit : ""})`
                    : `${r.label}: ${r.value}`
                  return (
                    <span
                      key={r.label}
                      title={title}
                      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium ${s ? STATUS_BG[s] : "bg-gray-50 text-gray-500 border-gray-200"}`}
                    >
                      {r.label}: {r.value}
                      {s === "low"  && " ▼"}
                      {s === "high" && " ▲"}
                    </span>
                  )
                })}
              </div>
            )}
            {v.chemicalUsages.length > 0 && (
              <div className="mt-2">
                <p className="text-xs font-medium text-gray-500 mb-1">Chemicals used:</p>
                <div className="flex flex-wrap gap-1">
                  {v.chemicalUsages.map((cu) => (
                    <span
                      key={cu.id}
                      className="inline-flex items-center text-xs bg-purple-50 text-purple-700 border border-purple-200 rounded-full px-2 py-0.5"
                    >
                      {cu.productName} {cu.quantity} {cu.unit}
                      {cu.totalCost > 0 && ` ($${cu.totalCost.toFixed(2)})`}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

