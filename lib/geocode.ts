const GEOCODE_KEY =
  process.env.GOOGLE_MAPS_GEOCODING_KEY ?? process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

export async function geocodeAddress(address: string): Promise<{ lat: number; lng: number } | null> {
  if (!GEOCODE_KEY) return null
  try {
    const res = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${GEOCODE_KEY}`,
      { next: { revalidate: 60 * 60 * 24 } },
    )
    const data = await res.json()
    if (data.status !== "OK" || !data.results?.[0]) return null
    return data.results[0].geometry.location
  } catch {
    return null
  }
}

export function haversineKm(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
): number {
  const R = 6371
  const dLat = ((b.lat - a.lat) * Math.PI) / 180
  const dLng = ((b.lng - a.lng) * Math.PI) / 180
  const sinLat = Math.sin(dLat / 2)
  const sinLng = Math.sin(dLng / 2)
  const val =
    sinLat * sinLat +
    Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * sinLng * sinLng
  return 2 * R * Math.atan2(Math.sqrt(val), Math.sqrt(1 - val))
}

// Nearest-neighbor TSP heuristic. Fixes the first stop in place and greedily
// visits the closest remaining stop at each step.
export function nearestNeighborOrder(coords: Array<{ lat: number; lng: number }>): number[] {
  const n = coords.length
  if (n <= 2) return coords.map((_, i) => i)

  const visited = new Set<number>([0])
  const order: number[] = [0]

  while (order.length < n) {
    const current = order[order.length - 1]
    let nearest = -1
    let minDist = Infinity
    for (let i = 0; i < n; i++) {
      if (visited.has(i)) continue
      const d = haversineKm(coords[current], coords[i])
      if (d < minDist) { minDist = d; nearest = i }
    }
    if (nearest === -1) break
    order.push(nearest)
    visited.add(nearest)
  }

  return order
}
