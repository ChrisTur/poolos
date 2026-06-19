import { NextResponse } from "next/server"

export async function GET() {
  const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
  if (!key) return NextResponse.json({ error: "NEXT_PUBLIC_GOOGLE_MAPS_API_KEY is not set" })

  const address = "1600 Amphitheatre Parkway, Mountain View, CA 94043"
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${key}`

  try {
    const res = await fetch(url, { cache: "no-store" })
    const data = await res.json()
    return NextResponse.json({
      keyPresent: true,
      keyPrefix: key.slice(0, 8) + "...",
      status: data.status,
      errorMessage: data.error_message,
      resultCount: data.results?.length ?? 0,
      firstResult: data.results?.[0]?.geometry?.location ?? null,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message })
  }
}
