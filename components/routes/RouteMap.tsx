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

const MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

function loadMapsScript(): Promise<void> {
  // Already loaded
  if ((window as unknown as { google?: { maps?: { Map?: unknown } } }).google?.maps?.Map) return Promise.resolve()

  // Script already in DOM (loading in progress)
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

export default function RouteMap({ markers }: { markers: RouteMarker[] }) {
  const mapRef = useRef<HTMLDivElement>(null)

  const validMarkers = markers.filter((m) => m.lat !== null && m.lng !== null)

  useEffect(() => {
    if (!MAPS_API_KEY || !mapRef.current || validMarkers.length === 0) return

    let cancelled = false

    loadMapsScript().then(() => {
      if (cancelled || !mapRef.current) return

      type GMapsMap = { fitBounds: (bounds: unknown) => void }
      type GMaps = { maps: { Map: new (...args: unknown[]) => GMapsMap; LatLngBounds: new () => { extend: (pos: unknown) => void }; Marker: new (...args: unknown[]) => void } }
      const google = (window as unknown as { google: GMaps }).google
      const map = new google.maps.Map(mapRef.current, {
        zoom: 12,
        center: { lat: validMarkers[0].lat, lng: validMarkers[0].lng },
        mapTypeControl: false,
        fullscreenControl: false,
        streetViewControl: false,
      })

      const bounds = new google.maps.LatLngBounds()

      validMarkers.forEach((m) => {
        const pos = { lat: m.lat!, lng: m.lng! }
        bounds.extend(pos)
        new google.maps.Marker({
          position: pos,
          map,
          label: { text: m.label, color: "#ffffff", fontWeight: "bold" },
          title: `${m.label}. ${m.name}`,
        })
      })

      if (validMarkers.length > 1) {
        map.fitBounds(bounds)
      }
    }).catch(() => {
      // Maps failed to load — the "no key" fallback will show on next render
    })

    return () => { cancelled = true }
  }, [validMarkers.map((m) => m.address).join("|")])

  if (!MAPS_API_KEY) {
    return (
      <Card>
        <CardHeader><h2 className="font-semibold text-gray-900 text-sm">Route Map</h2></CardHeader>
        <div className="flex flex-col items-center justify-center h-40 gap-2 text-center px-4 pb-4">
          <MapPin className="w-7 h-7 text-gray-300" />
          <p className="text-sm text-gray-500">
            Add <code className="bg-gray-100 px-1 rounded text-xs">NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code> to enable the map.
          </p>
        </div>
      </Card>
    )
  }

  if (validMarkers.length === 0) {
    return (
      <Card>
        <CardHeader><h2 className="font-semibold text-gray-900 text-sm">Route Map</h2></CardHeader>
        <div className="flex flex-col items-center justify-center h-40 gap-2 text-center px-4 pb-4">
          <MapPin className="w-7 h-7 text-gray-300" />
          <p className="text-sm text-gray-400">
            {markers.length === 0
              ? "Add stops to see them on the map."
              : "Could not geocode any addresses — check that the Maps API key has the Geocoding API enabled in Google Cloud Console."}
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
            {markers.length - validMarkers.length} address{markers.length - validMarkers.length !== 1 ? "es" : ""} could not be located
          </span>
        )}
      </CardHeader>
      <div ref={mapRef} className="h-80 rounded-b-xl" />
    </Card>
  )
}
