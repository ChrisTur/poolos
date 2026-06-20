"use client"

import { useRef, useState } from "react"
import { getUploadUrl, saveAttachment, deleteAttachment } from "@/lib/actions/attachments"
import { Paperclip, X, Loader2, Image as ImageIcon, FileText } from "lucide-react"

type Attachment = {
  id: string
  key: string
  filename: string
  mimeType: string | null
  size: number | null
  createdAt: Date
}

const GCS_PUBLIC_URL = process.env.NEXT_PUBLIC_GCS_PUBLIC_URL ?? ""

function fileUrl(key: string) {
  return `${GCS_PUBLIC_URL}/${key}`
}

function formatSize(bytes: number | null) {
  if (!bytes) return ""
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default function FileUpload({
  customerId,
  serviceVisitId,
  attachments: initial,
}: {
  customerId?: string
  serviceVisitId?: string
  attachments: Attachment[]
}) {
  const [attachments, setAttachments] = useState(initial)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return
    setUploading(true)
    setError(null)

    for (const file of Array.from(files)) {
      try {
        // 1. Get presigned upload URL from server
        const { url, key } = await getUploadUrl(file.name, file.type)

        // 2. PUT directly to GCS
        const res = await fetch(url, {
          method: "PUT",
          body: file,
          headers: { "Content-Type": file.type },
        })
        if (!res.ok) throw new Error("Upload failed")

        // 3. Save record in DB
        await saveAttachment({
          key,
          filename: file.name,
          mimeType: file.type,
          size: file.size,
          customerId,
          serviceVisitId,
        })

        // Optimistic UI update
        setAttachments((prev) => [
          ...prev,
          {
            id: key, // temporary id until revalidation
            key,
            filename: file.name,
            mimeType: file.type,
            size: file.size,
            createdAt: new Date(),
          },
        ])
      } catch {
        setError(`Failed to upload ${file.name}`)
      }
    }

    setUploading(false)
    if (inputRef.current) inputRef.current.value = ""
  }

  async function handleDelete(id: string) {
    await deleteAttachment(id, customerId)
    setAttachments((prev) => prev.filter((a) => a.id !== id))
  }

  const isImage = (mimeType: string | null) => mimeType?.startsWith("image/")

  return (
    <div className="space-y-3">
      {attachments.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {attachments.map((a) => (
            <div key={a.id} className="relative group rounded-lg border border-gray-200 overflow-hidden bg-gray-50">
              {isImage(a.mimeType) ? (
                <a href={fileUrl(a.key)} target="_blank" rel="noopener noreferrer">
                  <img
                    src={fileUrl(a.key)}
                    alt={a.filename}
                    className="w-full h-24 object-cover"
                  />
                </a>
              ) : (
                <a
                  href={fileUrl(a.key)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-col items-center justify-center gap-1 h-24 text-gray-400 hover:text-gray-600"
                >
                  <FileText className="w-8 h-8" />
                  <span className="text-[11px] text-center px-1 truncate w-full text-center">{a.filename}</span>
                </a>
              )}
              <div className="absolute bottom-0 left-0 right-0 bg-black/50 px-1.5 py-0.5 text-[10px] text-white truncate opacity-0 group-hover:opacity-100 transition-opacity">
                {a.filename} {a.size ? `· ${formatSize(a.size)}` : ""}
              </div>
              <button
                onClick={() => handleDelete(a.id)}
                className="absolute top-1 right-1 bg-black/60 rounded-full p-0.5 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept="image/*,.pdf,.doc,.docx"
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-sky-600 disabled:opacity-50"
        >
          {uploading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Paperclip className="w-4 h-4" />
          )}
          {uploading ? "Uploading…" : "Attach files"}
        </button>
        {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
      </div>
    </div>
  )
}
