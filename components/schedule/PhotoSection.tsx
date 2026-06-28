"use client"

import { useRef } from "react"
import { Camera, X } from "lucide-react"

export default function PhotoSection({
  photos,
  previews,
  onAdd,
  onRemove,
}: {
  photos: File[]
  previews: string[]
  onAdd: (files: File[]) => void
  onRemove: (i: number) => void
}) {
  const fileRef = useRef<HTMLInputElement>(null)

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files
    if (!files) return
    onAdd(Array.from(files))
    if (fileRef.current) fileRef.current.value = ""
  }

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">Photos</label>
      {previews.length > 0 && (
        <div className="grid grid-cols-3 gap-2 mb-2">
          {previews.map((src, i) => (
            <div key={i} className="relative rounded-lg overflow-hidden aspect-square bg-gray-100">
              <img src={src} alt="" className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => onRemove(i)}
                className="absolute top-1 right-1 bg-black/60 rounded-full p-0.5 text-white hover:bg-red-600 transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        multiple
        capture="environment"
        className="hidden"
        onChange={handleChange}
      />
      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-dashed border-gray-300 text-sm font-medium text-gray-500 hover:border-sky-400 hover:text-sky-600 hover:bg-sky-50 active:bg-sky-100 transition-colors"
      >
        <Camera className="w-5 h-5" />
        {photos.length === 0 ? "Add photos" : `${photos.length} photo${photos.length !== 1 ? "s" : ""} · tap to add more`}
      </button>
    </div>
  )
}
