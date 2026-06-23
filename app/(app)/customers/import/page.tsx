"use client"

import { useActionState, useRef, useState } from "react"
import Link from "next/link"
import { importCustomersFromCSV } from "@/lib/actions/import-customers"
import { Upload, FileText, CheckCircle2, AlertTriangle, ArrowLeft, Download, X } from "lucide-react"

export default function ImportCustomersPage() {
  const [state, action, pending] = useActionState(importCustomersFromCSV, null)
  const [dragOver, setDragOver] = useState(false)
  const [fileName, setFileName] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const formRef = useRef<HTMLFormElement>(null)

  const handleFile = (file: File) => {
    if (!file.name.endsWith(".csv")) return
    setFileName(file.name)
    // Manually set file on the hidden input via DataTransfer
    const dt = new DataTransfer()
    dt.items.add(file)
    if (fileRef.current) fileRef.current.files = dt.files
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/customers"
          className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Import customers</h1>
          <p className="text-sm text-gray-500 mt-0.5">Upload a CSV to bulk-add customers to your account.</p>
        </div>
      </div>

      {/* Template download */}
      <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
        <div className="flex items-center gap-3">
          <FileText className="w-5 h-5 text-gray-400 shrink-0" />
          <div>
            <p className="text-sm font-medium text-gray-700">Need a template?</p>
            <p className="text-xs text-gray-500">Download our CSV template with all supported columns.</p>
          </div>
        </div>
        <a
          href="/api/customers/import-template"
          download="poolos-customers-template.csv"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-sky-600 hover:text-sky-700 shrink-0"
        >
          <Download className="w-4 h-4" />
          Download
        </a>
      </div>

      {/* Results */}
      {state && (
        <div className="space-y-3">
          {state.imported > 0 && (
            <div className="flex items-center gap-3 rounded-xl bg-green-50 border border-green-200 px-4 py-3">
              <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-green-800">
                  {state.imported} customer{state.imported !== 1 ? "s" : ""} imported successfully
                </p>
                <Link href="/customers" className="text-xs text-green-700 underline hover:text-green-900">
                  View customers →
                </Link>
              </div>
            </div>
          )}

          {state.limitReached && (
            <div className="flex items-start gap-3 rounded-xl bg-amber-50 border border-amber-200 px-4 py-3">
              <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
              <p className="text-sm text-amber-800">
                Your plan's customer limit was reached during import. Some rows were skipped.{" "}
                <Link href="/settings/billing" className="underline font-medium">Upgrade your plan</Link> to import more.
              </p>
            </div>
          )}

          {state.skipped.length > 0 && (
            <div className="rounded-xl border border-red-200 bg-red-50 overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-red-200">
                <X className="w-4 h-4 text-red-500" />
                <p className="text-sm font-semibold text-red-800">
                  {state.skipped.length} row{state.skipped.length !== 1 ? "s" : ""} skipped
                </p>
              </div>
              <ul className="divide-y divide-red-100 max-h-64 overflow-y-auto">
                {state.skipped.map((s, i) => (
                  <li key={i} className="px-4 py-2.5">
                    <p className="text-xs font-medium text-red-700">
                      {s.row > 0 ? `Row ${s.row}: ` : ""}{s.reason}
                    </p>
                    {s.data && (
                      <p className="text-xs text-red-400 truncate mt-0.5 font-mono">{s.data}</p>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {state.imported === 0 && state.skipped.length === 0 && (
            <p className="text-sm text-gray-500 text-center py-4">No rows were found in the file.</p>
          )}
        </div>
      )}

      {/* Upload form */}
      <form ref={formRef} action={action} className="space-y-4">
        {/* Drop zone */}
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault()
            setDragOver(false)
            const file = e.dataTransfer.files[0]
            if (file) handleFile(file)
          }}
          onClick={() => fileRef.current?.click()}
          className={`relative flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed px-6 py-12 cursor-pointer transition-colors ${
            dragOver
              ? "border-sky-400 bg-sky-50"
              : fileName
              ? "border-green-400 bg-green-50"
              : "border-gray-300 bg-gray-50 hover:border-sky-400 hover:bg-sky-50"
          }`}
        >
          <Upload className={`w-8 h-8 ${fileName ? "text-green-500" : "text-gray-400"}`} />
          {fileName ? (
            <>
              <p className="text-sm font-medium text-green-700">{fileName}</p>
              <p className="text-xs text-green-600">Click to choose a different file</p>
            </>
          ) : (
            <>
              <p className="text-sm font-medium text-gray-700">Drop your CSV here, or click to browse</p>
              <p className="text-xs text-gray-400">Max 5 MB · .csv files only</p>
            </>
          )}
          <input
            ref={fileRef}
            type="file"
            name="file"
            accept=".csv,text/csv"
            className="sr-only"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) setFileName(file.name)
            }}
          />
        </div>

        <button
          type="submit"
          disabled={pending || !fileName}
          className="w-full inline-flex items-center justify-center gap-2 bg-sky-600 text-white font-semibold text-sm px-5 py-3 rounded-xl hover:bg-sky-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Upload className="w-4 h-4" />
          {pending ? "Importing…" : "Import customers"}
        </button>
      </form>

      {/* Column reference */}
      <div className="rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
          <p className="text-sm font-semibold text-gray-700">Supported columns</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="px-4 py-2 text-left font-medium text-gray-500">Column</th>
                <th className="px-4 py-2 text-left font-medium text-gray-500">Required</th>
                <th className="px-4 py-2 text-left font-medium text-gray-500">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 text-gray-600">
              {[
                ["firstName",        "Yes", ""],
                ["lastName",         "Yes", ""],
                ["address",          "Yes", "Street address"],
                ["city",             "Yes", ""],
                ["state",            "Yes", "Two-letter code, e.g. TX"],
                ["zip",              "Yes", ""],
                ["email",            "No",  ""],
                ["phone",            "No",  ""],
                ["monthlyRate",      "No",  "Number, e.g. 150 or $150.00"],
                ["poolType",         "No",  "e.g. inground, above ground"],
                ["poolSize",         "No",  "e.g. 15,000 gallons"],
                ["serviceFrequency", "No",  "weekly · biweekly · monthly"],
                ["status",           "No",  "active (default) · inactive · suspended"],
              ].map(([col, req, note]) => (
                <tr key={col}>
                  <td className="px-4 py-2 font-mono">{col}</td>
                  <td className="px-4 py-2">
                    {req === "Yes"
                      ? <span className="text-red-600 font-medium">Required</span>
                      : <span className="text-gray-400">Optional</span>}
                  </td>
                  <td className="px-4 py-2 text-gray-400">{note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
