import crypto from "crypto"

// k-anonymity model: only the first 5 chars of the SHA-1 hash are sent to the API
export async function isPasswordBreached(password: string): Promise<boolean> {
  try {
    const hash = crypto.createHash("sha1").update(password).digest("hex").toUpperCase()
    const prefix = hash.slice(0, 5)
    const suffix = hash.slice(5)

    const res = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`, {
      headers: { "Add-Padding": "true" },
      next: { revalidate: 0 },
    })

    if (!res.ok) return false // fail open — don't block if API is unavailable

    const text = await res.text()
    return text.split("\n").some((line) => line.split(":")[0] === suffix)
  } catch {
    return false // fail open on network errors
  }
}
