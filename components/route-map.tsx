'use client'

import React, { useEffect, useMemo, useRef, useState } from "react"
import { useJsApiLoader, DirectionsService, DirectionsRenderer } from "@react-google-maps/api"
import { GOOGLE_MAPS_LIBRARIES } from "@/lib/google-maps"
import Map from "./map"

type LatLng = { lat: number; lng: number }
type TravelModeString = google.maps.TravelMode | "DRIVING" | "WALKING" | "BICYCLING" | "TRANSIT"

type RouteMapProps = {
    destination: LatLng
    origin?: LatLng | null
    travelMode?: TravelModeString
    onRoute?: (result: google.maps.DirectionsResult) => void
}

/**
 * A thin wrapper to render directions on top of the existing Map component.
 * It keeps its own directions state and only renders DirectionsService when both
 * origin and destination are present, avoiding hook-order issues in the shared map.
 */
export default function RouteMap({ destination, origin, travelMode = "DRIVING", onRoute }: RouteMapProps) {
    const [directionsResult, setDirectionsResult] = useState<google.maps.DirectionsResult | null>(null)
    const [directionsError, setDirectionsError] = useState<string | null>(null)

    const apiKey = process.env.NEXT_PUBLIC_MAPS_API_KEY;

    const { isLoaded, loadError } = useJsApiLoader({
        googleMapsApiKey: apiKey || "",
        libraries: GOOGLE_MAPS_LIBRARIES,
    })

    // Prepare mapParams with just the destination marker
    const mapParams = useMemo(() => JSON.stringify([{
        address: "",
        gpscoords: destination,
        type: "DESTINATION",
        id: "dest"
    }]), [destination])

    const directionsOptions = useMemo(() => {
        if (!origin) return null
        // travelMode can be a string; DirectionsService accepts the string values (e.g., "DRIVING")
        return {
            origin,
            destination,
            travelMode,
        }
    }, [origin, destination, travelMode])

    // Reset when origin/destination changes
    useEffect(() => {
        setDirectionsResult(null)
        setDirectionsError(null)
    }, [origin, destination, travelMode])

    if (loadError) {
        return <div className="text-sm text-red-500">Failed to load Google Maps.</div>
    }

    if (!isLoaded) {
        return <div className="h-[300px] flex items-center justify-center text-slate-400 text-sm">Loading map…</div>
    }

    return (
        <div className="space-y-2">
            <div className="rounded-lg border border-slate-200 overflow-hidden">
                <div style={{ height: '400px', width: '100%' }}>
                    <Map
                        mapParams={mapParams}
                        origin={origin || undefined}
                        destination={destination}
                    />
                    {directionsOptions && (
                        <>
                            <DirectionsService
                                options={directionsOptions}
                                callback={(result, status) => {
                                    if (status === google.maps.DirectionsStatus.OK && result) {
                                        setDirectionsResult(result)
                                        setDirectionsError(null)
                                        onRoute?.(result)
                                    } else if (status !== google.maps.DirectionsStatus.OK) {
                                        setDirectionsError(`Directions failed: ${status}`)
                                    }
                                }}
                            />
                            {directionsResult && (
                                <DirectionsRenderer
                                    options={{
                                        directions: directionsResult,
                                        suppressMarkers: false,
                                    }}
                                />
                            )}
                        </>
                    )}
                </div>
            </div>
            {directionsError && (
                <div className="text-xs text-red-500 bg-red-50 border border-red-200 rounded px-2 py-1">
                    {directionsError}
                </div>
            )}
        </div>
    )
}

