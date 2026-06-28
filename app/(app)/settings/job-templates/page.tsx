import { db } from "@/lib/db"
import { requirePermission } from "@/lib/session"
import Card, { CardHeader, CardBody } from "@/components/ui/Card"
import Button from "@/components/ui/Button"
import ConfirmButton from "@/components/ui/ConfirmButton"
import {
  createJobTemplate,
  updateJobTemplate,
  deleteJobTemplate,
  toggleJobTemplate,
  addTemplateStep,
  deleteTemplateStep,
} from "@/lib/actions/jobTemplates"
import { Layers, Plus, Trash2, ToggleLeft, ToggleRight, Clock, ChevronDown } from "lucide-react"
import JobTemplateEditor from "@/components/settings/JobTemplateEditor"

export const dynamic = "force-dynamic"

// Built-in presets shown when a company has no templates yet
const PRESETS = [
  {
    name: "Pool Opening",
    description: "Spring startup — get the pool ready for the season.",
    estimatedMinutes: 120,
    defaultNotes: "Pool opening complete. Removed cover, inspected equipment, balanced chemicals. Pool will be swim-ready within 24–48 hours.",
    steps: [
      "Remove and clean winter cover",
      "Reinstall ladders, rails, and diving board",
      "Reconnect pump, filter, and heater",
      "Fill pool to proper water level",
      "Prime pump and restore circulation",
      "Test and balance water chemistry",
      "Add start-up chemical treatment",
      "Check for leaks and inspect equipment",
    ],
  },
  {
    name: "Pool Closing",
    description: "Fall winterization — protect the pool through the off-season.",
    estimatedMinutes: 90,
    defaultNotes: "Pool closing complete. Water level lowered, lines blown out, and cover installed. Chemical treatment added for winterization.",
    steps: [
      "Balance water chemistry for winter",
      "Add winterizing chemical treatment",
      "Lower water below skimmer line",
      "Blow out and plug all return lines",
      "Drain pump, filter, heater, and chlorinator",
      "Remove ladders, rails, and accessories",
      "Install winter cover and secure anchors",
      "Store equipment safely",
    ],
  },
  {
    name: "Filter Clean",
    description: "Deep clean for cartridge or DE filter.",
    estimatedMinutes: 45,
    defaultNotes: "Filter cleaned and serviced. Flow rate restored. System running at normal pressure.",
    steps: [
      "Turn off pump and relieve system pressure",
      "Remove and disassemble filter",
      "Inspect filter media for damage or wear",
      "Clean cartridges or grids thoroughly",
      "Inspect O-rings and replace if needed",
      "Reassemble filter and restore flow",
      "Record clean pressure on filter gauge",
      "Test water chemistry",
    ],
  },
  {
    name: "Acid Wash",
    description: "Drain and acid wash to remove staining and calcium buildup.",
    estimatedMinutes: 240,
    defaultNotes: "Acid wash complete. Pool drained, surfaces treated, and refilled. Full chemical balance will take 24–48 hours.",
    steps: [
      "Drain pool completely",
      "Inspect surface for cracks or damage",
      "Apply muriatic acid solution to surfaces",
      "Scrub walls and floor with brush",
      "Neutralize acid with soda ash solution",
      "Rinse pool thoroughly",
      "Refill pool to proper level",
      "Balance water chemistry",
    ],
  },
  {
    name: "Pump Prime",
    description: "Troubleshoot and restore pump prime after air intrusion.",
    estimatedMinutes: 30,
    defaultNotes: "Pump primed and flow restored. Inspected for air leaks and verified normal operating pressure.",
    steps: [
      "Turn off pump and close discharge valve",
      "Remove pump lid and inspect basket",
      "Fill pump housing with water",
      "Reinstall lid and hand-tighten",
      "Slowly open suction valve",
      "Start pump and check for prime",
      "Inspect for air leaks at unions and fittings",
      "Verify normal operating pressure on gauge",
    ],
  },
]

