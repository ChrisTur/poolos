import { notFound } from "next/navigation"
import { getPlansFromDb } from "@/lib/plans-db"
import { updatePlan } from "@/lib/actions/admin-plans"
import { FEATURE_LABELS, PLAN_IDS } from "@/lib/plans"
import { CheckCircle2 } from "lucide-react"

export const dynamic = "force-dynamic"

const FEATURE_GROUPS: { label: string; keys: (keyof typeof FEATURE_LABELS)[] }[] = [
  {
    label: "Core",
    keys: ["invoicing", "routes", "customerPortal", "chemicalTracking", "emailNotifications"],
  },
  {
    label: "Reporting",
    keys: ["reports", "csvExport"],
  },
  {
    label: "Advanced",
    keys: ["bulkInvoicing", "fileAttachments", "customBranding"],
  },
  {
    label: "Coming soon",
    keys: ["smsNotifications", "calendarView", "techAssignment", "autoInvoicing", "quickbooksExport"],
  },
]

export default async function EditPlanPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ saved?: string }>
}) {
  const { id } = await params
  const sp = await searchParams
  if (!PLAN_IDS.includes(id as any)) notFound()

  const plans = await getPlansFromDb()
  const plan  = plans.find((p) => p.id === id)
  if (!plan) notFound()

  return (
    <div className="max-w-2xl space-y-6">
      {sp.saved && (
        <div className="flex items-center gap-2 rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-800">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-green-600" />
          Changes saved — live on the site now.
        </div>
      )}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${plan.badge}`}>{plan.label}</span>
        </div>
        <p className="text-xs text-gray-400">Changes apply to the marketing page and billing immediately.</p>
      </div>

      <form action={updatePlan} className="space-y-6">
        <input type="hidden" name="id" value={plan.id} />

        {/* Identity */}
        <section className="bg-white rounded-2xl border border-gray-200 p-5 space-y-4">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Identity</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Label" name="label" defaultValue={plan.label} />
            <Field label="Badge classes (Tailwind)" name="badge" defaultValue={plan.badge} />
          </div>
          <Field label="Description" name="description" defaultValue={plan.description} />
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              name="mostPopular"
              id="mostPopular"
              defaultChecked={plan.mostPopular}
              className="w-4 h-4 rounded border-gray-300 text-sky-600 focus:ring-sky-500"
            />
            <label htmlFor="mostPopular" className="text-sm font-medium text-gray-700">
              Mark as most popular
            </label>
          </div>
        </section>

        {/* Pricing */}
        <section className="bg-white rounded-2xl border border-gray-200 p-5 space-y-4">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Pricing</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field
              label="Monthly price ($ — leave blank for free)"
              name="priceMonthly"
              type="number"
              defaultValue={plan.priceMonthly ?? ""}
            />
            <Field
              label="Annual price ($ total — leave blank to disable)"
              name="priceAnnual"
              type="number"
              defaultValue={plan.priceAnnual ?? ""}
            />
          </div>
        </section>

        {/* Limits */}
        <section className="bg-white rounded-2xl border border-gray-200 p-5 space-y-4">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Limits</h2>
          <p className="text-xs text-gray-400">Use <code>-1</code> for unlimited.</p>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field
              label="Customer limit"
              name="limitCustomers"
              type="number"
              defaultValue={plan.limits.customers === Infinity ? -1 : plan.limits.customers}
            />
            <Field
              label="Staff / user limit"
              name="limitStaff"
              type="number"
              defaultValue={plan.limits.staff === Infinity ? -1 : plan.limits.staff}
            />
          </div>
        </section>

        {/* Highlights */}
        <section className="bg-white rounded-2xl border border-gray-200 p-5 space-y-4">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Marketing highlights</h2>
          <p className="text-xs text-gray-400">One bullet per line. Shown on the public pricing page.</p>
          <textarea
            name="highlights"
            rows={plan.highlights.length + 2}
            defaultValue={plan.highlights.join("\n")}
            className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 font-mono"
          />
        </section>

        {/* Feature flags */}
        <section className="bg-white rounded-2xl border border-gray-200 p-5 space-y-5">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Feature flags</h2>

          {FEATURE_GROUPS.map((group) => (
            <div key={group.label}>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">{group.label}</p>
              <div className="space-y-2">
                {group.keys.map((key) => (
                  <label key={key} className="flex items-center gap-3 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      name={key}
                      defaultChecked={plan.features[key]}
                      className="w-4 h-4 rounded border-gray-300 text-sky-600 focus:ring-sky-500"
                    />
                    <span className="text-sm text-gray-700">{FEATURE_LABELS[key]}</span>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </section>

        <button
          type="submit"
          className="bg-sky-600 text-white text-sm font-semibold px-6 py-2.5 rounded-xl hover:bg-sky-700 transition-colors"
        >
          Save changes
        </button>
      </form>
    </div>
  )
}

function Field({
  label,
  name,
  defaultValue,
  type = "text",
}: {
  label: string
  name: string
  defaultValue?: string | number
  type?: "text" | "number"
}) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-medium text-gray-600">{label}</label>
      <input
        type={type}
        name={name}
        defaultValue={defaultValue}
        className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
      />
    </div>
  )
}
