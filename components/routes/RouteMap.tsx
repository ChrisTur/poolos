"use client"

import { useEffect, useRef } from "react"
import Card, { CardHeader } from "@/components/ui/Card"
import { MapPin } from "lucide-react"

export interface RouteMarker {
  label: string
  name: string
  address: string
  lat: number | null
  lng: number | null
}

export interface StartMarker {
  lat: number
  lng: number
  address: string
}

const MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

function loadMapsScript(): Promise<void> {
  if ((window as unknown as { google?: { maps?: { Map?: unknown } } }).google?.maps?.Map) return Promise.resolve()

  const existing = document.querySelector('script[src*="maps.googleapis.com/maps/api/js"]')
  if (existing) {
    return new Promise((resolve, reject) => {
      existing.addEventListener("load", () => resolve())
      existing.addEventListener("error", reject)
    })
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement("script")
    script.src = `https://maps.googleapis.com/maps/api/js?key=${MAPS_API_KEY}`
    script.async = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error("Failed to load Google Maps"))
    document.head.appendChild(script)
  })
}

async function fetchOsrmRoute(
  coords: Array<{ lat: number; lng: number }>,
): Promise<Array<{ lat: number; lng: number }> | null> {
  // OSRM expects lng,lat order (GeoJSON) and uses semicolons between waypoints
  const path = coords.map((c) => `${c.lng},${c.lat}`).join(";")
  try {
    const res = await fetch(
      `https://router.project-osrm.org/route/v1/driving/${path}?overview=full&geometries=geojson`,
    )
    if (!res.ok) return null
    const data = await res.json()
    if (data.code !== "Ok" || !data.routes?.[0]) return null
    // Convert GeoJSON [lng, lat] back to {lat, lng} for Google Maps
    return (data.routes[0].geometry.coordinates as [number, number][]).map(
      ([lng, lat]) => ({ lat, lng }),
    )
  } catch {
    return null
  }
}

export default function RouteMap({
  markers,
  startMarker,
}: {
  markers: RouteMarker[]
  startMarker?: StartMarker
}) {
  const mapRef = useRef<HTMLDivElement>(null)
  const validMarkers = markers.filter((m) => m.lat !== null && m.lng !== null)

  // Re-run whenever stops or the start address changes
  const depKey = [
    startMarker ? `${startMarker.lat},${startMarker.lng}` : "",
    validMarkers.map((m) => m.address).join("|"),
  ].join("||")

  useEffect(() => {
    if (!MAPS_API_KEY || !mapRef.current || validMarkers.length === 0) return

    let cancelled = false

    loadMapsScript()
      .then(async () => {
        if (cancelled || !mapRef.current) return

        type GMapsMap = {
          fitBounds: (bounds: unknown, padding?: unknown) => void
        }
        type GMaps = {
          maps: {
            Map: new (...args: unknown[]) => GMapsMap
            LatLngBounds: new () => { extend: (pos: unknown) => void }
            Marker: new (...args: unknown[]) => void
            Polyline: new (...args: unknown[]) => void
            Size: new (w: number, h: number) => unknown
            Point: new (x: number, y: number) => unknown
          }
        }
        const google = (window as unknown as { google: GMaps }).google

        const centerLat = startMarker?.lat ?? validMarkers[0].lat!
        const centerLng = startMarker?.lng ?? validMarkers[0].lng!

        const map = new google.maps.Map(mapRef.current, {
          zoom: 12,
          center: { lat: centerLat, lng: centerLng },
          mapTypeControl: false,
          fullscreenControl: false,
          streetViewControl: false,
        })

        const bounds = new google.maps.LatLngBounds()

        // Start marker — green flag
        if (startMarker) {
          bounds.extend({ lat: startMarker.lat, lng: startMarker.lng })
          new google.maps.Marker({
            position: { lat: startMarker.lat, lng: startMarker.lng },
            map,
            label: { text: "S", color: "#ffffff", fontWeight: "bold", fontSize: "11px" },
            title: `Start: ${startMarker.address}`,
            icon: {
              path: "M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5S10.62 6.5 12 6.5s2.5 1.12 2.5 2.5S13.38 11.5 12 11.5z",
              fillColor: "#16a34a",
              fillOpacity: 1,
              strokeColor: "#ffffff",
              strokeWeight: 1.5,
              scale: 1.6,
              anchor: new google.maps.Point(12, 22),
            },
          })
        }

        // Stop markers — numbered blue pins
        validMarkers.forEach((m) => {
          const pos = { lat: m.lat!, lng: m.lng! }
          bounds.extend(pos)
          new google.maps.Marker({
            position: pos,
            map,
            label: { text: m.label, color: "#ffffff", fontWeight: "bold", fontSize: "11px" },
            title: `${m.label}. ${m.name}`,
          })
        })

        map.fitBounds(bounds, 40)

        if (validMarkers.length < 2) return

        // Build ordered waypoint list: start (if known) → stops
        const routeCoords: Array<{ lat: number; lng: number }> = [
          ...(startMarker ? [{ lat: startMarker.lat, lng: startMarker.lng }] : []),
          ...validMarkers.map((m) => ({ lat: m.lat!, lng: m.lng! })),
        ]

        const roadPath = await fetchOsrmRoute(routeCoords)
        if (cancelled) return

        new google.maps.Polyline({
          path: roadPath ?? routeCoords,   // fall back to straight lines only if OSRM fails
          map,
          strokeColor: "#0ea5e9",
          strokeWeight: 4,
          strokeOpacity: 0.85,
        })
      })
      .catch(() => {
        // Maps failed to load — handled by the no-key fallback below
      })

    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [depKey])

  if (!MAPS_API_KEY) {
    return (
      <Card>
        <CardHeader>
          <h2 className="font-semibold text-gray-900 text-sm">Route Map</h2>
        </CardHeader>
        <div className="flex flex-col items-center justify-center h-40 gap-2 text-center px-4 pb-4">
          <MapPin className="w-7 h-7 text-gray-300" />
          <p className="text-sm text-gray-500">
            Add{" "}
            <code className="bg-gray-100 px-1 rounded text-xs">NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code> to enable the map.
          </p>
        </div>
      </Card>
    )
  }

  if (validMarkers.length === 0) {
    return (
      <Card>
        <CardHeader>
          <h2 className="font-semibold text-gray-900 text-sm">Route Map</h2>
        </CardHeader>
        <div className="flex flex-col items-center justify-center h-40 gap-2 text-center px-4 pb-4">
          <MapPin className="w-7 h-7 text-gray-300" />
          <p className="text-sm text-gray-400">
            {markers.length === 0
              ? "Add stops to see them on the map."
              : "Could not geocode any addresses — check that the Maps API key has the Geocoding API enabled."}
          </p>
        </div>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <h2 className="font-semibold text-gray-900 text-sm">Route Map</h2>
        {markers.length > validMarkers.length && (
          <span className="text-xs text-amber-600">
            {markers.length - validMarkers.length} address
            {markers.length - validMarkers.length !== 1 ? "es" : ""} could not be located
          </span>
        )}
      </CardHeader>
      <div ref={mapRef} className="h-80 rounded-b-xl" />
    </Card>
  )
}