export default async function JobTemplatesPage() {
  const { companyId } = await requirePermission("settings.templates")

  const templates = await db.jobTemplate.findMany({
    where: { companyId },
    orderBy: { createdAt: "asc" },
    include: { steps: { orderBy: { position: "asc" } } },
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Job Templates</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          One-click workflows for common jobs. Select a template when logging a visit to pre-fill steps and notes.
        </p>
      </div>

      {/* Existing templates */}
      {templates.length === 0 ? (
        <Card>
          <CardBody>
            <div className="py-8 text-center">
              <Layers className="w-10 h-10 text-gray-200 mx-auto mb-3" />
              <p className="text-sm font-medium text-gray-500">No templates yet</p>
              <p className="text-xs text-gray-400 mt-1">Create your first template below, or use one of the presets to get started.</p>
            </div>
          </CardBody>
        </Card>
      ) : (
        <div className="space-y-4">
          {templates.map((t) => {
            const deleteAction  = deleteJobTemplate.bind(null, t.id)
            const toggleAction  = toggleJobTemplate.bind(null, t.id, !t.isActive)
            const updateAction  = updateJobTemplate.bind(null, t.id)
            const addStepAction = addTemplateStep.bind(null, t.id)
            return (
              <JobTemplateEditor
                key={t.id}
                template={t}
                updateAction={updateAction}
                deleteAction={deleteAction}
                toggleAction={toggleAction}
                addStepAction={addStepAction}
                deleteStepAction={deleteTemplateStep}
              />
            )
          })}
        </div>
      )}

      {/* Create new template */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Plus className="w-4 h-4 text-gray-400" />
            <h2 className="font-semibold text-gray-900 text-sm">New Template</h2>
          </div>
        </CardHeader>
        <CardBody>
          <form action={createJobTemplate} className="space-y-3">
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Template name *</label>
                <input
                  name="name"
                  required
                  placeholder="e.g. Filter Clean"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Est. duration (minutes)</label>
                <input
                  name="estimatedMinutes"
                  type="number"
                  inputMode="numeric"
                  min="1"
                  placeholder="60"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Description (optional)</label>
              <input
                name="description"
                placeholder="Short description shown on the template picker"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Default notes / customer message</label>
              <textarea
                name="defaultNotes"
                rows={2}
                placeholder="Pre-filled message shown to the tech when this template is selected…"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-500 resize-none"
              />
            </div>
            <Button type="submit" size="sm">
              <Plus className="w-4 h-4" /> Create Template
            </Button>
          </form>
        </CardBody>
      </Card>

      {/* Built-in presets */}
      <div>
        <h2 className="text-sm font-semibold text-gray-700 mb-3">Quick-start presets</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {PRESETS.map((preset) => {
            const alreadyExists = templates.some((t) => t.name === preset.name)
            const createPresetAction = async () => {
              "use server"
              const { companyId: cId } = await requirePermission("settings.templates")
              await db.jobTemplate.create({
                data: {
                  companyId: cId,
                  name: preset.name,
                  description: preset.description,
                  defaultNotes: preset.defaultNotes,
                  estimatedMinutes: preset.estimatedMinutes,
                  steps: {
                    create: preset.steps.map((label, i) => ({ label, position: i })),
                  },
                },
              })
            }
            return (
              <div key={preset.name} className="rounded-xl border border-gray-200 bg-white p-4 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{preset.name}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{preset.description}</p>
                  </div>
                  {preset.estimatedMinutes && (
                    <span className="shrink-0 inline-flex items-center gap-1 text-xs text-gray-400">
                      <Clock className="w-3 h-3" />
                      {preset.estimatedMinutes}m
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-400">{preset.steps.length} steps</p>
                {alreadyExists ? (
                  <p className="text-xs text-green-600 font-medium">Already added</p>
                ) : (
                  <form action={createPresetAction}>
                    <button
                      type="submit"
                      className="text-xs font-medium text-sky-600 hover:text-sky-800 transition-colors"
                    >
                      + Add to my templates
                    </button>
                  </form>
                )}
              </div>
            )
          })}
        </div>
      </div>

      <div className="rounded-xl bg-sky-50 border border-sky-200 px-4 py-3 text-sm text-sky-800">
        <strong>How it works:</strong> When logging a visit, techs can select a job type from the template picker.
        The template pre-fills the notes and shows a job-specific step checklist that must be completed before submitting.
      </div>
    </div>
  )
}
