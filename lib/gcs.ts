import { Storage } from "@google-cloud/storage"

function getStorage() {
  const raw = process.env.GCS_SERVICE_ACCOUNT_KEY
  if (!raw) throw new Error("GCS_SERVICE_ACCOUNT_KEY is not set")
  const credentials = JSON.parse(raw)
  return new Storage({ credentials })
}

// Singleton — reuse across invocations in the same function instance
let _storage: Storage | null = null
function storage() {
  if (!_storage) _storage = getStorage()
  return _storage
}

export function bucket() {
  const name = process.env.GCS_BUCKET
  if (!name) throw new Error("GCS_BUCKET is not set")
  return storage().bucket(name)
}

export function publicUrl(key: string) {
  const base = process.env.GCS_PUBLIC_URL
  if (!base) throw new Error("GCS_PUBLIC_URL is not set")
  return `${base}/${key}`
}
