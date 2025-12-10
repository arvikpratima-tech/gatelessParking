'use client'

import React, { useMemo, useState } from "react"
import RouteMap from "./route-map"
import { ParkingLocation } from "@/schemas/parking-locations"

type LatLng = { lat: number; lng: number }

type Props = {
    parking: Pick<ParkingLocation, "gpscoords" | "address">
}

export default function NavigateToParkingLite({ parking }: Props) {
    const [userLocation, setUserLocation] = useState<LatLng | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [showRoute, setShowRoute] = useState(false)
    const destination = parking.gpscoords

    const mapsLink = useMemo(() => {
        return `https://www.google.com/maps/dir/?api=1&destination=${destination.lat},${destination.lng}&travelmode=driving`
    }, [destination])

    const requestLocation = () => {
        if (!navigator.geolocation) {
            setError("Geolocation not supported in this browser.")
            return
        }
        setError(null)
        navigator.geolocation.getCurrentPosition(
            pos => {
                setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude })
                setShowRoute(true)
            },
            err => {
                setError(err.message || "Could not get your location.")
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 5000 }
        )
    }

    return (
        <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
                <button
                    onClick={requestLocation}
                    className="px-4 py-2 rounded-md bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition"
                >
                    Navigate to this parking
                </button>
                <a
                    href={mapsLink}
                    target="_blank"
                    rel="noreferrer"
                    className="px-4 py-2 rounded-md border border-slate-300 text-slate-700 text-sm font-medium hover:bg-slate-50 transition"
                >
                    Open in Google Maps
                </a>
            </div>
            {error && (
                <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-2 py-1">
                    {error}
                </div>
            )}
            {showRoute && userLocation && (
                <RouteMap
                    origin={userLocation}
                    destination={destination}
                    onRoute={() => {}}
                />
            )}
        </div>
    )
}



