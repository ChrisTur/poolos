"use client"

import { useState } from "react"
import { ChevronDown, ChevronUp, Clock, Trash2, ToggleLeft, ToggleRight, Plus, GripVertical } from "lucide-react"
import Button from "@/components/ui/Button"
import ConfirmButton from "@/components/ui/ConfirmButton"
import type { JobTemplate, JobTemplateStep } from "@/app/generated/prisma/client"

type TemplateWithSteps = JobTemplate & { steps: JobTemplateStep[] }

export default function JobTemplateEditor({
  template,
  updateAction,
  deleteAction,
  toggleAction,
  addStepAction,
  deleteStepAction,
}: {
  template: TemplateWithSteps
  updateAction: (formData: FormData) => Promise<void>
  deleteAction: () => Promise<void>
  toggleAction: () => Promise<void>
  addStepAction: (formData: FormData) => Promise<void>
  deleteStepAction: (stepId: string) => Promise<void>
}) {
  const [open, setOpen] = useState(false)

  return (
    <div className={`rounded-xl border overflow-hidden transition-colors ${template.isActive ? "border-gray-200 bg-white" : "border-gray-100 bg-gray-50"}`}>
      {/* Header row */}
      <div className="flex items-center gap-3 px-4 py-3.5">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex-1 flex items-start gap-3 text-left min-w-0"
        >
          <div className="min-w-0 flex-1">
            <p className={`text-sm font-semibold truncate ${template.isActive ? "text-gray-900" : "text-gray-400"}`}>
              {template.name}
            </p>
            {template.description && (
              <p className="text-xs text-gray-400 mt-0.5 truncate">{template.description}</p>
            )}
            <div className="flex items-center gap-3 mt-1">
              <span className="text-xs text-gray-400">{template.steps.length} step{template.steps.length !== 1 ? "s" : ""}</span>
              {template.estimatedMinutes && (
                <span className="inline-flex items-center gap-1 text-xs text-gray-400">
                  <Clock className="w-3 h-3" />
                  {template.estimatedMinutes}m
                </span>
              )}
              {!template.isActive && (
                <span className="text-xs font-medium text-gray-400 bg-gray-100 rounded-full px-2 py-0.5">Inactive</span>
              )}
            </div>
          </div>
          {open ? <ChevronUp className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" /> : <ChevronDown className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />}
        </button>

        <form action={toggleAction}>
          <button type="submit" title={template.isActive ? "Deactivate" : "Activate"} className="text-gray-400 hover:text-sky-600 transition-colors">
            {template.isActive
              ? <ToggleRight className="w-5 h-5 text-sky-600" />
              : <ToggleLeft className="w-5 h-5" />}
          </button>
        </form>
        <ConfirmButton
          action={deleteAction}
          confirm={`Delete template "${template.name}"?`}
          variant="ghost"
          size="sm"
          className="text-gray-300 hover:text-red-500 !px-1 !py-1"
        >
          <Trash2 className="w-4 h-4" />
        </ConfirmButton>
      </div>

      {/* Expanded editor */}
      {open && (
        <div className="border-t border-gray-100 px-4 py-4 space-y-5">
          {/* Edit metadata */}
          <form action={updateAction} className="space-y-3">
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Name</label>
                <input
                  name="name"
                  defaultValue={template.name}
                  required
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Est. duration (minutes)</label>
                <input
                  name="estimatedMinutes"
                  type="number"
                  inputMode="numeric"
                  min="1"
                  defaultValue={template.estimatedMinutes ?? ""}
                  placeholder="60"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
              <input
                name="description"
                defaultValue={template.description ?? ""}
                placeholder="Short description"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Default notes / customer message</label>
              <textarea
                name="defaultNotes"
                defaultValue={template.defaultNotes ?? ""}
                rows={2}
                placeholder="Pre-filled when this template is selected on the visit form…"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-500 resize-none"
              />
            </div>
            <Button type="submit" size="sm" variant="secondary">Save changes</Button>
          </form>

          {/* Steps */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Job Steps</p>
            {template.steps.length === 0 ? (
              <p className="text-xs text-gray-400 py-2">No steps yet — add steps below.</p>
            ) : (
              <ul className="divide-y divide-gray-100 mb-3">
                {template.steps.map((step, i) => {
                  const deleteStep = deleteStepAction.bind(null, step.id)
                  return (
                    <li key={step.id} className="flex items-center gap-3 py-2.5 first:pt-0">
                      <GripVertical className="w-3.5 h-3.5 text-gray-200 shrink-0" />
                      <span className="w-5 h-5 rounded-full bg-gray-100 text-gray-500 text-[10px] font-bold flex items-center justify-center shrink-0">
                        {i + 1}
                      </span>
                      <span className="flex-1 text-sm text-gray-800">{step.label}</span>
                      <ConfirmButton
                        action={deleteStep}
                        confirm={`Remove step "${step.label}"?`}
                        variant="ghost"
                        size="sm"
                        className="text-gray-300 hover:text-red-500 !px-1 !py-1 shrink-0"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </ConfirmButton>
                    </li>
                  )
                })}
              </ul>
            )}
            <form action={addStepAction} className="flex gap-2">
              <input
                name="label"
                required
                placeholder="e.g. Check skimmer baskets"
                className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
              <Button type="submit" size="sm">
                <Plus className="w-4 h-4" /> Add
              </Button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
