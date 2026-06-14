"use client"

import { useEffect, useRef } from "react"
import type { RouteStop, Customer } from "@/app/generated/prisma/client"
import Card, { CardHeader, CardBody } from "@/components/ui/Card"
import { MapPin } from "lucide-react"

type StopWithCustomer = RouteStop & { customer: Customer }

const MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

export default function RouteMap({ stops }: { stops: StopWithCustomer[] }) {
  const mapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!MAPS_API_KEY || !mapRef.current || stops.length === 0) return

    const script = document.createElement("script")
    script.src = `https://maps.googleapis.com/maps/api/js?key=${MAPS_API_KEY}&callback=initRouteMap`
    script.async = true
    ;(window as any).initRouteMap = () => {
      const map = new (window as any).google.maps.Map(mapRef.current, {
        zoom: 12,
        center: { lat: 0, lng: 0 },
      })
      const bounds = new (window as any).google.maps.LatLngBounds()
      const geocoder = new (window as any).google.maps.Geocoder()

      stops.forEach((stop, i) => {
        const addr = `${stop.customer.address}, ${stop.customer.city}, ${stop.customer.state} ${stop.customer.zip}`
        geocoder.geocode({ address: addr }, (results: any, status: string) => {
          if (status !== "OK") return
          const pos = results[0].geometry.location
          bounds.extend(pos)
          new (window as any).google.maps.Marker({
            position: pos,
            map,
            label: String(i + 1),
            title: `${stop.customer.firstName} ${stop.customer.lastName}`,
          })
          map.fitBounds(bounds)
        })
      })
    }
    document.head.appendChild(script)
    return () => { document.head.removeChild(script) }
  }, [stops])

  if (!MAPS_API_KEY) {
    return (
      <Card>
        <CardHeader><h2 className="font-semibold text-gray-900 text-sm">Route Map</h2></CardHeader>
        <CardBody>
          <div className="flex flex-col items-center justify-center py-10 text-center gap-3">
            <MapPin className="w-8 h-8 text-gray-300" />
            <div>
              <p className="text-sm font-medium text-gray-600">Map not configured</p>
              <p className="text-xs text-gray-400 mt-1">
                Add <code className="bg-gray-100 px-1 rounded">NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code> to your{" "}
                <code className="bg-gray-100 px-1 rounded">.env.local</code> to enable the map.
              </p>
            </div>
          </div>
        </CardBody>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader><h2 className="font-semibold text-gray-900 text-sm">Route Map</h2></CardHeader>
      <div ref={mapRef} className="h-80 rounded-b-xl" />
    </Card>
  )
}
